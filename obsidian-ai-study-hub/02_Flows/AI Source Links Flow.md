# AI Source Links Flow

## Purpose

Describe how real document references become clickable links under new assistant answers.

## Important files

- `backend/src/main/java/com/example/keeper/systems/ai_ask/dto/response/AskAIResponse.java`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/AiAskServiceImpl.java`
- `frontend/src/components/chat/ChatInterface.jsx`
- `frontend/src/pages/Homepage.jsx`
- `frontend/src/pages/ai/ai_ask/AskAIPage.jsx`
- `frontend/src/pages/workspace/ProjectWorkspacePage.jsx`

## Current flow

1. Backend uses a real `Document` while building document, project, or homepage context.
2. `addSource()` deduplicates by document ID and creates `SourceReference(documentId, title)`.
3. `AskAIResponse.sources` returns those references with the answer.
4. Each page copies `response.sources || []` into the new assistant message.
5. `ChatInterface` renders assistant-only source links to `/documents/{documentId}`.

## Request/response shape if relevant

```json
{
  "answer": "Generated answer",
  "sources": [
    {
      "documentId": "uuid",
      "title": "Real document title"
    }
  ]
}
```

## Key decisions

- IDs and titles come from backend document entities.
- Frontend constructs the route; Groq does not generate document URLs.
- Sources render only for assistant messages.
- Missing source titles display as `Document`.

## Caveats/limitations

- `AiMessage` has no sources field, so citations are not persisted in old history.
- Sources are document-level and do not identify the exact supporting chunk or claim.
- Project deterministic/no-context responses and general answers can return an empty source list.

## Related notes

- [[ChatInterface]]
- [[AiAskServiceImpl]]
- [[Normal Ask AI Flow]]
- [[Homepage AI Chatbot Flow]]
- [[Project Workspace AI Flow]]
