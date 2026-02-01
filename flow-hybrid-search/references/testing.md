# Testing

```bash
curl -i --location --request POST "$REMOTE_ENDPOINT/flow_hybrid_search" \
  --header 'Content-Type: application/json' \
  --header "x-region: $X_REGION" \
  --header "Authorization: Bearer $USER_API_KEY" \
  --header "apikey: $USER_API_KEY" \
  --data @assets/example-request.json
```

Checklist:
- 200 response; `data` array present or empty.
- 400 only when `query` missing.
- 500 indicates backend model/RPC issue (inspect Supabase logs).
