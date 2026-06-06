# Security Risks

## Purpose

Track verified or uncertain security risks requiring remediation or deeper review.

## Current risks

- A JWT signing key is hardcoded in source.
- Frontend access and refresh tokens are stored in `localStorage`.
- Several ID-based operations lack visible ownership checks, including document detail/delete/download, project read, quiz read, AI conversation message/delete, and flashcard-set detail.
- Category mutation routes are authenticated but are not verified as admin-only.
- Shared workspace access depends on long-lived share tokens with no verified expiry or rotation.
- OAuth success redirects with tokens in query parameters.
- Shared AI source links may target authenticated document APIs; unauthenticated shared-view behavior is uncertain.

## Impact

Potential secret exposure, XSS-assisted token theft, IDOR/data access, privilege-boundary mistakes, and unmanaged shared-link exposure.

## Recommended direction

- Move secrets and environment-specific values to secure configuration.
- Add consistent service-level ownership/authorization checks.
- Make category administration rules explicit.
- Add share-token rotation/revocation/expiry strategy.
- Review token delivery/storage and shared document-access policy.

## Related notes

- [[SecurityConfig]]
- [[Auth Module]]
- [[Project API]]
- [[Document API]]
- [[Future Improvements]]
