# AiConversation AiMessage

## Purpose

Document persisted AI conversations/messages and the boundary with response-only source metadata.

## Entity files

- `ai_ask/entity/AiConversation.java`
- `ai_ask/entity/AiMessage.java`
- Related DTO: `AskAIResponse`

## Important fields

- AiConversation: userId, title, modelName, documentId, projectId
- AiMessage: role, content, tokenCount
- AskAIResponse SourceReference: documentId, title

## Relationships

- AiConversation one-to-many AiMessage with cascade and orphan removal
- AiMessage many-to-one AiConversation
- userId, documentId, and projectId are UUID fields, not JPA entity relationships

## Used by which modules

Normal Ask AI, Homepage AI, authenticated Project Workspace AI, and conversation APIs. Shared Workspace AI intentionally does not persist a conversation.

## Persistence caveats

- `projectId` enables project-scoped conversations.
- AiMessage stores message content but has no source-reference field/relation.
- `AskAIResponse.sources` is DTO metadata only; old chat history cannot restore citations.
- No vector/embedding persistence is present.

## Related notes

- [[AI Ask API]]
- [[AI Ask Module]]
- [[AI Source Links Flow]]
- [[Project]]
