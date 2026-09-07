#!/usr/bin/env bash
# Run from the deployed apps/backend directory. Secrets stay in its existing .env.
set -Eeuo pipefail

case "${1:-}" in
  backend) service=bitfinance-api; port=8080; : "${IMAGE_TAG:?IMAGE_TAG is required}" ;;
  mcp) service=bitfinance-mcp-server; port=8090; : "${MCP_IMAGE_TAG:?MCP_IMAGE_TAG is required}" ;;
  *) echo 'Usage: bash observability/deploy.sh backend|mcp' >&2; exit 2 ;;
esac
compose=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
on_error() {
  status=$?
  trap - ERR
  echo "::error::Deploy failed for $service (exit $status)"
  "${compose[@]}" ps "$service" bitfinance-alloy || true
  "${compose[@]}" logs --tail 60 "$service" bitfinance-alloy || true
  exit "$status"
}
trap on_error ERR

for file in docker-compose.yml docker-compose.prod.yml .env observability/alloy/config.alloy; do
  test -f "$file" || { echo "::error::Missing deployment file: $file"; exit 1; }
done
# Never print expanded configuration: it contains production secrets.
"${compose[@]}" config --quiet
"${compose[@]}" pull "$service"
if [ "$service" = bitfinance-api ]; then
  "${compose[@]}" run --rm --no-deps -e Observability__Enabled=false bitfinance-api --migrate
fi

# Collector image/launch failures must not prevent a product release. Missing
# telemetry is detected by the Cloud alert, independently of product readiness.
if "${compose[@]}" pull bitfinance-alloy; then
  if ! "${compose[@]}" up -d --no-deps --no-build bitfinance-alloy; then
    echo '::warning::Alloy did not start; continuing with product readiness checks.'
  fi
else
  echo '::warning::Alloy image pull failed; continuing with product readiness checks.'
fi

# Production DB/cache must already be running; releases never recreate them.
"${compose[@]}" up -d --no-deps --no-build --wait --wait-timeout 120 "$service"
"${compose[@]}" exec -T "$service" wget -q -T 5 -O /dev/null "http://127.0.0.1:$port/health/ready"
"${compose[@]}" ps "$service" bitfinance-alloy
