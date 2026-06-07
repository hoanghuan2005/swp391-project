# ProjectServiceImpl

## Purpose

Manage project ownership, attached documents, share tokens, project reads, and deletion.

## Current behavior

Create assigns the authenticated user as owner and generates a UUID share token. Add/remove document and delete verify owner identity. Shared reads resolve by token. Project deletion removes related quizzes before deleting the project.

## Dependencies

- `ProjectRepository`
- `UserRepository`
- `DocumentRepository`
- `QuizRepository`

## Risks/caveats

- `getById()` does not visibly enforce ownership.
- Share tokens have no verified expiry/rotation/revocation operation.
- AI-conversation cleanup on project deletion was not verified.

## Related notes

- [[Project Workspace Module]]
- [[Project Workspace AI Flow]]
- [[Shared Workspace AI Flow]]
