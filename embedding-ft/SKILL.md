---
name: embedding-ft
description: Process PGMQ embedding jobs in supabase/functions/embedding_ft; fetch row content, call AWS SageMaker embedding endpoint, and write embeddings back to Postgres. Use when debugging or extending the FT embedding worker, adjusting auth/env, or changing queue semantics.
---

# Embedding FT

## Quick start
- Preconditions: Supabase CLI running with `SUPABASE_DB_URL`; AWS creds + `SAGEMAKER_ENDPOINT_NAME`; optional `AWS_SESSION_TOKEN` for temporary creds.
- Run locally: `supabase functions serve embedding_ft --env-file ../../.env.local` from repo root.
- Send test jobs: `./scripts/invoke_local.sh` (uses `assets/example-jobs.json`).
- Logs show per-job `id`, `version`, `jobId`, table, and `contentFunction` to trace flow.

## Request contract (HTTP POST JSON)
Array of jobs, each:
- `jobId` number (PGMQ message id)
- `id` uuid (record PK)
- `version` string (optimistic lock)
- `schema` string, `table` string
- `contentFunction` string (SQL function to derive text)
- `embeddingColumn` string (target column)

## Processing flow
1) Validate request body with Zod array of `jobSchema`; reject on parse errors.
2) Iterate jobs sequentially; race against `catchUnload()` to handle edge worker shutdown.
3) For each job:
   - Fetch row via Postgres (`contentFunction(t)`); if missing or non-string content, `pgmq.delete` the job and continue.
   - Call SageMaker endpoint with `{inputs: text}`; extract first number array from nested JSON (handles `embedding|embeddings|data` keys and arrays).
   - Update `${schema}.${table}` setting `embeddingColumn` JSON array and `embedding_ft_at = now()`; if `count === 0`, log and ack.
   - Always `pgmq.delete(queue_name='embedding_jobs', jobId)` on completion to ack.
4) Respond 200 with `{completedJobs, failedJobs}` plus headers `x-completed-jobs` and `x-failed-jobs`.

## Change points
- Swap embedding model: edit `SAGEMAKER_ENDPOINT_NAME` or request payload in `generateEmbedding`.
- Adjust response parsing: tweak `extractEmbedding` to align with endpoint shape.
- Add retries/backoff: wrap `client.send(command)` or DB writes with retry policy.
- Extend payload: update `jobSchema` and downstream SQL bindings.

## References
- `references/env.md` — required env vars and local run commands.
- `references/job-contract.md` — job shape, queue semantics, and expected DB side effects.
- `references/testing.md` — curl examples and validation checklist.

## Assets & scripts
- `assets/example-jobs.json` — minimal valid request body.
- `scripts/invoke_local.sh` — serve + curl helper for localhost testing.
