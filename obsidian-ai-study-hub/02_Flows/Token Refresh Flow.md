# Token Refresh Flow

## Purpose

Document how the frontend retries API requests after an expired access token.

## Important files

- `frontend/src/api/axiosClient.js`

## Current flow

1. Request interceptor reads `token` from `localStorage`.
2. If present, it attaches `Authorization: Bearer {token}`.
3. Backend returns `401` for an expired/invalid access token.
4. Response interceptor checks that the request is not a login request and has not already retried.
5. It reads `refreshToken` and posts it to `/api/auth/refresh-token` using plain Axios.
6. On success, it stores the new access token, updates the failed request, and retries through `axiosClient`.
7. On failure, it removes both tokens and redirects to `/login`.

## Props/state/API usage if relevant

The flow is interceptor-based and does not depend on React component state. `_retry` is attached to the original Axios request config to prevent an infinite retry loop.

## Key decisions

- Centralize retry behavior in the shared client.
- Use plain Axios for the refresh request.
- Preserve the existing refresh token when only the access token is renewed.

## Caveats/limitations

- Concurrent `401` responses can cause multiple refresh calls.
- Token storage in `localStorage` increases exposure to successful XSS.
- Backend URLs are hardcoded to localhost.
- Refresh failure uses an alert and full-page redirect.
- `403` responses show an alert but are not retried.

## Related notes

- [[API Client and Token Refresh]]
- [[Frontend Architecture]]
- [[Routing]]
- [[Auth Module]]
