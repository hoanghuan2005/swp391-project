# ProjectWorkspacePage

## Purpose

Provide both authenticated project-scoped AI workspaces and public shared-token AI workspaces.

## Important files

- `frontend/src/pages/workspace/ProjectWorkspacePage.jsx`
- `frontend/src/api/aiApi.js`
- `frontend/src/api/projectApi.js`
- `frontend/src/components/chat/ChatInterface.jsx`
- `frontend/src/components/ai-sidebar/AISidebar.jsx`

## Current flow

The page reads `projectId` or `token` from route params.

Authenticated mode loads project details, project-scoped conversations, and saved messages. It supports multiple conversations and creates new conversations with `projectId`.

Shared mode loads by token, creates one local `main` conversation, and resets to the welcome message. It never creates a persisted AI conversation.

Both modes let users select multiple project documents or use the whole project. Sending uses `askAi` for authenticated mode and `askSharedAi` for shared mode, then appends answer and sources.

## Props/state/API usage if relevant

- State: project/loading/messages/sending, selected documents, search, conversations, active conversation.
- Payload includes `conversationId`, `projectId`, `shareToken`, optional `documentIds`, and message.
- Passes conversation/document callbacks to `AISidebar`.
- Passes a selected-source badge and messages to `ChatInterface`.

## Key decisions

- Project Workspace AI is separate from Homepage AI.
- Shared mode remains temporary/unsaved.
- Authenticated mode supports multiple project conversations.
- Selected documents restrict backend context; no selection means entire workspace.

## Caveats/limitations

- Shared chat history disappears on reload.
- Source links on old authenticated history are not restored.
- The page sends both project ID and share token in shared payload, relying on backend shared endpoint sanitization.
- Shared source-link accessibility for unauthenticated viewers requires separate verification.

## Related notes

- [[Project Workspace AI Flow]]
- [[Shared Workspace AI Flow]]
- [[AI Chat Surfaces]]
- [[ChatInterface]]
- [[Important Components]]
