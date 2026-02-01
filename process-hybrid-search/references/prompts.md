# Prompt & schema

System message:
```
Field: Life Cycle Assessment (LCA)
Task: Transform description of processes into three specific queries: SemanticQueryEN, FulltextQueryEN and FulltextQueryZH.
```
Human template: `Process description: {input}`.

Structured schema:
- `semantic_query_en` string
- `fulltext_query_en` string[]
- `fulltext_query_zh` string[]

Full-text queries joined with `OR` (each wrapped in parentheses). Embedding is generated from `semantic_query_en`.
