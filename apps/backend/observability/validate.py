#!/usr/bin/env python3
"""Validate the Grafana dashboard and alerts and the compose isolation of Alloy.

Requires Docker. Alert expressions and dashboard queries are checked with
promtool, and the API readiness and storage alerts are tested end to end.
"""
import json
import os
from pathlib import Path
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
BACKEND = HERE.parent
ROOT = BACKEND.parents[1]
PROMETHEUS = 'prom/prometheus:v3.15.1'
RUNBOOK = 'https://github.com/gustmrg/bitfinance/blob/main/docs/observability.md'


def run(*args, **kwargs):
    result = subprocess.run(args, capture_output=True, text=True, **kwargs)
    if result.returncode:
        raise RuntimeError(' '.join(args) + '\n' + result.stdout + result.stderr)
    return result.stdout


def compose_config(*files, env_file, profile=None, extra_env=None):
    env = {key: os.environ[key] for key in ['PATH', 'HOME', 'DOCKER_HOST', 'DOCKER_CONTEXT'] if key in os.environ}
    env.update(extra_env or {})
    args = ['docker', 'compose', '--env-file', str(env_file)]
    for file in files:
        args += ['-f', str(file)]
    if profile:
        args += ['--profile', profile]
    return json.loads(run(*args, 'config', '--format', 'json', env=env))['services']


def check_compose():
    prod = compose_config(BACKEND / 'docker-compose.yml', BACKEND / 'docker-compose.prod.yml',
                          env_file=BACKEND / '.env.prod.example', profile='observability')
    api = prod['bitfinance-api']['environment']
    assert api['OTEL_EXPORTER_OTLP_ENDPOINT'] == 'http://bitfinance-alloy:4317'
    assert api['Observability__Enabled'] == 'false', 'Export must stay off until .env enables it'
    assert not any(key.startswith('GRAFANA_CLOUD_') for key in api)
    assert 'bitfinance-alloy' not in prod['bitfinance-api'].get('depends_on', {})
    ports = prod['bitfinance-alloy']['ports']
    assert ports and all(port['host_ip'] == '127.0.0.1' and port['target'] == 12345 for port in ports)
    assert prod['bitfinance-alloy']['environment']['ALLOY_ENVIRONMENT'] == 'production'

    without_profile = compose_config(BACKEND / 'docker-compose.yml', BACKEND / 'docker-compose.prod.yml',
                                     env_file=BACKEND / '.env.prod.example')
    assert 'bitfinance-alloy' not in without_profile

    mcp = compose_config(ROOT / 'apps/mcp-server/docker-compose.yml',
                         env_file=ROOT / 'apps/mcp-server/.env.prod.example',
                         extra_env={'MCP_BIND_ADDRESS': '127.0.0.1'})['bitfinance-mcp-server']['environment']
    assert mcp['OTEL_EXPORTER_OTLP_ENDPOINT'] == 'http://bitfinance-alloy:4317'
    assert mcp['Observability__Enabled'] == 'false'
    assert not any(key.startswith('GRAFANA_CLOUD_') for key in mcp)


def check_grafana(dashboard, alerts):
    assert len({panel['id'] for panel in dashboard['panels']}) == len(dashboard['panels'])
    assert all(panel['targets'] for panel in dashboard['panels'])
    assert len({rule['uid'] for rule in alerts}) == len(alerts)
    assert all(rule['annotations']['runbook_url'] == RUNBOOK for rule in alerts)
    assert all(link['url'] == RUNBOOK for link in dashboard['links'])
    for rule in alerts:
        assert 'deployment_environment_name="production"' in rule['data'][0]['model']['expr'], rule['uid']
        assert rule['labels']['severity'] in {'critical', 'high', 'medium'}, rule['uid']


def check_rules(dashboard, alerts):
    with tempfile.TemporaryDirectory(prefix='bitfinance-observability-validate-') as directory:
        temp = Path(directory)
        temp.chmod(0o755)
        rules = [{'alert': rule['uid'].replace('-', '_'), 'expr': '(' + rule['data'][0]['model']['expr'] + ') > 0',
                  'for': rule['for'], 'labels': rule['labels'], 'annotations': rule['annotations']}
                 for rule in alerts]
        rules.extend({'record': f'validation_panel_{panel["id"]}_{target["refId"]}',
                      'expr': target['expr'].replace('$environment', 'production')}
                     for panel in dashboard['panels'] for target in panel['targets'])
        (temp / 'rules.json').write_text(json.dumps({'groups': [{'name': 'validation', 'rules': rules}]}))
        by_uid = {rule['uid']: rule for rule in alerts}
        probe = ('probe_success{job="bitfinance/bitfinance-alloy",deployment_environment_name="production",'
                 'service="bitfinance-api"}')
        storage = ('bitfinance_dependency_status{job="bitfinance/bitfinance-api",'
                   'deployment_environment_name="production",dependency="storage"}')
        tests = {'rule_files': ['rules.json'], 'evaluation_interval': '30s', 'tests': [
            {'interval': '30s', 'input_series': [{'series': probe, 'values': '1 0 0 0 0 0 1 1'}],
             'alert_rule_test': [
                 {'eval_time': '1m', 'alertname': 'bf_api_ready', 'exp_alerts': []},
                 {'eval_time': '2m30s', 'alertname': 'bf_api_ready', 'exp_alerts': [
                     {'exp_labels': by_uid['bf-api-ready']['labels'],
                      'exp_annotations': by_uid['bf-api-ready']['annotations']}]},
                 {'eval_time': '3m30s', 'alertname': 'bf_api_ready', 'exp_alerts': []}]},
            {'interval': '1m', 'input_series': [{'series': storage, 'values': '1 0 0 0 0 0 0 0 1'}],
             'alert_rule_test': [
                 {'eval_time': '4m', 'alertname': 'bf_storage_unhealthy', 'exp_alerts': []},
                 {'eval_time': '6m', 'alertname': 'bf_storage_unhealthy', 'exp_alerts': [
                     {'exp_labels': by_uid['bf-storage-unhealthy']['labels'],
                      'exp_annotations': by_uid['bf-storage-unhealthy']['annotations']}]},
                 {'eval_time': '8m', 'alertname': 'bf_storage_unhealthy', 'exp_alerts': []}]},
        ]}
        (temp / 'tests.json').write_text(json.dumps(tests))
        promtool = ['docker', 'run', '--rm', '--entrypoint', 'promtool', '-v', f'{temp}:/work:ro', '-w', '/work',
                    PROMETHEUS]
        run(*promtool, 'check', 'rules', 'rules.json')
        run(*promtool, 'test', 'rules', 'tests.json')


def main():
    dashboard = json.loads((HERE / 'grafana/dashboards/bitfinance-operations.json').read_text())
    alerts = json.loads((HERE / 'grafana/alerts/bitfinance-alerts.json').read_text())
    check_grafana(dashboard, alerts)
    check_compose()
    check_rules(dashboard, alerts)
    print(f'Validated compose isolation, {len(dashboard["panels"])} panels and {len(alerts)} alerts.')


if __name__ == '__main__':
    main()
