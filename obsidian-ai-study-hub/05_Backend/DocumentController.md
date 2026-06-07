# DocumentController

## Purpose

Expose authenticated document create/upload/list/detail/view/delete/download routes.

## Main endpoints

- `POST /api/documents`, `/api/documents/upload`
- `GET /api/documents`, `/recent`, `/my-uploads`, `/my-documents`
- `GET /api/documents/{id}`, `/{id}/detail`, `/{id}/download`
- `POST /api/documents/{id}/view`
- `DELETE /api/documents/{id}`

## Current flow

Upload resolves the current user when no uploader ID is supplied, builds a `CreateDocumentRequest`, delegates storage/creation, and returns detail DTOs. Recent/views/my-uploads resolve identity from Spring Security.

## Dependencies

- `DocumentService`
- `UserRepository`
- Spring Security context

## Risks/caveats

- Delete/detail/download routes do not visibly enforce owner or visibility checks.
- `/my-documents` currently maps all documents from service and hardcodes a course label, so its name/behavior is misleading.

## Related notes

- [[Document Module]]
- [[DocumentServiceImpl]]
- [[SecurityConfig]]
