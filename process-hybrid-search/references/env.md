# Env (caller side)

- Auth header: `Authorization: Bearer <TIANGONG_LCA_APIKEY>`.
- Required region header: `x-region: us-east-1`.
- Default endpoint: `https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/process_hybrid_search`.
- Optional script overrides:
  - `SUPABASE_FUNCTIONS_URL` (base URL)
  - `SUPABASE_FUNCTION_REGION` (region header)
  - `TIANGONG_LCA_APIKEY`

Model and embedding providers are configured in the deployed edge function.
