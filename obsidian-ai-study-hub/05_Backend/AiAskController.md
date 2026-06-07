# AiAskController

## Purpose

Expose AI ask and conversation-management HTTP endpoints.

## Main endpoints

- `POST /api/ai/ask`
- Public `POST /api/ai/shared/ask`
- `GET/POST /api/ai/conversations`
- `GET /api/ai/conversations/{id}/messages`
- `DELETE /api/ai/conversations/{id}`

## Current flow

Normal ask delegates directly to `AiAskService`. Shared ask requires `shareToken`, clears `projectId`, `conversationId`, and `documentId`, then delegates. Conversation list/create resolves the authenticated user and supports optional `projectId`.

## Dependencies

- `AiAskService`
- `ConversationService`
- `UserRepository`

## Risks/caveats

- Message-history and delete endpoints do not visibly verify conversation ownership.
- Shared ask deliberately prevents conversation persistence.

## Related notes

- [[AI Ask Module]]
- [[AiAskServiceImpl]]
- [[Project Workspace Module]]
