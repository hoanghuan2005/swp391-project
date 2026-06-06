# Profile Notification API

## Purpose

Document authenticated profile and notification endpoints.

## Endpoint table

| Method | Path | Controller | Auth | Request | Response |
|---|---|---|---|---|---|
| GET | `/api/profile` | `ProfileController` | Authenticated | None | `ProfileResponse` |
| PUT | `/api/profile` | `ProfileController` | Authenticated | `ProfileUpdateRequest` | `ProfileResponse` |
| GET | `/api/notifications` | `NotificationController` | Authenticated | Pageable params | `Page<NotificationResponse>` |
| GET | `/api/notifications/unread-count` | `NotificationController` | Authenticated | None | `{count}` |
| PUT | `/api/notifications/{notificationId}/read` | `NotificationController` | Authenticated | Notification ID | Message map |
| PUT | `/api/notifications/read-all` | `NotificationController` | Authenticated | None | Message map |

## Frontend callers if known from existing notes/code

- MainLayout/Navbar/Sidebar, profile page, survey/profile flows, notification page

## Caveats/limitations

- Profile response followers/upvotes are currently reported as placeholder zero values.
- Profile can store an unmatched free-text school name.
- Mark-all-read loads all user notifications before updating them.

## Related notes

- [[Profile Notification Module]]
- [[Profile Notification]]
- [[Layouts]]
