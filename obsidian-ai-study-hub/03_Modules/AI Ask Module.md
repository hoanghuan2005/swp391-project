# AI Ask Module

## Purpose

Own AI ask routing, conversations/messages, prompt context, Groq calls, and backend-generated source references.

## Main controller files

- `AiAskController`

## Main service files

- `AiAskService` / `AiAskServiceImpl`
- `ConversationService` / `ConversationServiceImpl`
- `GroqService` / `GroqServiceImpl`
- `DocumentParserService`, `ChunkService`, `SummaryService`

## Main repository files

- `AiConversationRepository`
- `AiMessageRepository`
- `DocumentChunkRepository`
- Dependencies: document/project repositories

## Main entity/DTO files

- Entities: `AiConversation`, `AiMessage`, `DocumentChunk`
- DTOs: `AskAIRequest`, `CreateConversationRequest`, `AskAIResponse`
- Enums: `AiAskMode`, `MessageRole`

## Main endpoints

- `POST /api/ai/ask`, `/api/ai/shared/ask`
- `GET/POST /api/ai/conversations`
- `GET /api/ai/conversations/{id}/messages`
- `DELETE /api/ai/conversations/{id}`

## Key business flows

Project/share requests route first, Homepage mode second, and Normal Ask AI last. Conversations persist messages when a conversation ID exists. Project and document context use keyword-selected chunks; Homepage discovery uses real public metadata. Responses can include document sources.

## Dependencies on other modules

- Document chunks and metadata
- Projects/share tokens
- Auth users for conversation ownership field
- Groq external API

## Risks/caveats

- Conversation get/delete/message operations do not visibly verify current-user ownership.
- Sources are not persisted in `AiMessage`.
- Chunk retrieval is keyword-based, not vector/embedding search.

## Related notes

- [[AI Architecture]]
- [[AiAskController]]
- [[AiAskServiceImpl]]
- [[GroqServiceImpl]]
- [[Homepage AI Discovery Module]]
