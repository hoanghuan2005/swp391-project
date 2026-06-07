# Shared Workspace AI Flow

## Purpose

Describe source-aware project AI for a workspace opened through a share token.

## Important files

- `frontend/src/pages/workspace/ProjectWorkspacePage.jsx`
- `frontend/src/api/aiApi.js`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/controller/AiAskController.java`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/AiAskServiceImpl.java`

## Current flow

1. `ProjectWorkspacePage` detects a route `token` and loads the shared project.
2. Frontend creates a local `main` conversation and welcome message.
3. It sends `shareToken`, project metadata, optional selected `documentIds`, and `message` through `askSharedAi`.
4. `/api/ai/shared/ask` requires a share token and clears `projectId`, `conversationId`, and `documentId`.
5. `AiAskServiceImpl` resolves the project by `shareToken` and applies Project Workspace source-aware behavior.
6. The response is appended only to local frontend state.

## Request/response shape if relevant

```json
{
  "shareToken": "token",
  "documentIds": ["optional-selected-document-uuid"],
  "message": "Question"
}
```

The response has null conversation/message IDs when no conversation is supplied, plus `answer` and `sources`.

## Key decisions

- Shared AI uses project context, not Homepage AI behavior.
- Shared chat remains temporary and unsaved.
- The dedicated shared endpoint prevents client-supplied conversation persistence.

## Caveats/limitations

- Reloading the shared page loses chat history.
- Source links may lead to document routes whose unauthenticated access behavior should be verified separately.
- A valid share token is the project resolution mechanism.

## Related notes

- [[Project Workspace AI Flow]]
- [[AI Chat Surfaces]]
- [[AI Source Links Flow]]
- [[AiAskServiceImpl]]
