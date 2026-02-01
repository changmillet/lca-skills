#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA="$ROOT/assets/example-request.json"
URL=${1:-${REMOTE_ENDPOINT:-http://localhost:54321/functions/v1}/lifecyclemodel_hybrid_search}
REGION=${X_REGION:-us-east-1}
API_KEY=${API_KEY:-${USER_API_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-}}}

if [[ -z "$API_KEY" ]]; then
  echo "Set API_KEY or SUPABASE_SERVICE_ROLE_KEY for auth" >&2
  exit 1
fi

curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "x-region: $REGION" \
  -H "Authorization: Bearer $API_KEY" \
  -H "apikey: $API_KEY" \
  -d @"$DATA" \
  "$URL"
