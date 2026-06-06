# Profile Notification

## Purpose

Document user profile school metadata and per-user notifications.

## Entity files

- `profile/entity/UserProfile.java`
- `notification/entity/Notification.java`

## Important fields

- UserProfile: schoolName, schoolCode, startYear
- Notification: type, title, message, referenceId, referenceType, isRead

## Relationships

- UserProfile one-to-one User
- Notification many-to-one recipient User
- Notification optional many-to-one sender User
- Notification referenceId/referenceType is a generic logical reference, not a JPA relation

## Used by which modules

Profile/survey UI, Homepage document discovery through uploader school metadata, Navbar/notification page, and any module creating notifications.

## Persistence caveats

- Profile stores copied school code/name rather than a School relation.
- Notification generic references have no database-level relationship to target entities.
- Profile response follower/upvote values are currently placeholders, not verified persisted fields.

## Related notes

- [[Profile Notification API]]
- [[Profile Notification Module]]
- [[User Role RefreshToken]]
- [[Course Tag School Category]]
