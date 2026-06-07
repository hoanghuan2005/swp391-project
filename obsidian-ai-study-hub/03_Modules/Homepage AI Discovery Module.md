# Homepage AI Discovery Module

## Purpose

Provide deterministic, backend-only discovery of real public documents for Homepage AI requests.

## Main controller files

- No dedicated controller. Entry point is `AiAskController`.

## Main service files

- `DocumentDiscoveryService` / `DocumentDiscoveryServiceImpl`
- `AiAskServiceImpl`

## Main repository files

- `DocumentRepository.searchPublicByMetadata`

## Main entity/DTO files

- `Document`
- `AskAIRequest` with `HOMEPAGE_ASSISTANT`
- `AskAIResponse.SourceReference`

## Main endpoints

- Uses `POST /api/ai/ask` with `mode: HOMEPAGE_ASSISTANT`

## Key business flows

Detect phrase-based intent, extract up to six keywords, fetch bounded PUBLIC metadata candidates, deduplicate, rank deterministically, and return up to five real documents. `AiAskServiceImpl` supplies candidates to Groq and builds sources.

## Dependencies on other modules

- Document, course, tag, category, uploader profile metadata
- AI Ask for prompt/response handling

## Risks/caveats

- Intent detection is phrase-based and may miss differently worded requests.
- Database metadata matching uses `LIKE`; quality depends on metadata and database collation.
- This is metadata search, not vector or embedding search.

## Related notes

- [[DocumentDiscoveryService]]
- [[Homepage AI Chatbot Flow]]
- [[AI Architecture]]
