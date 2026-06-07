# AI Architecture

## Purpose

Describe the current AI boundaries and how requests are routed without mixing the behavior of Normal Ask AI, Project Workspace AI, Shared Workspace AI, and Homepage AI.

## Important files

- `backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/AiAskServiceImpl.java`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/controller/AiAskController.java`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/dto/request/AskAIRequest.java`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/dto/response/AskAIResponse.java`
- `frontend/src/api/aiApi.js`

## Current flow

`AiAskServiceImpl.ask()` builds a base StudyMate prompt and routes requests in this order:

1. A request with `shareToken` or `projectId` uses Project Workspace behavior.
2. A request with `mode: HOMEPAGE_ASSISTANT` uses Homepage AI behavior.
3. All other requests use Normal Ask AI behavior, optionally with one document.

Project/document context uses stored `DocumentChunk` rows selected by keyword score. Homepage document discovery uses public document metadata instead of chunks.

## Request/response shape if relevant

`AskAIRequest` can contain `conversationId`, `message`, `mode`, `projectId`, `shareToken`, `documentId`, and `documentIds`.

`AskAIResponse` contains `conversationId`, `assistantMessageId`, `answer`, and `sources`. Each source contains backend-generated `documentId` and `title`.

## Key decisions

- Project/shared routing takes priority over homepage mode.
- Homepage AI remains conversational and is not strict source-grounded.
- Project Workspace AI is project-context/source-aware.
- Groq generates answer text, not document URLs.
- No vector or embedding retrieval is implemented in the inspected AI code.

## Caveats/limitations

- Chunk relevance is simple keyword matching with a character limit.
- Sources are document-level references, not claim-level citations.
- Sources are not stored in `AiMessage`, so old history does not restore them.

## Related notes

- [[AI Chat Surfaces]]
- [[AiAskServiceImpl]]
- [[Homepage AI Discovery Module]]
- [[AI Source Links Flow]]
