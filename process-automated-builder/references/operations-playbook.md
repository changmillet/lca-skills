# Operations Playbook (Standalone)

## 1) Bootstrap Runtime
```bash
process-automated-builder/scripts/setup-process-automated-builder.sh
source process-automated-builder/.venv/bin/activate
```

## 2) Run End-to-End (Recommended)
```bash
export TIANGONG_LCA_REMOTE_TRANSPORT="streamable_http"
export TIANGONG_LCA_REMOTE_SERVICE_NAME="TianGong_LCA_Remote"
export TIANGONG_LCA_REMOTE_URL="https://lcamcp.tiangong.earth/mcp"
export TIANGONG_LCA_REMOTE_API_KEY="<your-api-key>"
export OPENAI_API_KEY="<your-openai-api-key>"
export OPENAI_MODEL="gpt-5"

process-automated-builder/scripts/run-process-automated-builder.sh \
  --mode workflow \
  --flow-file /abs/path/to/reference-flow.json \
  -- --operation produce
```

## 3) Run with Inline JSON (Agent-Friendly)
```bash
process-automated-builder/scripts/run-process-automated-builder.sh \
  --mode workflow \
  --flow-json '{"flowDataSet": {...}}' \
  -- --operation produce
```

## 4) Stage Debugging
```bash
process-automated-builder/scripts/run-process-automated-builder.sh \
  --mode langgraph \
  --flow-file /abs/path/to/reference-flow.json \
  -- --stop-after matches --operation produce
```

## 5) Resume Existing Run
```bash
process-automated-builder/scripts/run-process-automated-builder.sh \
  --mode langgraph \
  -- --resume --run-id <run_id>
```

## 6) Publish Existing Run
```bash
process-automated-builder/scripts/run-process-automated-builder.sh \
  --mode langgraph \
  -- --publish-only --run-id <run_id> --commit
```

## Runtime Notes
- New runs require flow input; no default flow file is used.
- Resume mode can omit `--flow` and read it from cached state.
- Flow-search MCP configuration is read from `TIANGONG_LCA_REMOTE_*` env vars.
- OpenAI configuration is read from `OPENAI_*` (or `LCA_OPENAI_*`) env vars.
- Literature MCP (`TianGong_KB_Remote`) can be configured by `TIANGONG_KB_REMOTE_*` env vars.
- MinerU OCR client can be configured by `TIANGONG_MINERU_WITH_IMAGE_*` env vars.
- `--publish` and `--commit` may invoke remote CRUD services; use dry-run first.

## Failure Triage
- Missing deps/import errors:
  - Re-run setup script and ensure the venv is active.
- Missing flow errors:
  - Provide `--flow-file`, `--flow-json`, or `--flow-stdin` for new runs.
- Placeholder-heavy outputs:
  - Run through Step 6 and inspect `cache/placeholder_report.json`.
- Long runtime:
  - Check `cache/workflow_timing_report.json`; Step 4 matching is usually dominant.
