#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA="$ROOT/assets/example-jobs.json"
URL=${1:-http://localhost:54321/functions/v1/embedding_ft}

if [[ ! -f "$DATA" ]]; then
  echo "Missing payload at $DATA" >&2
  exit 1
fi

curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -d @"$DATA" \
  "$URL"
