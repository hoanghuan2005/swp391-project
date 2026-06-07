# Quiz Module

## Purpose

Generate, persist, list, retrieve, and delete multiple-choice quizzes from a topic, document, or project.

## Main controller files

- `QuizController`

## Main service files

- `QuizGeneratorService` / `QuizGeneratorServiceImpl`
- `QuizService` / `QuizServiceImpl`

## Main repository files

- `QuizRepository`
- `QuestionRepository`
- Dependencies: document chunk, document, project, and user repositories

## Main entity/DTO files

- Entities: `Quiz`, `Question`
- DTOs: `QuizRequest`, `QuizResponse`, `QuestionDTO`
- Converter: `StringListConverter`

## Main endpoints

- `POST /api/quizzes/generate`
- `GET /api/quizzes/my-quizzes`
- `GET /api/quizzes/{id}`
- `DELETE /api/quizzes/{id}`

## Key business flows

Generation loads document/project chunks when provided, verifies AI readiness, limits context to 20,000 characters, asks Groq for strict JSON, validates questions/options, and persists the quiz with its owner. Delete verifies ownership.

## Dependencies on other modules

- AI Ask `GroqService`
- Document chunks/readiness
- Project documents
- Auth user ownership

## Risks/caveats

- `GET /api/quizzes/{id}` does not visibly enforce owner access.
- Project/document context concatenates chunks without relevance ranking.
- A comment mentions vectorization, but inspected code uses stored chunks and no vector search.

## Related notes

- [[GroqServiceImpl]]
- [[Document Module]]
- [[Project Workspace Module]]
