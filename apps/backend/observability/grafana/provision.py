#!/usr/bin/env python3
"""Prepare or apply the BitFinance dashboard and Grafana-managed alerts.

Requires a Grafana service account token only with --apply. The OTLP ingestion
key is deliberately not used for dashboard or alert administration.
"""
import argparse
import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

HERE = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--grafana-url', required=True)
    parser.add_argument('--prometheus-uid', required=True)
    parser.add_argument('--folder-uid', default='bitfinance')
    parser.add_argument('--apply', action='store_true', help='Write prepared resources to Grafana')
    args = parser.parse_args()
    parsed = urllib.parse.urlparse(args.grafana_url)
    if parsed.scheme != 'https' or not parsed.netloc or parsed.username or parsed.password:
        parser.error('--grafana-url must be an HTTPS URL without credentials')
    dashboard = json.loads((HERE / 'dashboards/bitfinance-operations.json').read_text())
    dashboard['templating']['list'][0]['current'] = {'text': args.prometheus_uid, 'value': args.prometheus_uid}
    alerts = json.loads((HERE / 'alerts/bitfinance-alerts.json').read_text())
    for alert in alerts:
        alert['folderUID'] = args.folder_uid
        alert['data'][0]['datasourceUid'] = args.prometheus_uid
    if not args.apply:
        print(json.dumps({'dashboard': dashboard, 'folderUid': args.folder_uid, 'alerts': alerts}, indent=2))
        return
    token = os.environ.get('GRAFANA_SERVICE_ACCOUNT_TOKEN')
    if not token:
        parser.error('GRAFANA_SERVICE_ACCOUNT_TOKEN is required with --apply')
    base = args.grafana_url.rstrip('/')

    def request(method, path, payload=None, allow_missing=False):
        req = urllib.request.Request(base + path, method=method,
            data=json.dumps(payload).encode() if payload is not None else None,
            headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                body = response.read()
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as error:
            if allow_missing and error.code == 404:
                return None
            # Do not echo arbitrary server bodies or credential-bearing requests.
            raise SystemExit(f'Grafana {method} {path} failed with HTTP {error.code}') from None

    folder_path = '/api/folders/' + urllib.parse.quote(args.folder_uid, safe='')
    if request('GET', folder_path, allow_missing=True) is None:
        request('POST', '/api/folders', {'uid': args.folder_uid, 'title': 'BitFinance'})
    saved = request('POST', '/api/dashboards/db', {'dashboard': dashboard,
        'folderUid': args.folder_uid, 'overwrite': True, 'message': 'Provision BitFinance observability'})
    for alert in alerts:
        path = '/api/v1/provisioning/alert-rules/' + alert['uid']
        existing = request('GET', path, allow_missing=True)
        if existing is None:
            request('POST', '/api/v1/provisioning/alert-rules', alert)
        else:
            request('PUT', path, alert)
        actual = request('GET', path)
        if actual['data'][0]['model']['expr'] != alert['data'][0]['model']['expr']:
            raise SystemExit('Grafana alert readback differed: ' + alert['uid'])
    request('GET', '/api/dashboards/uid/' + dashboard['uid'])
    print(f'Provisioned dashboard {base}{saved.get("url", "")} and {len(alerts)} alerts.')


if __name__ == '__main__':
    main()
