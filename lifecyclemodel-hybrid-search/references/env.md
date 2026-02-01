# Env (caller side)
- `REMOTE_ENDPOINT`: fixed `https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/`
- `X_REGION`: fixed `us-east-1`
- `USER_API_KEY`: read from env; place in `Authorization` and `apikey` headers.

Model/embedding configuration is already set in the deployed function; caller does not provide these.
