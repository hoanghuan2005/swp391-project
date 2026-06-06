# Document DocumentChunk DocumentView

## Purpose

Document file metadata, AI-readable chunks, and per-user recent-view persistence.

## Entity files

- `document/entity/Document.java`
- `document/entity/DocumentView.java`
- `ai_ask/entity/DocumentChunk.java`

## Important fields

- Document: title, description, storage/preview/download metadata, original filename, file size, visibility, AI parse status, download count
- DocumentChunk: documentId, chunkIndex, text content
- DocumentView: lastViewedAt

## Relationships

- Document many-to-one uploader User, Course, and Category
- Document many-to-many Tag
- DocumentView many-to-one User and Document, unique per user/document pair
- DocumentChunk stores `documentId` as UUID, not a JPA relation

Discovery also reads uploader profile school code/name through Document → User → UserProfile.

## Used by which modules

Document browsing/upload, Homepage discovery, AI Ask, Project Workspace, Quiz, Flashcard, profile upload count, and admin.

## Persistence caveats

- No vector/embedding entity or field was verified.
- DocumentChunk is a loose UUID reference rather than a foreign-key entity relationship in code.
- Source links are not stored on DocumentChunk or Document.
- Visibility and ownership enforcement depends on service/controller behavior.

## Related notes

- [[Document API]]
- [[Document Module]]
- [[Homepage AI Discovery Module]]
- [[AiConversation AiMessage]]
