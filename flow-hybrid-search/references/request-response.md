# Request/response

## Endpoint
- POST `https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/flow_hybrid_search`
- Headers: `Authorization: Bearer <CLI-resolved-Supabase-access-token>`, `x-region: us-east-1`

The CLI obtains that bearer from its private OAuth session and never prints it. The skill does not accept or construct an Authorization header.

## Input
```json
{
  "query": "methylbutane",
  "filter": {
    "flowType": "Elementary flow",
    "asInput": false,
    "flowDataSet": {
      "flowInformation": {
        "dataSetInformation": {
          "CASNumber": "541-28-6"
        }
      }
    }
  }
}
```
- `filter` optional; accepts string or object. Objects are sent as JSON and serialized to the RPC as JSON text. See more filter examples below.

### Filter examples
- Inputs only (backend also excludes flows whose category level 0 is `Emissions` when `asInput=true`):
```json
{
  "asInput": true
}
```

## Output
- 200 `{ "data": [...] }` from `hybrid_search_flows`; returns `[]` when no matches.
- 400 when `query` is missing; 500 on embedding/model/RPC errors.

## RPC expectation
- Expects Postgres function `hybrid_search_flows(query_text text, query_embedding text, filter_condition jsonb|text)`.
