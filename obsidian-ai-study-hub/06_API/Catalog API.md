# Catalog API

## Purpose

Document course, tag, school, category, and language catalog endpoints.

## Endpoint table

| Method | Path | Controller | Auth | Request/response |
|---|---|---|---|---|
| GET | `/api/courses`, `/api/courses/all`, `/api/courses/{id}`, `/api/courses/{id}/documents` | `CourseController` | Public | Course entities/pages |
| POST | `/api/courses` | `CourseController` | Admin | `CreateCourseRequest` → `Course` |
| DELETE | `/api/courses/{id}` | `CourseController` | Admin | Deleted `Course` |
| POST/DELETE | `/api/courses/{id}/follow` | `CourseController` | Authenticated | Empty |
| GET | `/api/courses/{id}/follow-status`, `/api/courses/followed` | `CourseController` | Public by SecurityConfig matcher | Boolean / course list |
| GET | `/api/tags`, `/api/tags/{id}` | `TagController` | Public | Tag entity/list |
| POST/DELETE | `/api/tags`, `/api/tags/{id}` | `TagController` | Admin | `CreateTagRequest` / Tag |
| GET | `/api/schools`, `/api/schools/{id}` | `SchoolController` | Public | `SchoolResponse` |
| POST/PUT/DELETE | `/api/schools...` | `SchoolController` | Admin | `SchoolRequest` / response |
| GET | `/api/languages` | `LanguageController` | Public | `LanguageResponse[]` |
| POST/DELETE | `/api/languages...` | `LanguageController` | Admin | Language DTO/empty |
| GET/POST/PUT/DELETE | `/api/categories...` | `CategoryController` | Authenticated | Category request/response DTOs |

## Frontend callers if known from existing notes/code

- Homepage, Navbar/Sidebar, course pages, upload dialog, profile/survey, admin catalog pages
- Homepage document discovery uses catalog metadata indirectly through backend

## Caveats/limitations

- `GET /api/courses/**` is publicly permitted and also matches follow-status/followed routes whose controllers expect authentication.
- Category routes are authenticated but not admin-only in verified SecurityConfig.
- Course/tag controllers often return entities directly.

## Related notes

- [[Course Tag School Category Module]]
- [[Course Tag School Category]]
- [[SecurityConfig]]
- [[Document API]]
