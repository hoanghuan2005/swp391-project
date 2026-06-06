# Project Workspace AI Flow

## Purpose

Describe authenticated, project-scoped, source-aware workspace conversations.

## Important files

- `frontend/src/pages/workspace/ProjectWorkspacePage.jsx`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/AiAskServiceImpl.java`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/ConversationServiceImpl.java`

## Current flow

1. The workspace loads the project and `/api/ai/conversations?projectId={projectId}`.
2. It selects an existing project conversation or creates one with `projectId`.
3. The user can select specific project documents; otherwise all project documents are considered.
4. The request sends `conversationId`, `projectId`, optional `documentIds`, and `message`.
5. Project routing runs before homepage/normal routing.
6. Only AI-ready project documents with relevant selected chunks are appended.
7. The answer and messages are saved in the active project conversation.

## Request/response shape if relevant

```json
{
  "conversationId": "uuid",
  "projectId": "uuid",
  "documentIds": ["optional-selected-document-uuid"],
  "message": "Question"
}
```

## Key decisions

- Project Workspace AI uses workspace sources as the primary answer basis.
- If sources do not support a factual claim, the prompt requires the assistant to say so.
- Greetings and capability questions can return deterministic responses with empty sources.
- Multiple conversations are scoped by `AiConversation.projectId`.

## Caveats/limitations

- Relevant chunks are selected with keyword scoring, not embeddings.
- Source references identify documents, not exact chunks.
- Sources are not restored from saved message history.

## Related notes

- [[AI Architecture]]
- [[Shared Workspace AI Flow]]
- [[AiAskServiceImpl]]
- [[AI Source Links Flow]]
