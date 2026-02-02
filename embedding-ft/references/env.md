# Env & runtime notes
- Required: `SUPABASE_DB_URL`, `SAGEMAKER_ENDPOINT_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
- Optional: `AWS_SESSION_TOKEN` (temporary creds).
- Deno edge; no Node APIs. Uses `postgres` client to reach DB directly.
- SageMaker region fixed to `us-east-1`; change `AWS_REGION` constant to move regions.
