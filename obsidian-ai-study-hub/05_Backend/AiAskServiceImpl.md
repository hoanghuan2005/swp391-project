# AiAskServiceImpl

## Purpose

Coordinate AI request persistence, routing, context construction, Groq generation, and response source references.

## Current behavior

When `conversationId` exists, the service loads recent history, saves the user message, and may rename a `New Chat`. It then routes project/shared first, homepage second, and normal/document last. History and the latest query are appended before calling Groq. `buildResponse()` saves the assistant message only when a conversation exists.

Project context requires keyword-matching chunks and adds sources only for documents with selected chunks. Normal document context adds a source when selected chunks are non-empty. Homepage context adds all matched discovery candidates as sources.

## Dependencies

- Conversation/message/document-chunk repositories
- Project/document repositories
- `DocumentDiscoveryService`
- `GroqService`

## Risks/caveats

- Sources are not written to `AiMessage`.
- Chunk selection uses substring keyword scoring and a 30,000-character context budget.
- Homepage discovery candidates are metadata context, not document-content chunks.
- Loading a conversation by ID does not visibly verify its owner.

## Related notes

- [[AI Architecture]]
- [[AI Ask Module]]
- [[DocumentDiscoveryService]]
- [[AI Source Links Flow]]
