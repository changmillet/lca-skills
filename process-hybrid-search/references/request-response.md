# Request/response

## Endpoint
- POST `https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/process_hybrid_search`
- Headers: `Authorization: Bearer <CLI-resolved-Supabase-access-token>`, `x-region: us-east-1`

The CLI obtains that bearer from its private OAuth session and never prints it. The skill does not accept or construct an Authorization header.

## Input
```json
{
  "query": "Open-loop mechanical recycling process for HDPE packaging",
  "filter": {
    "processInformation": {
      "geography": {
        "locationOfOperationSupplyOrProduction": {
          "@location": "CN"
        }
      },
      "time": {
        "common:referenceYear": 2021
      }
    }
  }
}
```
- `filter` optional; if string, used as-is; if object, passed as JSON.

## Output
- 200 `{ "data": [...] }` from `hybrid_search_processes`; returns `[]` when no matches.
- 400 when `query` is missing; 500 on embedding/model/RPC errors.

## RPC expectation
- Expects Postgres function `hybrid_search_processes(query_text text, query_embedding text, filter_condition jsonb|text)`.

## Auth
- Run `tiangong-lca auth status --json` before remote work. The CLI owns bearer resolution and refresh; this skill never accepts raw credentials or tokens.
