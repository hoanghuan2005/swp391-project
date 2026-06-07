# Profile Notification Module

## Purpose

Manage authenticated user profile metadata and per-user notifications.

## Main controller files

- `ProfileController`
- `NotificationController`

## Main service files

- `ProfileService` / `ProfileServiceImpl`
- `NotificationService` / `NotificationServiceImpl`

## Main repository files

- `UserProfileRepository`
- `NotificationRepository`
- Dependencies: user, language, school, and document repositories

## Main entity/DTO files

- Entities: `UserProfile`, `Notification`
- DTOs: `ProfileUpdateRequest`, `ProfileResponse`, `NotificationResponse`
- Enums: `NotificationType`, `ReferenceType`

## Main endpoints

- `GET/PUT /api/profile`
- `GET /api/notifications`, `/unread-count`
- `PUT /api/notifications/{notificationId}/read`, `/read-all`

## Key business flows

Profile updates resolve school metadata, languages, name, avatar URL, and report upload count. Notifications are created for a recipient and queried/marked read using the authenticated user; single-notification reads verify recipient ownership.

## Dependencies on other modules

- Auth/current user
- School/language catalogs
- Document upload counts
- Other modules can call notification creation

## Risks/caveats

- Profile response currently hardcodes follower and upvote counts to zero.
- Arbitrary school name can be stored when no matching school exists.
- `markAllAsRead()` loads all notifications before flushing updates.

## Related notes

- [[Auth Module]]
- [[Course Tag School Category Module]]
- [[Backend Architecture]]
