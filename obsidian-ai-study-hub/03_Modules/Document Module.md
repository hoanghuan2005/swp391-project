# Document Module

## Purpose

Manage document metadata, upload/storage, preview/download URLs, AI parsing status/chunks, views, recent documents, public metadata discovery, and admin document operations.

## Main controller files

- `DocumentController`
- `AdminDocumentController`

## Main service files

- `DocumentService` / `DocumentServiceImpl`
- `DocumentDiscoveryService` / `DocumentDiscoveryServiceImpl`
- `FileStorageService`
- `DocumentParserService`

## Main repository files

- `DocumentRepository`
- `DocumentViewRepository`
- `DocumentChunkRepository`
- Dependencies: `CourseRepository`, `TagRepository`, `UserRepository`

## Main entity/DTO files

- Entities: `Document`, `DocumentView`, `DocumentChunk`
- DTOs: `CreateDocumentRequest`, `UpdateDocumentRequest`, `DocumentResponse`, `DocumentDetailResponse`
- Enums: `Visibility`, `AiParseStatus`

## Main endpoints

- `POST /api/documents`, `/api/documents/upload`
- `GET /api/documents`, `/recent`, `/my-uploads`, `/my-documents`, `/{id}`, `/{id}/detail`, `/{id}/download`
- `POST /api/documents/{id}/view`
- `DELETE /api/documents/{id}`
- Admin list/detail/delete under `/api/admin/documents`

## Key business flows

Upload stores the file in Cloudinary, persists metadata, generates preview/download URLs, and asynchronously parses supported PDF/DOCX/PPTX files into chunks. Delete removes storage, views, chunks, and the document. Discovery searches real PUBLIC metadata for Homepage AI.

## Dependencies on other modules

- Auth/user for uploader and recent-view ownership
- Course/tag/category/profile school metadata
- AI Ask, Quiz, and Flashcard use document chunks
- Project attaches documents

## Risks/caveats

- `getAll()` returns all documents without a visibility filter; access still requires authentication.
- Document detail/delete methods do not visibly enforce uploader ownership.
- Parsing uses unmanaged `CompletableFuture.runAsync()`.
- Upload request `uploadedById` is resolved by controller, but service builds ownership from current authentication.

## Related notes

- [[DocumentController]]
- [[DocumentServiceImpl]]
- [[Homepage AI Discovery Module]]
- [[Project Workspace Module]]
