# Homepage

## Purpose

Describe the `/home` document browsing page and its floating authenticated StudyMate AI widget.

## Important files

- `frontend/src/pages/Homepage.jsx`
- `frontend/src/api/aiApi.js`
- `frontend/src/components/chat/ChatInterface.jsx`
- `frontend/src/components/documents/RecentDocuments.jsx`
- `frontend/src/components/documents/UploadDocumentDialog.jsx`

## Current flow

`/home` renders Homepage inside `MainLayout`. It receives search/filter values through outlet context, loads documents and courses, filters the displayed public documents, renders recent documents and upload UI, and shows a floating chat toggle.

The chat starts with a local welcome message. On first send, it creates a `Homepage Chat` conversation, then calls `askAi()` with `mode: HOMEPAGE_ASSISTANT`.

New assistant messages copy `response.answer` and `response.sources || []` for `ChatInterface`.

## Request/response shape if relevant

```json
{
  "conversationId": "created-homepage-conversation-id",
  "message": "User text",
  "mode": "HOMEPAGE_ASSISTANT"
}
```

## Props/state/API usage if relevant

- State covers documents, courses, loading, upload dialog, chat visibility/messages/conversation/sending.
- `useMemo` derives filtered documents.
- Listens for `documents:uploaded` to refresh/upsert public documents.
- Calls document/course/download APIs plus AI helpers.

## Key decisions

- Keep the chatbot as a compact floating widget.
- Reuse `ChatInterface` and the common `/api/ai/ask` endpoint.
- Let backend mode routing and discovery decide whether real document candidates exist.

## Caveats/limitations

- Widget history is local state during the page session and is not reloaded after refresh.
- The conversation/messages are saved because a conversation ID is created, but source references are not persisted.
- Homepage document list filtering and AI document discovery are separate implementations.
- School filtering currently returns no matches because the displayed document shape lacks school data.

## Related notes

- [[Homepage AI Chatbot Flow]]
- [[Homepage AI Discovery Module]]
- [[ChatInterface]]
- [[AI Chat Surfaces]]
- [[Layouts]]
