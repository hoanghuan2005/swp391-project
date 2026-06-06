# AI Chat Surfaces

## Purpose

Document the four user-facing AI surfaces and their separate behavior.

## Important files

- `frontend/src/pages/ai/ai_ask/AskAIPage.jsx`
- `frontend/src/pages/workspace/ProjectWorkspacePage.jsx`
- `frontend/src/pages/Homepage.jsx`
- `frontend/src/components/chat/ChatInterface.jsx`
- `backend/src/main/java/com/example/keeper/systems/ai_ask/service/impl/AiAskServiceImpl.java`

## Current flow

| Surface | Request discriminator | Context behavior | Persistence |
|---|---|---|---|
| Normal Ask AI | No project/share token/homepage mode | General chat, optionally one document | Conversation and messages saved |
| Project Workspace AI | `projectId` | Source-aware project chunks, optionally selected `documentIds` | Project-scoped conversations and messages saved |
| Shared Workspace AI | `shareToken` | Source-aware shared project chunks | Temporary frontend chat; backend clears conversation ID |
| Homepage AI | `mode: HOMEPAGE_ASSISTANT` | General study assistant with public metadata discovery focus | Homepage creates a saved conversation, but does not reload it into the widget |

All surfaces can render response sources through `ChatInterface`.

## Request/response shape if relevant

The common response is `AskAIResponse`. New assistant message objects copy `response.sources || []`.

## Key decisions

- Normal Ask AI and Project Workspace AI are separate.
- Homepage AI must not inherit strict Project Workspace grounding.
- Shared workspace requests use a dedicated `/api/ai/shared/ask` wrapper.
- `ChatInterface` is reused for presentation but does not decide backend AI mode.

## Caveats/limitations

- Shared chat is reset when the shared view reloads.
- Old persisted messages have no source references.
- Homepage chat conversation history is saved server-side but not loaded by the widget after reload.

## Related notes

- [[AI Architecture]]
- [[Normal Ask AI Flow]]
- [[Project Workspace AI Flow]]
- [[Shared Workspace AI Flow]]
- [[Homepage AI Chatbot Flow]]
- [[AI Source Links Flow]]
