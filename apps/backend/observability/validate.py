#!/usr/bin/env python3
"""Validate deploy contracts, Alloy syntax, dashboard queries and alert behavior."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

import yaml

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ALLOY = 'grafana/alloy:v1.18.0'
PROMETHEUS = 'prom/prometheus:v3.5.0'


def run(*args, **kwargs):
    result = subprocess.run(args, capture_output=True, text=True, **kwargs)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout


def main():
    dashboard = json.loads((HERE / 'grafana/dashboards/bitfinance-operations.json').read_text())
    alerts = json.loads((HERE / 'grafana/alerts/bitfinance-alerts.json').read_text())
    assert len({panel['id'] for panel in dashboard['panels']}) == len(dashboard['panels'])
    assert len({rule['uid'] for rule in alerts}) == len(alerts)
    env = {key: os.environ[key] for key in ['PATH', 'HOME', 'DOCKER_HOST', 'DOCKER_CONTEXT'] if key in os.environ}
    env.update(GRAFANA_CLOUD_OTLP_ENDPOINT='http://127.0.0.1:9', GRAFANA_CLOUD_INSTANCE_ID='test',
               GRAFANA_CLOUD_API_KEY='test', MCP_BIND_ADDRESS='127.0.0.1')
    config = json.loads(run('docker', 'compose', '--env-file', str(HERE.parent / '.env.prod.example'),
        '-f', str(HERE.parent / 'docker-compose.yml'), '-f', str(HERE.parent / 'docker-compose.prod.yml'),
        'config', '--format', 'json', env=env))
    services = config['services']
    for name in ['bitfinance-api', 'bitfinance-mcp-server']:
        assert 'bitfinance-alloy' not in services[name].get('depends_on', {})
        assert not any(key.startswith('GRAFANA_CLOUD_') for key in services[name]['environment'])
        assert services[name]['environment']['OTEL_EXPORTER_OTLP_ENDPOINT'] == 'http://bitfinance-alloy:4317'
    assert all(port['host_ip'] == '127.0.0.1' and port['target'] == 12345
               for port in services['bitfinance-alloy']['ports'])
    assert not any(port['target'] in (4317, 4318) for port in services['bitfinance-alloy']['ports'])
    run('docker', 'run', '--rm', '-e', 'GRAFANA_CLOUD_OTLP_ENDPOINT=http://127.0.0.1:9',
        '-e', 'GRAFANA_CLOUD_INSTANCE_ID=test', '-e', 'GRAFANA_CLOUD_API_KEY=test', '-e', 'ALLOY_ENVIRONMENT=test',
        '-v', f'{HERE}/alloy/config.alloy:/etc/alloy/config.alloy:ro', ALLOY, 'validate', '/etc/alloy/config.alloy')
    formatted = run('docker', 'run', '--rm', '-v', f'{HERE}/alloy/config.alloy:/etc/alloy/config.alloy:ro',
                    ALLOY, 'fmt', '/etc/alloy/config.alloy')
    assert formatted == (HERE / 'alloy/config.alloy').read_text(), 'Run alloy fmt --write'
    run('bash', '-n', str(HERE / 'deploy.sh'))
    for name in ['backend', 'mcp']:
        workflow = yaml.safe_load((ROOT / f'.github/workflows/{name}-docker-publish.yml').read_text())
        for step in workflow['jobs']['deploy']['steps']:
            if 'run' in step:
                run('bash', '-n', input=step['run'])

    with tempfile.TemporaryDirectory(prefix='bitfinance-observability-validate-') as directory:
        temp = Path(directory)
        # The Prometheus image runs as nobody; Linux preserves bind-mount modes.
        # Only generated, non-secret validation fixtures are placed here.
        temp.chmod(0o755)
        rules = [{'alert': rule['uid'].replace('-', '_'), 'expr': '(' + rule['data'][0]['model']['expr'] + ') > 0',
                  'for': rule['for'], 'labels': rule['labels'], 'annotations': rule['annotations']} for rule in alerts]
        rules.extend({'record': f'validation_panel_{panel["id"]}_{target["refId"]}',
                      'expr': target['expr'].replace('$environment', 'production')}
                     for panel in dashboard['panels'] for target in panel['targets'])
        (temp / 'rules.json').write_text(json.dumps({'groups': [{'name': 'validation', 'rules': rules}]}))
        rule = alerts[0]
        series = 'probe_success{job="bitfinance/bitfinance-alloy", deployment_environment_name="production", service="bitfinance-api"}'
        test = {'rule_files': ['rules.json'], 'evaluation_interval': '30s', 'tests': [{
            'interval': '30s', 'input_series': [{'series': series, 'values': '1 0 0 0 0 0 1 1'}],
            'alert_rule_test': [
                {'eval_time': '1m', 'alertname': 'bf_api_ready', 'exp_alerts': []},
                {'eval_time': '2m30s', 'alertname': 'bf_api_ready', 'exp_alerts': [
                    {'exp_labels': rule['labels'], 'exp_annotations': rule['annotations']}]},
                {'eval_time': '3m', 'alertname': 'bf_api_ready', 'exp_alerts': []}]}]}
        (temp / 'tests.json').write_text(json.dumps(test))
        run('docker', 'run', '--rm', '--entrypoint', 'promtool', '-v', f'{temp}:/work:ro', '-w', '/work',
            PROMETHEUS, 'check', 'rules', 'rules.json')
        run('docker', 'run', '--rm', '--entrypoint', 'promtool', '-v', f'{temp}:/work:ro', '-w', '/work',
            PROMETHEUS, 'test', 'rules', 'tests.json')
        # Exercise deploy failure isolation using a fake Docker executable.
        (temp / 'docker').write_text('''#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$TEST_COMMANDS"
case "$*" in
  *"pull bitfinance-alloy"*) exit "${TEST_ALLOY_FAILURE:-0}" ;;
  *"--wait --wait-timeout"*) exit "${TEST_PRODUCT_FAILURE:-0}" ;;
esac
''')
        (temp / 'docker').chmod(0o755)
        for file in ['docker-compose.yml', 'docker-compose.prod.yml', '.env', 'observability/alloy/config.alloy']:
            path = temp / file; path.parent.mkdir(parents=True, exist_ok=True); path.touch()
        for target in ['backend', 'mcp']:
            calls = temp / 'calls'
            settings = dict(env, PATH=f'{temp}:' + env['PATH'], IMAGE_TAG='test', MCP_IMAGE_TAG='test',
                            TEST_COMMANDS=str(calls), TEST_ALLOY_FAILURE='1')
            run('bash', str(HERE / 'deploy.sh'), target, env=settings, cwd=temp)
            assert 'health/ready' in calls.read_text(), 'Alloy failure skipped product readiness'
            failed = subprocess.run(['bash', str(HERE / 'deploy.sh'), target], cwd=temp,
                                    env=dict(settings, TEST_PRODUCT_FAILURE='1'), capture_output=True)
            assert failed.returncode != 0, 'Unhealthy product deploy succeeded'
    print(f'Validated Compose isolation, Alloy, deploy failure handling, {len(dashboard["panels"])} panels, '
          f'{len(alerts)} alerts, and alert firing/recovery.')


if __name__ == '__main__':
    main()
