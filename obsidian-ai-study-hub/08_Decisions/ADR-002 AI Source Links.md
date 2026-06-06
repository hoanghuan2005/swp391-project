# ADR-002 AI Source Links

## Status

Accepted

## Context

Users need clickable references when an AI response uses document or project context. Groq-generated links, IDs, or titles would be untrusted and could reference documents that do not exist.

## Decision

Backend creates `AskAIResponse.sources` from real document entities. Each source contains `documentId` and `title`.

Frontend copies sources into new assistant message objects. `ChatInterface` renders assistant-only links to `/documents/{documentId}` and displays the backend title.

Groq must not generate document URLs, IDs, or titles.

## Consequences

- Links resolve from real backend metadata.
- Source rendering is shared across Normal Ask AI, Homepage AI, and workspace AI.
- Sources are document-level references, not claim-level or chunk-level citations.
- `AiMessage` does not persist sources, so old message history cannot restore source links.

## Alternatives considered

- Ask Groq to produce URLs: rejected because URLs and IDs could be invented.
- Parse document titles from answer text: rejected because text is not a reliable source contract.
- Persist citations immediately: deferred to future work to avoid database/schema expansion in the current phase.

## Related notes

- [[AI Source Links Flow]]
- [[AiConversation AiMessage]]
- [[ChatInterface]]
- [[AI Ask API]]
