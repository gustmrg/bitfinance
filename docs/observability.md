# Observability

The API and the MCP server emit logs, metrics and traces with OpenTelemetry. A Grafana Alloy collector on the same Docker network receives them and forwards them to Grafana Cloud. Export is off by default; health checks and console logs work whether it is on or off.

```text
bitfinance-api ─┐
                ├─ OTLP/gRPC (Docker network) ─> bitfinance-alloy ─> Grafana Cloud (OTLP/HTTP)
bitfinance-mcp ─┘
```

Only Alloy holds the Grafana Cloud credentials. If Alloy or Grafana Cloud is unreachable, the API and the MCP server keep serving requests; their exporters retry in the background and drop data once their buffers are full.

## Signals

| Signal | API (`bitfinance-api`) | MCP server (`bitfinance-mcp`) |
|---|---|---|
| Traces | ASP.NET Core requests, outgoing HTTP, PostgreSQL commands (without SQL text), worker cycles | ASP.NET Core requests, calls to the API, tool invocations |
| Metrics | HTTP server and client, .NET runtime, Npgsql pool, workers, notification queues, authentication, bill and expense changes, uploads, object storage | HTTP server and client, .NET runtime, tool invocations |
| Logs | Application logs at `Information` and above, framework logs at `Warning` and above | Same |

The MCP server propagates the W3C trace context to the API, so a tool call and the API requests it makes share one trace. Logs carry the trace and span IDs of the request that wrote them.

Custom metrics:

| Metric | Attributes | Meaning |
|---|---|---|
| `bitfinance.worker.run.count` / `.duration` | `worker.name`, `outcome` | Background worker cycles |
| `bitfinance.worker.failure.count` | `worker.name` | Failed worker cycles |
| `bitfinance.worker.last_success` | `worker.name` | Unix time of the last successful cycle |
| `bitfinance.notification.dispatch.item.count` | `stage`, `outcome` | Outbox and delivery items fetched, delivered, rescheduled or failed |
| `bitfinance.notification.outbox.backlog` / `.oldest_age` | | Pending outbox messages and age of the oldest one |
| `bitfinance.notification.delivery.backlog` / `.oldest_age` | | Pending email deliveries and age of the oldest one |
| `bitfinance.mcp.tool.invocation.count` / `.duration` | `mcp.tool.name`, `outcome` | MCP tool calls |
| `bitfinance.auth.attempt.count` | `auth.flow`, `outcome` | Password login and registration, Google sign-in and linking, and token refresh attempts |
| `bitfinance.domain.operation.count` | `domain.entity`, `domain.operation` | Completed bill, bill series and expense changes (`created`, `updated`, `paid`, `deleted`, `stopped`) |
| `bitfinance.attachment.upload.count` | `attachment.kind`, `outcome` | Bill and expense document and avatar uploads |
| `bitfinance.attachment.upload.size` | `attachment.kind` | Size of stored uploads, in bytes |
| `bitfinance.storage.operation.duration` | `storage.operation`, `outcome` | Object storage requests (`put`, `get`, `head`, `delete`) |
| `bitfinance.dependency.status` | `dependency` | `1` when the last periodic check of a dependency passed, `0` otherwise. Only `storage` today |

All attribute values come from fixed lists in the code; an unknown value throws instead of creating a new series. Health endpoints are excluded from traces.

## Privacy rules

Telemetry must not contain personal or financial data. Both apps enforce this before anything reaches the console or the exporter:

- **Logs** keep only the message template, the exception type, numeric counters (`Count`, `BillCount`, …) and the `Operation` and `Errors` attributes. Every other attribute value, exception message and request scope is dropped. Framework log messages are replaced by `Diagnostic event (details redacted).`
- **Spans** lose SQL text, URLs and query strings, headers, user agent and any `user.*` attribute.
- **Metrics** only keep an allow-listed set of low-cardinality attributes (route template, method, status code, worker or tool name, outcome).

