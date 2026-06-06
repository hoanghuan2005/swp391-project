# Project

## Purpose

Document workspace ownership, sharing, and attached-document persistence.

## Entity files

- `project/entity/Project.java`

## Important fields

- name
- description
- unique, required shareToken

## Relationships

- Many-to-one owner User
- Many-to-many attached Document through `project_documents`
- Project-scoped AI conversations and quizzes reference project UUIDs, but are not JPA relations on Project

## Used by which modules

Project/workspace APIs, Project Workspace AI, Shared Workspace AI, quiz generation, and document linking.

## Persistence caveats

- Share token has no verified expiry/rotation fields.
- AI conversation cleanup on project deletion was not verified.
- Attached documents are a set, preventing duplicate entity entries in memory.

## Related notes

- [[Project API]]
- [[Project Workspace Module]]
- [[AiConversation AiMessage]]
- [[Quiz Flashcard]]
