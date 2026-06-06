# SecurityConfig

## Purpose

Define stateless HTTP security, public/admin route rules, CORS, OAuth2 login, password encoding, and JWT-filter placement.

## Current behavior

- Disables CSRF and server sessions.
- Adds `JwtAuthenticationFilter` before username/password authentication.
- Permits auth/OAuth2, shared project, shared AI, Swagger, and selected catalog GET routes.
- Requires `ADMIN` for `/api/admin/**` and selected catalog mutations.
- Requires authentication for all other routes.
- OAuth2 success can auto-provision a student user and redirect with access/refresh tokens.

## Dependencies

- `JwtAuthenticationFilter`, `JwtService`, refresh-token/user/role repositories
- Spring OAuth2 and BCrypt

## Risks/caveats

- CORS and OAuth redirect are hardcoded to localhost.
- Tokens are placed in OAuth redirect query parameters.
- Category mutations are not included in verified admin-only matchers.
- Shared endpoints rely on share-token secrecy.

## Related notes

- [[Backend Architecture]]
- [[JwtAuthenticationFilter]]
- [[Auth Module]]
