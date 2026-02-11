#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
SKILL_DIR="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

FUNCTION_NAME="flow_hybrid_search"
DEFAULT_BASE_URL="https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1"
DEFAULT_REGION="us-east-1"
DEFAULT_DATA_FILE="${SKILL_DIR}/assets/example-request.json"

API_KEY="${TIANGONG_LCA_APIKEY:-}"
BASE_URL="${SUPABASE_FUNCTIONS_URL:-${DEFAULT_BASE_URL}}"
REGION="${SUPABASE_FUNCTION_REGION:-${DEFAULT_REGION}}"
DATA_FILE="${DEFAULT_DATA_FILE}"
MAX_TIME=60
DRY_RUN=0

usage() {
  cat <<'USAGE'
Usage: run-flow-hybrid-search.sh [options]

Options:
  --token <key>        Override TIANGONG_LCA_APIKEY
  --data <file>        JSON body file path (default: assets/example-request.json)
  --base-url <url>     Supabase functions base URL
  --region <region>    x-region header value (default: us-east-1)
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
      API_KEY="$2"
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
    --region)
      [[ $# -ge 2 ]] || fail "--region requires a value"
      REGION="$2"
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

[[ -n "${API_KEY}" ]] || fail "Missing API key. Set TIANGONG_LCA_APIKEY or pass --token."
[[ -f "${DATA_FILE}" ]] || fail "Data file not found: ${DATA_FILE}"

URL="${BASE_URL%/}/${FUNCTION_NAME}"

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "POST ${URL}"
  echo "x-region: ${REGION}"
  echo "data-file: ${DATA_FILE}"
  cat "${DATA_FILE}"
  exit 0
fi

curl -sS --fail-with-body --location --request POST "${URL}" \
  --max-time "${MAX_TIME}" \
  --header "Content-Type: application/json" \
  --header "x-region: ${REGION}" \
  --header "Authorization: Bearer ${API_KEY}" \
  --data @"${DATA_FILE}"

echo
