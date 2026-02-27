# Workflow

## Inputs

- Curated UUID list file (JSON/JSONL/TXT), typically manually exported via SQL by an operator.
- MCP CRUD access (read-only for `fetch`, append-only `insert` for publish). Review context enrichment is delegated to `lci-review` and uses local `process-automated-builder` registry when enabled.
- Optional local overrides JSON for product flow regeneration.

## Run Directory Layout

Example: `artifacts/flow-remediator/run-001`

- `cache/flows/`: fetched flow JSON files (`<uuid>_<version>.json`)
- `fetch/fetch_log.jsonl`
- `fetch/fetch_summary.json`
- `review/findings.jsonl`
- `review/flow_summaries.jsonl`
- `review/similarity_pairs.jsonl`
- `review/flow_review_summary.json`
- `fix/fix_proposals.jsonl`
- `fix/patch_manifest.jsonl`
- `fix/patched_flows/`
- `validate/` (same shape as `review/`)
- `publish/publish_results.jsonl`
- `publish/publish_summary.json`
- `pipeline_summary.json`

## Command Modes

## `fetch`

- Source of truth is the UUID list file, not arbitrary SQL.
- Uses MCP CRUD `select` on `flows`.
- Stores exact returned JSON locally for reproducibility.

## `review`

- Delegates to `lci-review --profile flow`.
- Produces `review/findings.jsonl` consumed by `propose-fix`.
- `lci-review` internally combines structured evidence extraction + optional LLM semantic review.
- If `OPENAI_API_KEY` is present, `lci-review flow` defaults to LLM-enabled review unless explicitly disabled.
- Use `--with-mcp-context` to improve flow property / unitgroup evidence (compat flag name; delegated `lci-review` uses local `process-automated-builder` registry, not CRUD, for this context).

## `propose-fix`

Safe deterministic fixes only (initial version):

- fill missing dataset version
- align `referenceToReferenceFlowProperty` with selected `flowProperty` internal ID

High-risk or heuristic issues stay as candidate proposals and must be reviewed or regenerated.

## `validate`

- Re-runs `lci-review --profile flow` on `fix/patched_flows`.
- Used as a regression gate before publish.

## `publish`

- Reads `fix/patch_manifest.jsonl`
- Re-checks latest version in DB via MCP CRUD `select`
- Increments version (`xx.xx.xxx` patch segment)
- Publishes via MCP CRUD `insert` (append-only)

Recommended default:

- `--mode dry-run`
- keep base-version check enabled (do not pass `--skip-base-check`)

## Product Flow Regeneration

Use `regen-product-flow` when patching is insufficient (for example classification/category or canonical name changes).

This subcommand rebuilds payloads by reusing:

- `process-automated-builder/tiangong_lca_spec/product_flow_creation/service.py`

## Safety Gates

- No direct database access in the skill.
- UUID scope is externally curated.
- Review and fix outputs are persisted before publish.
- Publish is append-only (`insert`) with version bump.
- Base version drift check is enabled by default.
