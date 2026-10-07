#!/usr/bin/env python3
"""Exercise real API/MCP binaries with disposable PostgreSQL and Alloy.

Build both .NET projects first and install requirements-test.txt in a venv.
No repository .env or Cloud credentials are read; all OTLP stays in this test.
"""
import gzip
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from google.protobuf.json_format import MessageToDict
from opentelemetry.proto.collector.logs.v1.logs_service_pb2 import ExportLogsServiceRequest
from opentelemetry.proto.collector.metrics.v1.metrics_service_pb2 import ExportMetricsServiceRequest
from opentelemetry.proto.collector.trace.v1.trace_service_pb2 import ExportTraceServiceRequest

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def run(*args, **kwargs):
    return subprocess.run(args, check=True, capture_output=True, text=True, **kwargs).stdout.strip()


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def wait_for(check, label, timeout=90):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        try:
            if check():
                return
        except (OSError, urllib.error.URLError, subprocess.CalledProcessError):
            pass
        time.sleep(0.5)
    raise AssertionError('Timed out: ' + label)


def http(url, body=None, headers=None):
    request = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
                                     headers=headers or {'Content-Type': 'application/json'})
    try:
        with OPENER.open(request, timeout=10) as response:
            return response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()


def main():
    capture = {'traces': [], 'metrics': [], 'logs': []}
    capture_lock = threading.Lock()
    types = {'traces': ExportTraceServiceRequest, 'metrics': ExportMetricsServiceRequest,
             'logs': ExportLogsServiceRequest}

    class Receiver(BaseHTTPRequestHandler):
        def do_POST(self):
            signal = self.path.rsplit('/', 1)[-1]
            payload = self.rfile.read(int(self.headers['Content-Length']))
            if self.headers.get('Content-Encoding') == 'gzip':
                payload = gzip.decompress(payload)
            message = types[signal].FromString(payload)
            with capture_lock:
                capture[signal].append(message)
            self.send_response(200)
            self.send_header('Content-Type', 'application/x-protobuf')
            self.send_header('Content-Length', '0')
            self.end_headers()

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(('0.0.0.0', 0), Receiver)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    prefix = 'bitfinance-otel-test-' + uuid.uuid4().hex[:10]
    db, alloy = prefix + '-db', prefix + '-alloy'
    db_port, api_port, mcp_port, grpc_port, http_port, ui_port = [free_port() for _ in range(6)]
    processes, logs = [], []
    with tempfile.TemporaryDirectory(prefix=prefix) as temporary:
        temp = Path(temporary)
        try:
            run('docker', 'run', '-d', '--name', db, '-p', f'127.0.0.1:{db_port}:5432',
                '-v', '/var/lib/postgresql/data', '-e', 'POSTGRES_PASSWORD=test-password',
                'postgres:17-alpine')
            wait_for(lambda: run('docker', 'exec', db, 'pg_isready', '-U', 'postgres'), 'PostgreSQL')
            config = (HERE / 'alloy/config.alloy').read_text()
            config = config.replace('http://bitfinance-api:8080', f'http://host.docker.internal:{api_port}')
            config = config.replace('http://bitfinance-mcp-server:8090', f'http://host.docker.internal:{mcp_port}')
            (temp / 'config.alloy').write_text(config)
            run('docker', 'run', '-d', '--name', alloy, '--memory', '192m', '--cpus', '0.25',
                '--add-host', 'host.docker.internal:host-gateway',
                '-p', f'127.0.0.1:{grpc_port}:4317', '-p', f'127.0.0.1:{http_port}:4318',
                '-p', f'127.0.0.1:{ui_port}:12345',
                '-e', f'GRAFANA_CLOUD_OTLP_ENDPOINT=http://host.docker.internal:{server.server_port}',
                '-e', 'GRAFANA_CLOUD_INSTANCE_ID=test', '-e', 'GRAFANA_CLOUD_API_KEY=test',
                '-e', 'ALLOY_ENVIRONMENT=test', '-e', 'GOMEMLIMIT=150MiB',
                '-v', f'{temp}/config.alloy:/etc/alloy/config.alloy:ro',
                'grafana/alloy:v1.18.0', 'run', '--server.http.listen-addr=0.0.0.0:12345',
                '/etc/alloy/config.alloy')
            wait_for(lambda: http(f'http://127.0.0.1:{ui_port}/-/ready')[0] == 200, 'Alloy readiness')
            # Deliberately avoid inheriting production application configuration.
            env = {key: os.environ[key] for key in ['PATH', 'HOME', 'DOTNET_ROOT', 'TMPDIR'] if key in os.environ}
            env.update({
                'ASPNETCORE_ENVIRONMENT': 'Staging', 'DOTNET_ENVIRONMENT': 'Staging',
                'ASPNETCORE_URLS': f'http://0.0.0.0:{api_port}',
                'ConnectionStrings__Database': f'Host=127.0.0.1;Port={db_port};Database=postgres;Username=postgres;Password=test-password',
                'AppSettings__CacheEnabled': 'false', 'Jwt__Key': 'test-signing-key-only-never-production-0123456789',
                'Jwt__Issuer': 'test', 'Jwt__Audience': 'test', 'Jwt__ExpirationInMinutes': '60',
                'Storage__BucketName': 'test', 'Storage__Region': 'us-east-1',
                'Storage__ServiceUrl': 'http://127.0.0.1:9', 'AWS_ACCESS_KEY_ID': 'test', 'AWS_SECRET_ACCESS_KEY': 'test',
                'Notifications__EmailEnabled': 'false', 'Observability__Enabled': 'true',
                'Observability__Environment': 'test', 'Observability__TraceSamplingRatio': '1',
                'OTEL_EXPORTER_OTLP_ENDPOINT': f'http://127.0.0.1:{grpc_port}', 'OTEL_EXPORTER_OTLP_PROTOCOL': 'grpc',
                'OTEL_METRIC_EXPORT_INTERVAL': '2000', 'OTEL_BSP_SCHEDULE_DELAY': '100',
                'OTEL_BLRP_SCHEDULE_DELAY': '100',
            })
            api_dir = ROOT / 'apps/backend/src/BitFinance.API'
            mcp_dir = ROOT / 'apps/mcp-server/src'
            api_dll = api_dir / 'bin/Debug/net10.0/BitFinance.API.dll'
            mcp_dll = mcp_dir / 'bin/Debug/net10.0/BitFinance.MCP.dll'
            run('dotnet', str(api_dll), '--migrate', env=env, cwd=api_dir, timeout=90)
            assert not capture['traces'] and not capture['logs'], 'Migration exported application telemetry'

            def start(dll, cwd, settings, name):
                log = open(temp / (name + '.log'), 'w+')
                logs.append(log)
                process = subprocess.Popen(['dotnet', str(dll)], cwd=cwd, env=settings,
                                           stdout=log, stderr=log)
                processes.append(process)

            start(api_dll, api_dir, env, 'api')
            api_url, mcp_url = f'http://127.0.0.1:{api_port}', f'http://127.0.0.1:{mcp_port}'
            wait_for(lambda: http(api_url + '/health/ready')[0] == 200, 'API readiness')
            status, body = http(api_url + '/api/v1/identity/register', {
                'firstName': 'otel-secret-first', 'lastName': 'otel-secret-last',
                'email': 'otel-secret-email@example.invalid', 'password': 'Test-otel-secret-password-123!'})
            assert status == 200, ('Registration failed', status, body)
            mcp_env = dict(env, ASPNETCORE_URLS=f'http://0.0.0.0:{mcp_port}',
                           BITFINANCE_API_BASE_URL=api_url, BITFINANCE_AGENT_EMAIL='otel-secret-email@example.invalid',
                           BITFINANCE_AGENT_PASSWORD='Test-otel-secret-password-123!',
                           BITFINANCE_MCP_BEARER_TOKEN='otel-secret-bearer',
                           # Exercise the alternate configured exporter protocol too.
                           OTEL_EXPORTER_OTLP_ENDPOINT=f'http://127.0.0.1:{http_port}',
                           OTEL_EXPORTER_OTLP_PROTOCOL='http/protobuf')
            start(mcp_dll, mcp_dir, mcp_env, 'mcp')
            wait_for(lambda: http(mcp_url + '/health/ready')[0] == 200, 'MCP readiness')
            headers = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream',
                       'Authorization': 'Bearer otel-secret-bearer', 'MCP-Protocol-Version': '2025-03-26'}

            def tool_call():
                trace_id = uuid.uuid4().hex
                call_headers = dict(headers, traceparent=f'00-{trace_id}-0123456789abcdef-01')
                status, body = http(mcp_url + '/mcp', {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call',
                    'params': {'name': 'bitfinance_list_organizations', 'arguments': {}}}, call_headers)
                if body.startswith('event:') or body.startswith('data:'):
                    body = next(line[5:].strip() for line in body.splitlines() if line.startswith('data:'))
                result = json.loads(body)
                assert status == 200 and 'error' not in result and not result.get('result', {}).get('isError'), result
                return trace_id

            trace_id = tool_call()

            def spans_for(identifier):
                with capture_lock:
                    return [(dict((a.key, a.value.string_value) for a in group.resource.attributes).get('service.name'), span)
                            for export in capture['traces'] for group in export.resource_spans
                            for scope in group.scope_spans for span in scope.spans if span.trace_id.hex() == identifier]

            wait_for(lambda: any(span.name == 'postgresql.command' for _, span in spans_for(trace_id)), 'MCP → API → PostgreSQL trace')
            spans = spans_for(trace_id)
            assert {'bitfinance-api', 'bitfinance-mcp'} <= {name for name, _ in spans}
            assert any(span.name == 'mcp.tool' for _, span in spans)
            assert any(span.kind == 3 for name, span in spans if name == 'bitfinance-mcp'), 'Missing HTTP client span'
            run('docker', 'stop', '-t', '2', alloy)
            tool_call()
            assert http(api_url + '/health/ready')[0] == http(mcp_url + '/health/ready')[0] == 200
            run('docker', 'start', alloy)
            wait_for(lambda: http(f'http://127.0.0.1:{ui_port}/-/ready')[0] == 200, 'Alloy recovery')
            recovered_trace = tool_call()
            wait_for(lambda: any(span.name == 'mcp.tool' for _, span in spans_for(recovered_trace)), 'Telemetry recovery')
            run('docker', 'stop', '-t', '2', db)
            assert http(api_url + '/health/live')[0] == http(mcp_url + '/health/live')[0] == 200
            assert http(api_url + '/health/ready')[0] == http(mcp_url + '/health/ready')[0] == 503
            run('docker', 'start', db)
            wait_for(lambda: http(api_url + '/health/ready')[0] == http(mcp_url + '/health/ready')[0] == 200, 'Dependency recovery')
            wait_for(lambda: all(capture.values()), 'All three OTLP signals')
            with capture_lock:
                assert any(record.trace_id.hex() == trace_id for export in capture['logs']
                           for group in export.resource_logs for scope in group.scope_logs
                           for record in scope.log_records), 'Missing log/trace correlation'
                metric_services = {attribute.value.string_value for export in capture['metrics']
                                   for group in export.resource_metrics for attribute in group.resource.attributes
                                   if attribute.key == 'service.name'}
                assert {'bitfinance-api', 'bitfinance-mcp'} <= metric_services
            # Wait for actual operational probes (30s collection interval).
            def metric_names():
                with capture_lock:
                    return {metric.name for export in capture['metrics'] for group in export.resource_metrics
                            for scope in group.scope_metrics for metric in scope.metrics}
            wait_for(lambda: 'probe_success' in metric_names(), 'Private readiness probe metrics')
            for process in processes:
                process.terminate()
                process.wait(timeout=20)
            with capture_lock:
                exported = json.dumps({signal: [MessageToDict(item) for item in messages]
                                       for signal, messages in capture.items()})
            assert 'otel-secret' not in exported, 'Privacy sentinel was exported'
            for log in logs:
                log.flush(); log.seek(0)
                assert 'otel-secret' not in log.read(), 'Privacy sentinel was logged to console'
            print(json.dumps({'result': 'passed', 'signals': {k: len(v) for k, v in capture.items()},
                              'correlated_spans': len(spans), 'metric_names': sorted(metric_names()),
                              'collector_outage': 'healthy applications and recovered export',
                              'database_outage': 'live=200, ready=503, recovered=200'}, indent=2))
        except Exception:
            print(run('docker', 'logs', alloy)[-12000:])
            with capture_lock:
                print('Captured metrics:', sorted({metric.name for export in capture['metrics'] for group in export.resource_metrics
                      for scope in group.scope_metrics for metric in scope.metrics}))
            for log in logs:
                log.flush(); log.seek(0)
                print(log.read()[-12000:])
            raise
        finally:
            for process in processes:
                if process.poll() is None:
                    process.terminate()
                    try:
                        process.wait(timeout=15)
                    except subprocess.TimeoutExpired:
                        process.kill(); process.wait()
            for log in logs:
                log.close()
            for name in [alloy, db]:
                subprocess.run(['docker', 'rm', '-f', '-v', name], capture_output=True)
            server.shutdown()


if __name__ == '__main__':
    main()
