# Admin API

## Purpose

Document endpoints protected by the `/api/admin/**` role rule.

## Endpoint table

| Method | Path | Controller | Auth | Response |
|---|---|---|---|---|
| GET | `/api/admin/dashboard/stats` | `DashboardController` | Admin | `DashboardStatsResponse` |
| GET | `/api/admin/users` | `AdminUserController` | Admin | `User[]` |
| PUT | `/api/admin/users/{id}/ban` | `AdminUserController` | Admin | Message string |
| GET | `/api/admin/documents` | `AdminDocumentController` | Admin | `DocumentResponse[]` |
| GET | `/api/admin/documents/{id}` | `AdminDocumentController` | Admin | `DocumentDetailResponse` |
| DELETE | `/api/admin/documents/{id}` | `AdminDocumentController` | Admin | Message string |

Selected course/school/tag/language mutation endpoints are also admin-only through explicit SecurityConfig matchers; see [[Catalog API]].

## Frontend callers if known from existing notes/code

- Admin dashboard, user list, document list/detail, and catalog pages under `AdminLayout`

## Caveats/limitations

- Admin users endpoint returns `User` entities directly.
- Dashboard and user-admin controllers access repositories directly.
- Category mutations are not covered by `/api/admin/**` or explicit admin catalog matchers.

## Related notes

- [[Admin Module]]
- [[SecurityConfig]]
- [[Catalog API]]
- [[User Role RefreshToken]]
