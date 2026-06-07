# Frontend Risks

## Purpose

Track frontend security, configuration, state-management, and UX consistency risks.

## Current risks

- API and refresh URLs are hardcoded to localhost.
- Access and refresh tokens are stored in `localStorage`.
- MainLayout routes have no explicit frontend authentication guard.
- Concurrent `401` responses can trigger duplicate refresh requests.
- Old AI source links are not restored because backend history lacks sources.
- Browser custom events such as `documents:uploaded` are loosely typed and globally scoped.
- API calls are split between domain wrappers and direct `axiosClient` usage.
- Shared source-link access for unauthenticated viewers is uncertain.

## Impact

Environment deployment is harder, authentication UX can be inconsistent, refresh races can occur, and cross-component updates become difficult to trace.

## Recommended direction

- Move frontend backend URLs to environment configuration.
- Add a refresh-request queue/single-flight mechanism.
- Define a consistent authenticated-route strategy.
- Replace or formalize global events with a typed shared-state/data-fetching approach.
- Restore citations once backend persistence exists.

## Related notes

- [[Frontend Architecture]]
- [[API Client and Token Refresh]]
- [[Routing]]
- [[AI Source Links Flow]]
- [[Future Improvements]]
