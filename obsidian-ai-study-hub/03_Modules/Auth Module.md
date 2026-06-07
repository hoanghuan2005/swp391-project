# Auth Module

## Purpose

Handle signup, email verification, login, JWT access tokens, database refresh tokens, password reset, OAuth2 provisioning, languages/survey, and avatar upload.

## Main controller files

- `AuthController`
- `UserController`
- `LanguageController`
- `SurveyController`
- `AvatarController` is currently an empty class.

## Main service files

- `AuthService`
- `JwtService`
- `RefreshTokenService`
- `EmailService`
- `CloudinaryService`
- `SurveyServiceImpl`

## Main repository files

- `UserRepository`
- `RoleRepository`
- `RefreshTokenRepository`
- `LanguageRepository`
- `UserProfileRepository`

## Main entity/DTO files

- Entities: `User`, `Role`, `RefreshToken`, `Language`
- DTOs: `LoginRequest`, `RegisterRequest`, language/profile/survey request-response DTOs

## Main endpoints

- `POST /api/auth/signup`, `/login`, `/refresh-token`
- `POST /api/auth/forgot-password`, `/reset-password`, OTP verification/resend endpoints
- `POST /api/users/upload-avatar`
- `GET/POST/DELETE /api/languages`
- `POST /api/survey`

## Key business flows

Signup hashes the password, stores an OTP, and emails it. Login requires a verified, non-banned user and returns access/refresh tokens. Refresh tokens are UUID values persisted per user and expire after seven days. OAuth2 can auto-provision a user and issue both tokens.

## Dependencies on other modules

- Profile data through `UserProfileRepository`
- School/language choices through profile/survey flows
- Cloudinary for avatar upload
- Mail provider through Spring mail

## Risks/caveats

- JWT signing key is hardcoded in `JwtService`.
- OTPs use `Math.random()`, reuse `resetToken`, and no expiry field was verified.
- OAuth/CORS redirect configuration is localhost-specific.
- `AvatarController` has no behavior.

## Related notes

- [[Backend Architecture]]
- [[SecurityConfig]]
- [[JwtAuthenticationFilter]]
- [[Profile Notification Module]]
