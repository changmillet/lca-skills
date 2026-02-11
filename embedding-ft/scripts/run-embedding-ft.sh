#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
SKILL_DIR="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

FUNCTION_NAME="embedding_ft"
DEFAULT_BASE_URL="https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1"
DEFAULT_DATA_FILE="${SKILL_DIR}/assets/example-jobs.json"

TOKEN_VALUE="${TOKEN:-${EMBEDDING_FT_TOKEN:-}}"
BASE_URL="${SUPABASE_FUNCTIONS_URL:-${DEFAULT_BASE_URL}}"
DATA_FILE="${DEFAULT_DATA_FILE}"
MAX_TIME=60
DRY_RUN=0

usage() {
  cat <<'USAGE'
Usage: run-embedding-ft.sh [options]

Options:
  --token <token>      Override TOKEN / EMBEDDING_FT_TOKEN
  --data <file>        JSON body file path (default: assets/example-jobs.json)
  --base-url <url>     Supabase functions base URL
  --max-time <sec>     Curl timeout in seconds (default: 60)
  --dry-run            Print request details without sending
  -h, --help           Show this help message
USAGE
}

fail() {
  echo "Error: $*" >&2
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token)
      [[ $# -ge 2 ]] || fail "--token requires a value"
      TOKEN_VALUE="$2"
      shift 2
      ;;
    --data)
      [[ $# -ge 2 ]] || fail "--data requires a value"
      DATA_FILE="$2"
      shift 2
      ;;
    --base-url)
      [[ $# -ge 2 ]] || fail "--base-url requires a value"
      BASE_URL="$2"
      shift 2
      ;;
    --max-time)
      [[ $# -ge 2 ]] || fail "--max-time requires a value"
      MAX_TIME="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

[[ -n "${TOKEN_VALUE}" ]] || fail "Missing token. Set TOKEN (or EMBEDDING_FT_TOKEN) or pass --token."
[[ -f "${DATA_FILE}" ]] || fail "Data file not found: ${DATA_FILE}"

URL="${BASE_URL%/}/${FUNCTION_NAME}"

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "POST ${URL}"
  echo "data-file: ${DATA_FILE}"
  cat "${DATA_FILE}"
  exit 0
fi

curl -sS --fail-with-body --location --request POST "${URL}" \
  --max-time "${MAX_TIME}" \
  --header "Authorization: Bearer ${TOKEN_VALUE}" \
  --header "Content-Type: application/json" \
  --data @"${DATA_FILE}"

echo
