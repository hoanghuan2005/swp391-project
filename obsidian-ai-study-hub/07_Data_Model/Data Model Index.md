# Data Model Index

## Purpose

Document entities, relationships, persistence boundaries, and non-persisted response data.

## Core identity and profile

- [[User Role RefreshToken]]
- [[Profile Notification]]

## Documents and catalog

- [[Document DocumentChunk DocumentView]]
- [[Course Tag School Category]]

## AI and workspace

- [[AiConversation AiMessage]]
- [[Project]]
- [[Quiz Flashcard]]

## Important boundaries

- `AskAIResponse.sources` is response DTO metadata, not persisted citation data.
- `DocumentChunk`, conversation document/project IDs, and quiz document/project IDs use UUID fields rather than JPA relations.
- No vector/embedding entity was verified.

## Related notes

- [[Backend Architecture]]
- [[AI Architecture]]
- [[API Index]]
