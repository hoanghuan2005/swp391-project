# Flashcard API

## Purpose

Document AI flashcard generation and flashcard-set retrieval endpoints.

## Endpoint table

| Method | Path | Controller | Auth | Request | Response |
|---|---|---|---|---|---|
| POST | `/api/ai_flashcard/generate` | `AiFlashcardController` | Authenticated | Optional multipart `document` and `text` params | `{success, data/message}` |
| POST | `/api/ai_flashcard/generate-from-document` | `AiFlashcardController` | Authenticated | `{documentId}` | `{success, data/message}` |
| GET | `/api/ai_flashcard/sets` | `AiFlashcardController` | Authenticated | None | `{data: sets}` |
| GET | `/api/ai_flashcard/sets/{id}` | `AiFlashcardController` | Authenticated | Set ID | `{data: set details}` |
| GET | `/api/ai_flashcard/my-documents` | `AiFlashcardController` | Authenticated | None | `{data: documents}` |
| GET | `/api/ai_flashcard/sets/latest` | `AiFlashcardController` | Authenticated | None | `{data: placeholder}` |

## Frontend callers if known from existing notes/code

- AI flashcard generator and flashcard pages

## Caveats/limitations

- Responses use generic maps rather than dedicated response DTOs.
- `/sets/latest` returns a generated placeholder rather than verified persisted latest data.
- Set-detail ownership enforcement is not visible.
- Controller/service currently log source content during generation.

## Related notes

- [[Flashcard Module]]
- [[Quiz Flashcard]]
- [[Document API]]
