#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
SKILL_DIR="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
WORKSPACE_ROOT="$(cd -- "${SKILL_DIR}/../.." >/dev/null 2>&1 && pwd)"

DEFAULT_CLI_DIR="${WORKSPACE_ROOT}/tiangong-lca-cli"
DEFAULT_INPUT_FILE="${SKILL_DIR}/assets/example-request.json"

CLI_DIR="${TIANGONG_LCA_CLI_DIR:-${DEFAULT_CLI_DIR}}"
HAS_INPUT=0
SHOW_HELP=0
FORWARD_ARGS=()

fail() {
  echo "Error: $*" >&2
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cli-dir)
      [[ $# -ge 2 ]] || fail "--cli-dir requires a value"
      CLI_DIR="$2"
      shift 2
      ;;
    --cli-dir=*)
      CLI_DIR="${1#--cli-dir=}"
      shift
      ;;
    --input)
      [[ $# -ge 2 ]] || fail "--input requires a value"
      HAS_INPUT=1
      FORWARD_ARGS+=("$1" "$2")
      shift 2
      ;;
    --input=*)
      HAS_INPUT=1
      FORWARD_ARGS+=("$1")
      shift
      ;;
    -h|--help)
      SHOW_HELP=1
      FORWARD_ARGS+=("$1")
      shift
      ;;
    *)
      FORWARD_ARGS+=("$1")
      shift
      ;;
  esac
done

CLI_BIN="${CLI_DIR}/bin/tiangong.js"
[[ -f "${CLI_BIN}" ]] || fail "Cannot find TianGong CLI at ${CLI_BIN}. Set TIANGONG_LCA_CLI_DIR or pass --cli-dir."

command=(
  node
  "${CLI_BIN}"
  search
  lifecyclemodel
)

if [[ "${SHOW_HELP}" -eq 0 && "${HAS_INPUT}" -eq 0 ]]; then
  command+=(--input "${DEFAULT_INPUT_FILE}")
fi

command+=("${FORWARD_ARGS[@]}")

"${command[@]}"
