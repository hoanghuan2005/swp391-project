# Document API

## Purpose

Document document creation, upload, listing, detail, view tracking, download, and deletion endpoints.

## Endpoint table

| Method | Path | Controller | Auth | Request | Response |
|---|---|---|---|---|---|
| POST | `/api/documents` | `DocumentController` | Authenticated | `CreateDocumentRequest` | `DocumentDetailResponse` |
| POST | `/api/documents/upload` | `DocumentController` | Authenticated | Multipart file plus metadata params | `DocumentDetailResponse` |
| GET | `/api/documents` | `DocumentController` | Authenticated | None | `DocumentResponse[]` |
| GET | `/api/documents/recent?limit=` | `DocumentController` | Authenticated | Limit query param | `DocumentResponse[]` |
| POST | `/api/documents/{id}/view` | `DocumentController` | Authenticated | Path ID | Empty |
| GET | `/api/documents/my-uploads` | `DocumentController` | Authenticated | None | `DocumentResponse[]` |
| GET | `/api/documents/my-documents` | `DocumentController` | Authenticated | None | `{data: [...]}` |
| GET | `/api/documents/{id}` | `DocumentController` | Authenticated | Path ID | `DocumentDetailResponse` |
| GET | `/api/documents/{id}/detail` | `DocumentController` | Authenticated | Path ID | `DocumentDetailResponse` |
| DELETE | `/api/documents/{id}` | `DocumentController` | Authenticated | Path ID | Deleted `Document` |
| GET | `/api/documents/{id}/download` | `DocumentController` | Authenticated | Path ID | `{downloadUrl}` |

The frontend route `/documents/{documentId}` renders the document page and calls backend detail APIs. AI source links target this frontend route.

## Frontend callers if known from existing notes/code

- Homepage, My Library, document detail components, upload dialog, recent documents
- `useDocuments()` and `documentApi.js`
- Ask AI/workspace upload and selection flows

## Caveats/limitations

- All document endpoints are authenticated according to SecurityConfig.
- Detail/delete/download ownership or visibility checks are not visible at controller level.
- `/my-documents` currently derives from all service documents and returns a custom map.
- `UpdateDocumentRequest` exists but no update endpoint was verified.

## Related notes

- [[Document Module]]
- [[Document DocumentChunk DocumentView]]
- [[AI Source Links Flow]]
- [[DocumentController]]
