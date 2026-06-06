# API Client and Token Refresh

## Purpose

Document the shared Axios client, access-token attachment, refresh behavior, and API helper pattern.

## Important files

- `frontend/src/api/axiosClient.js`
- `frontend/src/api/aiApi.js`
- `frontend/src/api/documentApi.js`
- `frontend/src/hooks/useDocuments.js`

## Current flow

`axiosClient` uses a backend base URL and a 20-second timeout. A request interceptor reads `token` from `localStorage` and adds `Authorization: Bearer ...`. For `FormData`, it removes the default content type so the browser supplies the multipart boundary.

On a non-login `401`, the response interceptor retries once:

1. Read `refreshToken` from `localStorage`.
2. Call `/api/auth/refresh-token` with plain Axios.
3. Save the returned access token.
4. update the failed request authorization header.
5. Retry through `axiosClient`.

If refresh fails, tokens are removed and the browser redirects to `/login`. A `403` shows an alert.

## Props/state/API usage if relevant

- `aiApi.js` wraps ask, conversation creation, and shared ask.
- `documentApi.js` wraps recent documents, view recording, and uploaded-document retrieval.
- `useDocuments()` owns uploaded-document loading and refreshes on `documents:uploaded`.

## Key decisions

- Centralize bearer-token attachment and refresh handling.
- Use plain Axios for refresh to avoid interceptor recursion.
- Keep small domain API wrappers while some pages still call `axiosClient` directly.

## Caveats/limitations

- Base URLs are hardcoded to `http://localhost:8080`.
- Multiple simultaneous `401` responses can trigger multiple refresh requests; no refresh queue/deduplication is implemented.
- Tokens are stored in `localStorage`.
- `isLoginApi` checks an auth Google path that was not otherwise verified in the scoped frontend routes.
- Alerts and full-page redirects are used for auth/authorization failures.

## Related notes

- [[Token Refresh Flow]]
- [[Frontend Architecture]]
- [[Routing]]
- [[Important Components]]
