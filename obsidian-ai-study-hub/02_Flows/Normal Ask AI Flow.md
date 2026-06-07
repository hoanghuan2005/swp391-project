# Normal Ask AI Flow

## Purpose

Describe the standard Ask AI page, separate from project and homepage behavior.

## Important files

- `frontend/src/pages/ai/ai_ask/AskAIPage.jsx`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/AiAskServiceImpl.java`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/ConversationServiceImpl.java`

## Current flow

1. `AskAIPage` loads non-project conversations from `/api/ai/conversations`.
2. The user selects or creates a conversation, optionally linked to one document.
3. The page sends `conversationId`, `message`, and optional `documentId` to `/api/ai/ask`.
4. With no project/share token and no homepage mode, `AiAskServiceImpl` uses the normal branch.
5. If a document is linked and AI-ready, relevant chunks are appended to the prompt.
6. User and assistant messages are saved; the new assistant message receives response sources.

## Request/response shape if relevant

```json
{
  "conversationId": "uuid",
  "message": "Question",
  "documentId": "optional-uuid"
}
```

The response includes `answer`, message/conversation IDs, and `sources`.

## Key decisions

- Normal conversations are queried with `projectId` equal to null.
- A linked document can be inherited from the conversation.
- A source is returned only when non-empty document chunks were appended.

## Caveats/limitations

- Chunk ranking is keyword-based, not vector/embedding search.
- Without a linked document, the assistant answers generally.
- Reloaded message history does not contain prior sources.

## Related notes

- [[AI Architecture]]
- [[AI Ask Module]]
- [[AI Source Links Flow]]
- [[ChatInterface]]
