# Env (caller side)
- `REMOTE_ENDPOINT`: fixed `https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/`
- `X_REGION`: fixed `us-east-1`
- `USER_API_KEY`: read from environment; send in both `Authorization` and `apikey` headers.

Model/embedding configuration is already baked into the deployed function; callers do not set extra envs.
