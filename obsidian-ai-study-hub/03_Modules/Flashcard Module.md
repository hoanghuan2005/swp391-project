# Flashcard Module

## Purpose

Generate and persist flashcard sets from uploaded files, raw text, or parsed document chunks.

## Main controller files

- `AiFlashcardController`

## Main service files

- `AiFlashcardService`

## Main repository files

- `FlashcardRepository`
- `FlashcardSetRepository`
- Dependencies: user, document, and document chunk repositories

## Main entity/DTO files

- Entities: `FlashcardSet`, `Flashcard`
- DTO: `FlashcardItemDto`
- Request wrapper: `FlashcardGenerateRequest`

## Main endpoints

- `POST /api/ai_flashcard/generate`
- `POST /api/ai_flashcard/generate-from-document`
- `GET /api/ai_flashcard/sets`, `/sets/{id}`, `/my-documents`, `/sets/latest`

## Key business flows

Raw uploads are parsed directly for PDF/DOCX/text. Document generation uses AI-ready chunks and a 30,000-character limit. The service calls Groq for a JSON array, filters invalid cards, and persists a set plus cards for the authenticated user.

## Dependencies on other modules

- Auth/current user
- Documents and chunks
- Groq external API

## Risks/caveats

- Service calls Groq directly instead of reusing `GroqService`.
- Extracted source content is printed to console.
- Set/card retrieval uses `findAll()` plus in-memory filtering/counting.
- `/sets/latest` returns a generated placeholder rather than persisted latest data.
- Set detail does not visibly verify ownership.

## Related notes

- [[GroqServiceImpl]]
- [[Document Module]]
- [[Backend Architecture]]
