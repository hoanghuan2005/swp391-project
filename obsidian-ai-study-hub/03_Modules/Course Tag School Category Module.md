# Course Tag School Category Module

## Purpose

Manage catalog/reference metadata used by documents, profiles, filtering, and Homepage document discovery.

## Main controller files

- `CourseController`
- `TagController`
- `SchoolController`
- `CategoryController`

## Main service files

- `CourseServiceImpl`
- `TagServiceImpl`
- `SchoolServiceImpl`
- `CategoryServiceImpl`

## Main repository files

- `CourseRepository`
- `TagRepository`
- `SchoolRepository`
- `CategoryRepository`

## Main entity/DTO files

- Entities: `Course`, `Tag`, `School`, `Category`
- Request/response DTOs under each catalog package
- `CategoryType`

## Main endpoints

- CRUD-style routes under `/api/courses`, `/api/tags`, `/api/schools`, `/api/categories`
- Course search/all/documents/follow/unfollow/status/followed routes
- Category active-list route

## Key business flows

Course supports paging/search, attached-document listing, and user follows. School enforces unique codes on create. Category validates code/name and soft-deletes by setting inactive. Document upload can create missing courses/tags.

## Dependencies on other modules

- Documents use course/tag/category metadata.
- Profiles use school.
- Homepage discovery searches all catalog metadata plus uploader school.
- Users store followed courses.

## Risks/caveats

- Verified security rules make course/school/tag/language mutations admin-only, but category mutations are only covered by general authentication.
- Tag create does not visibly enforce uniqueness.
- Course deletion behavior with linked documents requires careful database validation.

## Related notes

- [[Document Module]]
- [[Homepage AI Discovery Module]]
- [[SecurityConfig]]
