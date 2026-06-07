# ADR-003 Project Scoped Conversations

## Status

Accepted

## Context

Project Workspace users need multiple saved conversations that remain separate from general Ask AI conversations. Public shared workspaces do not have a verified authenticated shared-user identity suitable for saving personal history.

## Decision

Authenticated Project Workspace conversations use `AiConversation.projectId`. The workspace loads, creates, and switches between multiple conversations scoped to its project.

Normal Ask AI conversations remain separate by using conversations where `projectId` is null.

Shared Workspace AI uses `shareToken` and keeps chat temporary/unsaved. The shared endpoint clears persistence-related conversation identifiers.

## Consequences

- Users can maintain multiple histories per project.
- Normal and project conversation lists do not mix.
- Shared visitors receive source-aware project answers without persisted history.
- Shared chat disappears on reload.
- Project deletion cleanup for project-scoped conversations remains uncertain.

## Alternatives considered

- Use one conversation per project: rejected because it limits distinct study threads.
- Mix project conversations into the normal list: rejected because context boundaries become unclear.
- Persist shared conversations anonymously: rejected because ownership, privacy, and lifecycle are undefined.

## Related notes

- [[Project Workspace AI Flow]]
- [[Shared Workspace AI Flow]]
- [[AiConversation AiMessage]]
- [[Project Workspace Module]]
