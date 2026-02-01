---
name: flow-hybrid-search
description: Supabase edge function supabase/functions/flow_hybrid_search that turns a flow description into LCA-aware full-text + embedding queries and calls `hybrid_search_flows`. Use when debugging hybrid search for flows, tuning prompts/models, or wiring auth/env.
---

# Flow Hybrid Search

## Quick start (remote only)
- Endpoint/region are fixed in production:
  - `REMOTE_ENDPOINT=https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/`
  - `X_REGION=us-east-1`
- 调用方只需提供 `USER_API_KEY`（或 service role），从环境读取。
- 调用示例：
  ```bash
  curl -i --location --request POST "https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/flow_hybrid_search" \
    --header 'Content-Type: application/json' \
    --header 'x-region: us-east-1' \
    --header "Authorization: Bearer $USER_API_KEY" \
    --header "apikey: $USER_API_KEY" \
    --data @assets/example-request.json
  ```
- 模型/SageMaker 已在远端配置，调用方无需设置。

## Request & output
- POST JSON: `{ "query": string, "filter"?: object|string }`.
- Returns 200 with `{ data }` array or `[]`; 400 if `query` missing; 500 on RPC/embedding errors.

## Processing flow
1) OPTIONS handled for CORS via `_shared/cors`.
2) Auth via `_shared/auth` allowing JWT, USER_API_KEY, SERVICE_API_KEY (service key from `REMOTE_SERVICE_API_KEY` or `SERVICE_API_KEY`).
3) Run ChatOpenAI (temperature 0, `OPENAI_CHAT_MODEL`) with structured output schema: `semantic_query_en` (string) + `fulltext_query_en[]` + `fulltext_query_zh[]`; prompt is flow-specific LCA instructions.
4) Combine full-text queries: `(q1) OR (q2)…`; generate embedding for `semantic_query_en` using SageMaker endpoint (JSON `{inputs: text}`) and extract first number array from response.
5) Call `supabase.rpc('hybrid_search_flows', { query_text, query_embedding: "[v1,...]", filter_condition })`.
6) Respond with data or empty array; errors logged and returned as JSON 500.

## Change points
- Prompt/fields: edit query schema or system prompt for different outputs.
- Model: switch `OPENAI_CHAT_MODEL` or SageMaker endpoint payload/region.
- Search backend: change RPC name/params to target different table/index.
- Filter handling: ensure callers send string vs object; function serializes non-string via `JSON.stringify`.

## References
- `references/env.md` — env + serve commands.
- `references/request-response.md` — payload, filters, and RPC expectations.
- `references/prompts.md` — current LCA prompt and structured schema.
- `references/testing.md` — curl and debugging checklist.

## Assets & scripts
- `assets/example-request.json` — sample query/filter body.
- `scripts/invoke_local.sh` — curl helper for localhost.
