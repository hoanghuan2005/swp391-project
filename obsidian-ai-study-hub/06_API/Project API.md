# Project API

## Purpose

Document owned project/workspace and public shared-workspace endpoints.

## Endpoint table

| Method | Path | Controller | Auth | Request | Response |
|---|---|---|---|---|---|
| POST | `/api/projects` | `ProjectController` | Authenticated | `CreateProjectRequest` | `ProjectDetailResponse` |
| GET | `/api/projects/my-projects` | `ProjectController` | Authenticated | None | `ProjectDetailResponse[]` |
| GET | `/api/projects/{id}` | `ProjectController` | Authenticated | Project ID | `ProjectDetailResponse` |
| POST | `/api/projects/{projectId}/documents/{documentId}` | `ProjectController` | Authenticated | Path IDs | `ProjectDetailResponse` |
| DELETE | `/api/projects/{projectId}/documents/{documentId}` | `ProjectController` | Authenticated | Path IDs | `ProjectDetailResponse` |
| DELETE | `/api/projects/{projectId}` | `ProjectController` | Authenticated | Project ID | Empty |
| GET | `/api/projects/shared/{token}` | `ProjectController` | Public | Share token | `ProjectDetailResponse` |

`CreateProjectRequest` contains `name` and `description`. `ProjectDetailResponse` includes project metadata, share token, owner ID, created time, and attached document summaries.

## Frontend callers if known from existing notes/code

- Sidebar/workspace overview and project creation components
- ProjectWorkspacePage authenticated/shared modes
- Upload/select-existing-document components

## Caveats/limitations

- Share token has no verified expiry or rotation API.
- `GET /api/projects/{id}` ownership enforcement is not visible.
- Public shared response includes project details and attached document summaries.

## Related notes

- [[Project Workspace Module]]
- [[Project]]
- [[Project Workspace AI Flow]]
- [[Shared Workspace AI Flow]]
