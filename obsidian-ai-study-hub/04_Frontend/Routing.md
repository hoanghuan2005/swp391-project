# Routing

## Purpose

Document the React Router route tree and route-level access structure.

## Important files

- `frontend/src/App.jsx`
- `frontend/src/components/layout/MainLayout.jsx`
- `frontend/src/components/layout/AdminLayout.jsx`
- `frontend/src/components/layout/AdminRouteGuard.jsx`

## Current flow

`App.jsx` uses `BrowserRouter`, `Routes`, nested `Route` elements, and a wildcard redirect to `/`.

Key routes:

- `/` → `LandingPage`
- `/home` → `Homepage` under `MainLayout`
- `/ask-ai` → `AskAIPage` under `MainLayout`
- `/workspace/:projectId/ai` → authenticated project workspace under `MainLayout`
- `/workspace/shared/:token/ai` → shared workspace outside `MainLayout`
- `/documents/:id` → document detail under `MainLayout`
- `/admin/**` → `AdminRouteGuard` then `AdminLayout`

## Props/state/API usage if relevant

Dynamic path params are used for document IDs, project IDs, shared tokens, quiz IDs, and course IDs. `ProjectWorkspacePage` switches authenticated/shared behavior based on `projectId` or `token`.

## Key decisions

- Shared workspace routes are public-facing and do not inherit MainLayout.
- Admin routes have a dedicated guard and layout.
- Main user routes share navbar/sidebar through nested layout routing.

## Caveats/limitations

- MainLayout itself is not an explicit route guard.
- `AdminRouteGuard` checks only token presence and decoded `role === "ADMIN"`; backend authorization is still required.
- Wildcard routes always redirect to `/`, so there is no dedicated not-found page.
- `/courses` and `/projects` currently render ComingSoon placeholders.

## Related notes

- [[Frontend Architecture]]
- [[Layouts]]
- [[ProjectWorkspacePage]]
- [[Homepage]]
