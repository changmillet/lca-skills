# Env (caller side)
- `REMOTE_ENDPOINT`: fixed `https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/`
- `X_REGION`: fixed `us-east-1`
- `USER_API_KEY`: read from env; send in `Authorization` and `apikey` headers.

Model/embedding settings are already configured on the deployed edge function; callers do not supply them.
