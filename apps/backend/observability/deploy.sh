#!/usr/bin/env bash
# Run from the deployed apps/backend directory. Secrets stay in its existing .env.
set -Eeuo pipefail

case "${1:-}" in
  backend) service=bitfinance-api; port=8080; : "${IMAGE_TAG:?IMAGE_TAG is required}" ;;
  mcp) service=bitfinance-mcp-server; port=8090; : "${MCP_IMAGE_TAG:?MCP_IMAGE_TAG is required}" ;;
  *) echo 'Usage: bash observability/deploy.sh backend|mcp' >&2; exit 2 ;;
esac
compose=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
alloy_config=observability/alloy/config.alloy
alloy_config_state=observability/alloy/.deployed-config.sha256
on_error() {
  status=$?
  trap - ERR
  echo "::error::Deploy failed for $service (exit $status)"
  "${compose[@]}" ps "$service" bitfinance-alloy || true
  "${compose[@]}" logs --tail 60 "$service" bitfinance-alloy || true
  exit "$status"
}
trap on_error ERR

for file in docker-compose.yml docker-compose.prod.yml .env "$alloy_config"; do
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
  if ! "${compose[@]}" run --rm --no-deps --entrypoint alloy bitfinance-alloy \
      validate /etc/alloy/config.alloy; then
    echo '::warning::Alloy configuration is invalid; continuing with product readiness checks.'
  else
    if command -v sha256sum >/dev/null 2>&1; then
      alloy_config_hash=$(sha256sum "$alloy_config" | awk '{print $1}')
    else
      alloy_config_hash=$(shasum -a 256 "$alloy_config" | awk '{print $1}')
    fi
    deployed_alloy_config_hash=$(sed -n '1p' "$alloy_config_state" 2>/dev/null || true)
    alloy_up=("${compose[@]}" up -d --no-deps --no-build)
    if [ "$alloy_config_hash" != "$deployed_alloy_config_hash" ]; then
      alloy_up+=(--force-recreate)
    fi

    alloy_ready=false
    if "${alloy_up[@]}" bitfinance-alloy; then
      for _ in {1..15}; do
        if curl --fail --silent --show-error --max-time 5 http://127.0.0.1:12345/-/ready >/dev/null; then
          alloy_ready=true
          break
        fi
        sleep 2
      done
      if [ "$alloy_ready" = true ]; then
        printf '%s\n' "$alloy_config_hash" > "$alloy_config_state.tmp"
        mv "$alloy_config_state.tmp" "$alloy_config_state"
      else
        echo '::warning::Alloy did not become ready; continuing with product readiness checks.'
      fi
    else
      echo '::warning::Alloy did not start; continuing with product readiness checks.'
    fi
  fi
else
  echo '::warning::Alloy image pull failed; continuing with product readiness checks.'
fi

# Production DB/cache must already be running; releases never recreate them.
"${compose[@]}" up -d --no-deps --no-build --wait --wait-timeout 120 "$service"
"${compose[@]}" exec -T "$service" wget -q -T 5 -O /dev/null "http://127.0.0.1:$port/health/ready"
"${compose[@]}" ps "$service" bitfinance-alloy
