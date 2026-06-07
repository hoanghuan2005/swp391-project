# Auth API

## Purpose

Document authentication, account verification, refresh-token, survey, language, and avatar endpoints.

## Endpoint table

| Method | Path | Controller | Auth | Request | Response |
|---|---|---|---|---|---|
| POST | `/api/auth/signup` | `AuthController` | Public | `RegisterRequest` | Message string |
| POST | `/api/auth/login` | `AuthController` | Public | `LoginRequest` | `accessToken`, `refreshToken` map or error |
| POST | `/api/auth/refresh-token` | `AuthController` | Public | `{refreshToken}` | Access/refresh token map |
| POST | `/api/auth/forgot-password` | `AuthController` | Public | `email` query param | Message map |
| POST | `/api/auth/reset-password` | `AuthController` | Public | `email`, `otp`, `newPassword` params | Message string |
| POST | `/api/auth/verify-otp` | `AuthController` | Public | `email`, `otp` params | Message/error |
| POST | `/api/auth/verify-signup-otp` | `AuthController` | Public | `email`, `otp` params | Message/error |
| POST | `/api/auth/resend-signup-otp` | `AuthController` | Public | `email` param | Message/error |
| POST | `/api/survey` | `SurveyController` | Authenticated | `SurveyRequest` | `SurveyResponse` |
| POST | `/api/users/upload-avatar` | `UserController` | Authenticated | Multipart file | Response map |
| GET | `/api/languages` | `LanguageController` | Public | None | `LanguageResponse[]` |
| POST | `/api/languages` | `LanguageController` | Admin | `LanguageRequest` | `LanguageResponse` |
| DELETE | `/api/languages/{id}` | `LanguageController` | Admin | Path ID | Empty response |

OAuth2 routes under `/oauth2/**` and `/login/oauth2/**` are public.

## Frontend callers if known from existing notes/code

- Login/signup/recovery/OAuth callback pages
- `axiosClient` calls refresh-token after eligible `401` responses
- MainLayout survey flow and profile-related UI

## Caveats/limitations

- Token values must never be documented in the vault.
- Refresh request/response uses generic maps rather than dedicated DTOs.
- OTP values are passed as query parameters on several routes.
- OAuth success redirects with tokens in query parameters.

## Related notes

- [[Auth Module]]
- [[Token Refresh Flow]]
- [[User Role RefreshToken]]
- [[SecurityConfig]]
