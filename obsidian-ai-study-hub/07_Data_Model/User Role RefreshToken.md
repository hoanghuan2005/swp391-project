# User Role RefreshToken

## Purpose

Document core identity, authorization, preferences, and refresh-token persistence.

## Entity files

- `auth/entity/User.java`
- `auth/entity/Role.java`
- `auth/entity/RefreshToken.java`
- `auth/entity/Language.java`

## Important fields

- `User`: username, email, password, resetToken, emailVerified, surveyCompleted, isBanned, avatarUrl
- `Role`: unique name
- `RefreshToken`: unique token, expiryDate
- `Language`: unique code, name

## Relationships

- User many-to-one Role
- User one-to-one UserProfile
- User many-to-many Language
- User many-to-many followed Course
- RefreshToken one-to-one User

## Used by which modules

Auth/security, profile, course following, documents, projects, quizzes, flashcards, notifications, and admin.

## Persistence caveats

- Password is JSON-ignored, but admin API returns User entities directly.
- Refresh token uses a separate numeric ID rather than `BaseEntity`.
- Reset/verification OTP reuses `resetToken`; no expiry entity field was verified.
- JWT access tokens are not persisted as entities.

## Related notes

- [[Auth API]]
- [[Auth Module]]
- [[Profile Notification]]
- [[SecurityConfig]]
