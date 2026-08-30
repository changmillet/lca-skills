---
name: flow-hybrid-search
description: Execute and troubleshoot Supabase edge function `flow_hybrid_search`, which rewrites flow descriptions and calls `hybrid_search_flows` with optional filters. Use when validating flow query/filter behavior, tuning retrieval prompts, or debugging auth, embedding, and RPC failures.
---

# Flow Hybrid Search

## Run Workflow
1. The wrapper uses the repository-pinned published CLI. Use `TIANGONG_LCA_CLI_DIR` or `--cli-dir` only for an exact local dev/CI override.
2. Configure the API base URL, Supabase publishable key, and environment-specific public OAuth client ID.
3. Run `tiangong-lca auth status --json`. If it returns `login-required`, stop and ask the human user to run `tiangong-lca auth login` in a trusted terminal.
4. Execute `node scripts/run-flow-hybrid-search.mjs` with standard `tiangong-lca search flow` flags.
5. The wrapper delegates to `tiangong-lca search flow`; the CLI resolves and refreshes its private OAuth session.
6. Confirm response shape, then debug with focused references.

Never ask an AI user for a username, password, authorization code, access token, refresh token, or the deprecated encoded API key. Headless runs may use only an orchestrator-injected short-lived `TIANGONG_LCA_ACCESS_TOKEN`; do not pass it through argv, prompts, logs, or artifacts.

## Commands
```bash
TIANGONG_LCA_API_BASE_URL="https://example.supabase.co/functions/v1" \
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY="<publishable-key>" \
TIANGONG_LCA_OAUTH_CLIENT_ID="<public-oauth-client-id>" \
tiangong-lca auth status --json

TIANGONG_LCA_API_BASE_URL="https://example.supabase.co/functions/v1" \
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY="<publishable-key>" \
TIANGONG_LCA_OAUTH_CLIENT_ID="<public-oauth-client-id>" \
node scripts/run-flow-hybrid-search.mjs --dry-run

TIANGONG_LCA_API_BASE_URL="https://example.supabase.co/functions/v1" \
TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY="<publishable-key>" \
TIANGONG_LCA_OAUTH_CLIENT_ID="<public-oauth-client-id>" \
node scripts/run-flow-hybrid-search.mjs

node scripts/run-flow-hybrid-search.mjs \
  --input ./assets/example-request.json \
  --base-url "https://example.supabase.co/functions/v1"

# Force a local CLI working tree during dev/CI
TIANGONG_LCA_CLI_DIR=/path/to/tiangong-lca-cli \
node scripts/run-flow-hybrid-search.mjs \
  --dry-run \
  --base-url "https://example.supabase.co/functions/v1"
```

## Fast Triage
- `400`: missing or invalid `query`.
- `500`: embedding provider or `hybrid_search_flows` RPC failure.
- Empty `data`: query/filter mismatch; inspect generated retrieval query and filter structure.

## Load References On Demand
- `references/env.md`: auth, region, and endpoint overrides.
- `references/request-response.md`: payload contract and RPC expectations.
- `references/prompts.md`: query-rewrite prompt constraints.
- `references/testing.md`: smoke test checklist.
