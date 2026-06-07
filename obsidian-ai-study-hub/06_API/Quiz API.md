# Quiz API

## Purpose

Document AI quiz generation and persisted quiz access.

## Endpoint table

| Method | Path | Controller | Auth | Request | Response |
|---|---|---|---|---|---|
| POST | `/api/quizzes/generate` | `QuizController` | Authenticated | `QuizRequest` | `QuizResponse` |
| GET | `/api/quizzes/my-quizzes` | `QuizController` | Authenticated | None | `QuizResponse[]` |
| GET | `/api/quizzes/{id}` | `QuizController` | Authenticated | Quiz ID | `QuizResponse` |
| DELETE | `/api/quizzes/{id}` | `QuizController` | Authenticated | Quiz ID | Empty |

`QuizRequest` includes title, optional document/project ID, topic, question count, and difficulty. `QuizResponse` includes quiz metadata and question DTOs.

## Frontend callers if known from existing notes/code

- AI quiz generator and quiz-taking pages
- Project/workspace quiz flows may provide `projectId`

## Caveats/limitations

- `GET /api/quizzes/{id}` does not visibly enforce owner access.
- Generated quiz response includes correct answers and explanations.
- No public quiz route is permitted by SecurityConfig.

## Related notes

- [[Quiz Module]]
- [[Quiz Flashcard]]
- [[GroqServiceImpl]]
