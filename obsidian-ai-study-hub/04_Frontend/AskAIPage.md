# AskAIPage

## Purpose

Provide the normal Ask AI experience with saved conversations and optional single-document context.

## Important files

- `frontend/src/pages/ai/ai_ask/AskAIPage.jsx`
- `frontend/src/components/chat/ChatInterface.jsx`
- `frontend/src/components/ai-sidebar/AISidebar.jsx`
- `frontend/src/hooks/useDocuments.js`

## Current flow

The page loads uploaded documents and normal conversations from `/api/ai/conversations`. Selecting a conversation loads its messages and restores its linked document when possible. The user can create/delete conversations, select one document, upload a document, and send a normal Ask AI request.

Before sending, the page blocks pending/failed/unsupported document context. It creates a conversation on demand, appends the local user message, posts `conversationId`, `message`, and optional `documentId`, then appends the assistant answer and sources.

## Props/state/API usage if relevant

- State: conversations, active conversation, messages, selected document, loading/upload/search flags.
- `documentsRef` avoids stale document lookup inside callbacks.
- Uses `axiosClient` directly for conversation, ask, upload, and delete APIs.
- Passes histories/documents/callbacks to `AISidebar` and chat state to `ChatInterface`.

## Key decisions

- Normal Ask AI is separate from Project Workspace AI and Homepage AI.
- Optional document focus is stored on conversation creation and request payload.
- New assistant messages copy `response.data.sources || []`.

## Caveats/limitations

- Loaded old message history has no sources because sources are not persisted.
- The page mixes direct API calls with shared hooks/components.
- Conversation list refresh occurs after each answer.
- Upload flow creates a public document and then starts a document-focused chat.

## Related notes

- [[Normal Ask AI Flow]]
- [[AI Chat Surfaces]]
- [[ChatInterface]]
- [[Important Components]]
