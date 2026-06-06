# Homepage AI Chatbot Flow

## Purpose

Document the authenticated floating chatbot on `/home`. It is a normal conversational study assistant with a document-discovery focus.

## Important files

- `frontend/src/pages/Homepage.jsx`
- `frontend/src/api/aiApi.js`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/AiAskServiceImpl.java`
- `backend/src/main/java/com/example/keeper/systems/document/service/DocumentDiscoveryServiceImpl.java`

## Current flow

1. The user opens the floating Homepage Chat widget.
2. On the first message, Homepage creates a conversation titled `Homepage Chat`.
3. Homepage sends `conversationId`, `message`, and `mode: HOMEPAGE_ASSISTANT`.
4. `AiAskServiceImpl` calls `DocumentDiscoveryService.discover(message)`.
5. If document-search intent and real matches exist, their metadata is supplied to Groq and returned as sources.
6. If intent exists but no matches exist, Groq is told that backend discovery found zero matches.
7. For general study/conversational questions, Groq answers naturally without claiming documents were found.

## Request/response shape if relevant

```json
{
  "conversationId": "uuid",
  "message": "Tìm tài liệu Java cho HSF302",
  "mode": "HOMEPAGE_ASSISTANT"
}
```

Homepage copies `response.answer` and `response.sources || []` into the new assistant message.

## Key decisions

- Homepage mode is checked after project/shared routing.
- Homepage AI is not strict source-grounded.
- Recommendations must use only supplied real candidates and exact supplied titles.
- Backend creates source IDs/titles; Groq must not invent documents, IDs, titles, links, or URLs.

## Caveats/limitations

- Document intent detection is phrase-based.
- Homepage creates a persisted conversation but does not reload its history into the widget after page reload.
- Sources on old messages are not persisted.

## Related notes

- [[AI Chat Surfaces]]
- [[Homepage AI Discovery Module]]
- [[DocumentDiscoveryService]]
- [[Homepage]]
- [[AI Source Links Flow]]
