# DocumentServiceImpl

## Purpose

Coordinate document persistence, Cloudinary storage URLs, catalog metadata, views, deletion, and AI parsing lifecycle.

## Current behavior

Upload stores the file, creates document metadata, marks supported PDF/DOCX/PPTX files `PENDING`, copies bytes, and runs parsing/chunk creation asynchronously. The result updates status to `READY` or `FAILED`. Service maps entities to list/detail DTOs and deletes storage, views, chunks, and document records.

## Dependencies

- Document/view/chunk repositories
- User/course/tag repositories
- `FileStorageService`
- `DocumentParserService`

## Risks/caveats

- Uses common-pool `CompletableFuture.runAsync()` rather than a verified managed executor.
- `getAll()` has no visibility filter.
- Delete does not visibly enforce ownership.
- Automatic course/tag creation can expand catalog data during upload.

## Related notes

- [[DocumentController]]
- [[Document Module]]
- [[Homepage AI Discovery Module]]
