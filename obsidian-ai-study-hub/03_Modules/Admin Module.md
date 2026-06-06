# Admin Module

## Purpose

Provide admin-only dashboard statistics, user moderation, document management, and catalog mutation access.

## Main controller files

- `DashboardController`
- `AdminUserController`
- `AdminDocumentController`
- Catalog controllers also expose admin-protected mutations

## Main service files

- Admin document operations reuse `DocumentService`
- Dashboard and admin-user controllers currently access repositories directly

## Main repository files

- User, document, course, school, tag, and language repositories

## Main entity/DTO files

- `DashboardStatsResponse`
- Reuses `User`, `DocumentResponse`, and `DocumentDetailResponse`

## Main endpoints

- `GET /api/admin/dashboard/stats`
- `GET /api/admin/users`
- `PUT /api/admin/users/{id}/ban`
- `GET/DELETE /api/admin/documents...`
- Admin-protected catalog mutations defined in `SecurityConfig`

## Key business flows

Dashboard counts core entities. Admin user management lists users and toggles banned status. The JWT filter rejects banned users. Admin document management lists, reads, and deletes through document service.

## Dependencies on other modules

- Auth/security roles
- Document service
- Catalog repositories

## Risks/caveats

- Dashboard/admin-user logic bypasses a service layer.
- Returning `User` entities directly may expose more fields than a dedicated admin DTO.
- Category mutation routes are not in the verified admin-only security matcher.

## Related notes

- [[SecurityConfig]]
- [[Auth Module]]
- [[Document Module]]
- [[Course Tag School Category Module]]
