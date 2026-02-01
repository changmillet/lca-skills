# Prompt & schema

System message:
```
Field: Life Cycle Assessment (LCA)
Task: Transform description of flows into three specific queries: SemanticQueryEN, FulltextQueryEN and FulltextQueryZH.
```
Human template: `Flow description: {input}`.

Structured output schema (`withStructuredOutput`):
- `semantic_query_en`: string, semantic retrieval query in English.
- `fulltext_query_en`: string[] of English full-text terms/synonyms.
- `fulltext_query_zh`: string[] of Simplified Chinese full-text terms/synonyms.

Combination rule: wrap each full-text term in parentheses, join with `OR` to form `query_text`.
Embedding input: `semantic_query_en` only.
