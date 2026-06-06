# AI Ask API

## Purpose

Document Normal Ask AI, Homepage AI, Project/Shared Workspace AI, and conversation endpoints.

## Endpoint table

| Method | Path | Controller | Auth | Request | Response |
|---|---|---|---|---|---|
| POST | `/api/ai/ask` | `AiAskController` | Authenticated | `AskAIRequest` | `AskAIResponse` |
| POST | `/api/ai/shared/ask` | `AiAskController` | Public | `AskAIRequest` with `shareToken` | `AskAIResponse` |
| GET | `/api/ai/conversations?projectId=` | `AiAskController` | Authenticated | Optional project ID | `AiConversation[]` |
| POST | `/api/ai/conversations` | `AiAskController` | Authenticated | Optional `CreateConversationRequest` | `AiConversation` |
| GET | `/api/ai/conversations/{id}/messages` | `AiAskController` | Authenticated | Conversation ID | `AiMessage[]` |
| DELETE | `/api/ai/conversations/{id}` | `AiAskController` | Authenticated | Conversation ID | Empty |

`AskAIRequest` fields: `conversationId`, `message`, nullable `mode`, `projectId`, `shareToken`, `documentId`, `documentIds`.

`AiAskMode` currently defines `HOMEPAGE_ASSISTANT`.

`AskAIResponse` fields: `conversationId`, `assistantMessageId`, `answer`, and `sources[]`; each source contains real backend `documentId` and `title`.

## Frontend callers if known from existing notes/code

- Homepage sends `mode: HOMEPAGE_ASSISTANT`
- AskAIPage sends normal conversation/document requests
- ProjectWorkspacePage uses authenticated ask or shared ask
- ChatInterface renders source links to `/documents/{documentId}`

## Caveats/limitations

- Shared ask clears conversation/project/document IDs before service handling and remains unsaved.
- Conversation ID operations do not visibly enforce ownership in the inspected controller/service.
- Sources are response DTO metadata, not persisted `AiMessage` data.
- Groq must not generate document URLs.

## Related notes

- [[AI Ask Module]]
- [[AiConversation AiMessage]]
- [[AI Source Links Flow]]
- [[AiAskController]]