When adding a log, use a constant template and never put e-mail addresses, names, user, organization or entity IDs, amounts, descriptions, file names or storage paths in it. When adding a metric attribute, use a value from a small fixed set and add its key to the allow-list in `ObservabilityExtensions`.

## Health checks

| App | Endpoint | Checks |
|---|---|---|
| API | `/health/live` | Process is up; no dependencies |
| API | `/health/ready` | PostgreSQL and, when `CACHE_ENABLED=true`, Redis |
| MCP server | `/health/live` | Process is up; no dependencies |
| MCP server | `/health/ready` | Configuration is valid and the API's `/health/ready` succeeds |

The API also checks object storage every minute in the background: it reads a small probe object (`health/storage-probe` under the storage prefix) and writes it if it is missing, since the storage credentials cannot list the bucket. The result feeds `bitfinance.dependency.status` and the storage alert, but not `/health/ready`, so a storage outage does not block deploys or mark the API as down.

`/health` is an alias of `/health/ready` in both apps. Responses only contain the overall status. Both images use `/health/ready` as their Docker health check, so the deploys' `--wait` waits for readiness: an MCP server deploy fails if the API is not ready.

## Configuration

Backend (`apps/backend/.env`):

| Variable | Default | Purpose |
|---|---|---|
| `OBSERVABILITY_ENABLED` | `false` | Export the API's telemetry to Alloy |
| `OTEL_TRACE_SAMPLING_RATIO` | `1.0` | Share of new traces kept (parent-based) |
| `GRAFANA_CLOUD_OTLP_ENDPOINT` | | Grafana Cloud OTLP endpoint, `https://otlp-gateway-<zone>.grafana.net/otlp` |
| `GRAFANA_CLOUD_INSTANCE_ID` | | Grafana Cloud instance ID, used as the OTLP username |
| `GRAFANA_CLOUD_API_KEY` | | Access policy token with `metrics:write`, `logs:write` and `traces:write` |
| `COMPOSE_PROFILES` | | Must include `observability` for the Alloy container to run |

MCP server (`apps/mcp-server/.env`):

| Variable | Default | Purpose |
|---|---|---|
| `MCP_OBSERVABILITY_ENABLED` | `false` | Export the MCP server's telemetry to Alloy |
| `MCP_TRACE_SAMPLING_RATIO` | `1.0` | Share of new traces kept (parent-based) |

The service environment (`deployment.environment.name`) comes from `ASPNETCORE_ENVIRONMENT`, lowercased. Database migrations (`--migrate`) never export telemetry.

## Turning it on in production

1. In Grafana Cloud, open the stack's **OpenTelemetry** connection page and note the OTLP endpoint and instance ID. Create an access policy token with `metrics:write`, `logs:write` and `traces:write`.
2. In the backend `.env` on the server, set the three `GRAFANA_CLOUD_*` variables, add `observability` to `COMPOSE_PROFILES` (comma-separated, keeping any profile already listed) and set `OBSERVABILITY_ENABLED=true`.
3. In the MCP server `.env`, set `MCP_OBSERVABILITY_ENABLED=true`.
4. Release or republish the backend, then the MCP server. The backend deploy starts Alloy and waits for it to be ready.
5. In Grafana Cloud, check that `bitfinance-api`, `bitfinance-mcp` and `bitfinance-alloy` appear in Explore for metrics, logs and traces.

To turn export off again, set `OBSERVABILITY_ENABLED=false` / `MCP_OBSERVABILITY_ENABLED=false` and redeploy. To stop the collector, also remove `observability` from `COMPOSE_PROFILES` and run `docker compose -f docker-compose.yml -f docker-compose.prod.yml stop bitfinance-alloy`. To rotate the token, update `GRAFANA_CLOUD_API_KEY` and recreate only `bitfinance-alloy`.

## Dashboard and alerts

`apps/backend/observability/grafana` holds the **BitFinance · Operations** dashboard (readiness, HTTP, PostgreSQL, MCP tools, workers, notifications, runtime, collector, authentication, bill and expense changes, uploads and object storage) and the Grafana-managed alert rules:

