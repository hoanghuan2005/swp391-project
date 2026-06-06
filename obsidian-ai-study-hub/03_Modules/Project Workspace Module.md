# Project Workspace Module

## Purpose

Manage owned projects/workspaces, attached documents, share tokens, shared reads, and project-scoped AI/quiz dependencies.

## Main controller files

- `ProjectController`

## Main service files

- `ProjectService` / `ProjectServiceImpl`
- Project AI behavior is coordinated by `AiAskServiceImpl`

## Main repository files

- `ProjectRepository`
- Dependencies: `UserRepository`, `DocumentRepository`, `QuizRepository`

## Main entity/DTO files

- Entity: `Project`
- DTOs: `CreateProjectRequest`, `ProjectDetailResponse`
- Related: `AiConversation.projectId`, `Quiz.projectId`

## Main endpoints

- `POST /api/projects`
- `GET /api/projects/my-projects`, `/api/projects/{id}`
- `POST/DELETE /api/projects/{projectId}/documents/{documentId}`
- `DELETE /api/projects/{projectId}`
- Public `GET /api/projects/shared/{token}`

## Key business flows

Create assigns the authenticated owner and a random share token. Owner checks protect add/remove document and delete. Shared reads resolve by share token. Project deletion removes related quizzes. Project Workspace AI stores multiple conversations by `projectId`; shared AI remains unsaved.

## Dependencies on other modules

- Auth/user ownership
- Document attachments/chunks
- AI Ask project context
- Quiz persistence

## Risks/caveats

- `getById(id)` does not visibly verify project ownership.
- Share tokens have no verified expiry or rotation flow.
- Project deletion explicitly deletes quizzes, but handling of project-scoped AI conversations was not verified.

## Related notes

- [[ProjectServiceImpl]]
- [[Project Workspace AI Flow]]
- [[Shared Workspace AI Flow]]
- [[AI Ask Module]]
