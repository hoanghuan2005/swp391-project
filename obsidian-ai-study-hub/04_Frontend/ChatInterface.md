# ChatInterface

## Purpose

Provide the reusable chat presentation layer for normal, homepage, project, and shared AI surfaces.

## Important files

- `frontend/src/components/chat/ChatInterface.jsx`
- `frontend/src/pages/Homepage.jsx`
- `frontend/src/pages/ai/ai_ask/AskAIPage.jsx`
- `frontend/src/pages/workspace/ProjectWorkspacePage.jsx`

## Current flow

The component receives messages and callbacks from its parent, manages only the local input field, sends trimmed input, auto-scrolls, renders loading states, and displays user/assistant bubbles.

For each non-user message, it renders `msg.sources` when the array is non-empty.

## Request/response shape if relevant

Expected message shape:

```json
{
  "id": "id",
  "role": "ASSISTANT",
  "content": "Answer",
  "sources": [
    { "documentId": "uuid", "title": "Document title" }
  ]
}
```

## Props/state/API usage if relevant

Props include title/subtitle, messages, loading/sending flags, send callback, optional empty state, upload controls, and context badge. The component owns only input text and an end-of-messages ref; parent pages own API calls and message collections.

## Key decisions

- Parent pages own API calls and AI mode selection.
- Sources render only for assistant messages.
- Source links use `/documents/${source.documentId}`.
- Missing titles fall back to `Document`.

## Caveats/limitations

- It renders plain pre-wrapped text, not structured citations tied to answer claims.
- Duplicate source IDs from a malformed response could produce duplicate React keys; backend currently deduplicates sources.
- Old history messages have no sources because backend does not persist them.
- Message role handling assumes `msg.role` exists and is a string.

## Related notes

- [[AI Source Links Flow]]
- [[AI Chat Surfaces]]
- [[Homepage]]
- [[AskAIPage]]
- [[ProjectWorkspacePage]]
