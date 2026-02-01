# Testing & debugging

## Local curl
```bash
supabase functions serve embedding_ft --env-file ../../.env.local >/tmp/embedding_ft.log 2>&1 &
FN_PID=$!
curl -X POST \
  -H 'Content-Type: application/json' \
  -d @assets/example-jobs.json \
  http://localhost:54321/functions/v1/embedding_ft
kill $FN_PID
```

## Checklist
- Response lists completed vs failed jobs.
- Logs show `processing embedding job` and `embedding updated successfully` for each job.
- Ensure AWS creds valid; failures often surface as 500 `SageMaker endpoint request failed`.
- Verify `embedding_ft_at` updated and vector column populated.

## Failure triage
- 400: body not an array / schema mismatch.
- 500: SageMaker HTTP error or unexpected response shape; inspect decoded body.
- Missing rows: check `id/version` or replication lag; job is acked to avoid retry loop.
