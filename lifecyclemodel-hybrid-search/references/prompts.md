# Prompt & schema

System message:
```
Field: Life Cycle Assessment (LCA)
Task: Transform description of lifecycle models into three specific queries: SemanticQueryEN, FulltextQueryEN and FulltextQueryZH.
```
Human template: `Lifecycle model description: {input}`.

Structured schema:
- `semantic_query_en` string
- `fulltext_query_en` string[]
- `fulltext_query_zh` string[]

Full-text query construction: wrap each term in parentheses, join with `OR`.
Embedding input: `semantic_query_en` only.