| Severity | Alerts |
|---|---|
| critical | API or MCP server readiness failing for 2 minutes |
| high | API 5xx ratio, MCP tool errors, worker failures or delays, notification outbox or delivery delays and failures, collector telemetry absent, object storage check failing for 5 minutes |
| medium | API p95 latency, API or MCP telemetry absent, collector export failures, object storage request errors, more than 20 failed password logins in 15 minutes, refresh token reuse |

Alerts only evaluate `deployment_environment_name="production"`. They have no contact point of their own: route `application="bitfinance"` to one in Grafana's notification policies.

To create or update them in a Grafana Cloud stack, use a service account token with dashboard, folder and alert rule write permissions (not the OTLP token):

```bash
GRAFANA_SERVICE_ACCOUNT_TOKEN=... python3 apps/backend/observability/grafana/provision.py \
  --grafana-url https://<stack>.grafana.net --prometheus-uid <prometheus-datasource-uid> --apply
```

Without `--apply`, the script prints what it would send. The **Observability** workflow checks every dashboard query and alert expression with `promtool`, tests the readiness and storage alerts firing and resolving, and runs `smoke-test.py`: real API and MCP binaries with a disposable PostgreSQL and Alloy, checking the MCP → API → PostgreSQL trace, log correlation, collector and database outages, and that none of the sentinel personal data reaches the exported telemetry or the console.

## How the backend deploy handles Alloy

The backend deploy uploads `apps/backend/observability/alloy/config.alloy` with the compose files and keeps the previous one as `config.alloy.prev`. After `bitfinance-api` is running the new release, and only when the `observability` profile is enabled, it pulls the Alloy image, starts the container (recreating it if the configuration changed) and waits up to 30 seconds for `/-/ready`. A collector failure produces a warning in the workflow run but does not fail the release.

CI validates and format-checks `config.alloy` with the same Alloy image the compose file uses.

## Running it locally

1. In `apps/backend/.env`, set the three `GRAFANA_CLOUD_*` variables (a free Grafana Cloud stack works) and `OBSERVABILITY_ENABLED=true`.
2. Start the stack with the profile:

   ```bash
   docker compose --profile observability up -d --build
   ```

3. Alloy's UI is at `http://localhost:12345`, where the pipeline graph shows what is received and exported.

Without Grafana Cloud credentials, leave `OBSERVABILITY_ENABLED=false`: the API then writes the same sanitized logs to the console only.

## Investigating an incident

- **Start from the dashboard.** **BitFinance · Operations** links back to this page.
- **Is it up?** Check the `probe_success` metric (`service` label `bitfinance-api` or `bitfinance-mcp`). Alloy probes both readiness endpoints every 30 seconds over the Docker network.
- **Which requests fail?** Filter `http.server.request.duration` by `http.route` and `http.response.status_code`, then search traces of `bitfinance-api` with an error status.
- **What happened in one request?** Open the trace; the logs written during it share its trace ID.
- **Is a worker stuck?** Compare `bitfinance.worker.last_success` with the current time, and look at `bitfinance.worker.failure.count`.
- **Are notifications delayed?** Look at the outbox and delivery backlog and oldest-age metrics, and at `bitfinance.notification.dispatch.item.count` with `outcome` `rescheduled` or `terminal_failure`.
- **Do uploads or downloads fail?** Look at `bitfinance.dependency.status{dependency="storage"}`, then at `bitfinance.storage.operation.duration` with `outcome="error"` by operation, and at `bitfinance.attachment.upload.count` by outcome (`rejected` and `plan_limit` are user errors, `error` is not).
- **Are logins failing?** Break `bitfinance.auth.attempt.count` down by `auth.flow` and `outcome`.
- **Is telemetry missing?** On the server, `docker compose -f docker-compose.yml -f docker-compose.prod.yml ps bitfinance-alloy` and `curl -fsS http://127.0.0.1:12345/-/ready`. Alloy's own `otelcol_exporter_*` metrics show export failures.
