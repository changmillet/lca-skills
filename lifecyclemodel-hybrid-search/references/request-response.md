# Request/response

## Endpoint
- POST `https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/lifecyclemodel_hybrid_search`
- Headers: `Authorization: Bearer <CLI-resolved-Supabase-access-token>`, `x-region: us-east-1`

The CLI obtains that bearer from its private OAuth session and never prints it. The skill does not accept or construct an Authorization header.

## Input
```json
{
  "query": "Attributional lifecycle model for recycled aluminum billet",
  "filter": {
    "lifeCycleModelDataSet": {
      "lifeCycleModelInformation": {
        "dataSetInformation": {
          "classificationInformation": {
            "common:classification": {
              "common:class": [
                {
                  "@level": "3",
                  "#text": "Manufacture of refractory products"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```
- `filter` optional; accepts string or object. Objects are sent as JSON and serialized to the RPC as JSON text. Example above shows industry classification filtering (Manufacturing → Manufacture of refractory products, classification level = 3).

## Output
- 200 `{ "data": [...] }` from `hybrid_search_lifecyclemodels`; returns `[]` when no matches.
- 400 when `query` is missing; 500 on embedding/model/RPC errors.

## RPC expectation
- Expects Postgres function `hybrid_search_lifecyclemodels(query_text text, query_embedding text, filter_condition jsonb|text)`.
