# Env (caller side)

- CLI path override: `TIANGONG_LCA_CLI_DIR`
- Default CLI runtime: the exact package pinned by `scripts/lib/cli-launcher.mjs`
- OAuth client variable: `TIANGONG_LCA_OAUTH_CLIENT_ID`
- Supabase public-key variable: `TIANGONG_LCA_SUPABASE_PUBLISHABLE_KEY`
- Base URL variable: `TIANGONG_LCA_API_BASE_URL`
- Region variable: `TIANGONG_LCA_REGION`
- Default endpoint remains `https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/flow_hybrid_search`

Wrapper behavior:

- the Node `.mjs` wrapper runs the published CLI by default and injects the example `--input` file when none is provided
- set `TIANGONG_LCA_CLI_DIR` or pass `--cli-dir` only when you need a local CLI working tree
- all other flags are the standard `tiangong-lca search flow` flags
- internally it forwards to `tiangong-lca search flow`
- run `tiangong-lca auth status --json` before remote work; a human runs `auth login` when required
- use a separate private `TIANGONG_LCA_SESSION_FILE` for each account/project/client context
- headless automation may receive only a short-lived `TIANGONG_LCA_ACCESS_TOKEN` from an approved orchestrator secret path
- never request, decode, print, or forward `TIANGONG_LCA_API_KEY`, a password, authorization code, access token, or refresh token

Model and embedding providers are configured in the deployed edge function.
