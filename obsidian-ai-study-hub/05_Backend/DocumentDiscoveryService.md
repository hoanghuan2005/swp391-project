# DocumentDiscoveryService

## Purpose

Detect Homepage document-search intent and return a small ranked set of real public documents.

## Current behavior

The service normalizes the message for intent detection, extracts useful keywords, queries `searchPublicByMetadata()` for each keyword, deduplicates by UUID, ranks deterministically, and returns up to five documents.

Repository matching includes document title/description/original filename, course code/name/description, tag name, category code/name/description, and uploader profile school code/name.

## Dependencies

- `DocumentRepository`
- Document/catalog/profile metadata
- Called by `AiAskServiceImpl`

## Risks/caveats

- Search intent relies on a fixed Vietnamese/English phrase list.
- Ranking counts metadata keyword matches, not semantic similarity.
- School metadata is taken from the uploader profile when available.
- Repository matching quality depends on SQL collation and populated metadata.

## Related notes

- [[Homepage AI Discovery Module]]
- [[Homepage AI Chatbot Flow]]
- [[AiAskServiceImpl]]
