# JwtAuthenticationFilter

## Purpose

Authenticate bearer-token requests and populate Spring Security context.

## Current behavior

The once-per-request filter reads `Authorization: Bearer ...`, extracts the email from JWT, loads the user, blocks banned accounts, normalizes the role to `ROLE_*`, and stores an email-based authentication principal.

Invalid/missing tokens pass through; downstream security rules decide whether the request is allowed.

## Dependencies

- `JwtService`
- `UserRepository`
- Spring Security context

## Risks/caveats

- The filter loads the user from the database on each bearer-token request.
- Token validity depends on `JwtService`; no explicit token revocation list is verified.
- Invalid token parsing is silently treated as unauthenticated.

## Related notes

- [[SecurityConfig]]
- [[Auth Module]]
- [[Backend Architecture]]
