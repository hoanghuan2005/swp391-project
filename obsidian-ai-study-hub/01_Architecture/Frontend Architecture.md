# Frontend Architecture

## Purpose

Provide an onboarding map of the React/Vite single-page application, routing, layouts, API integration, and shared component strategy.

## Important files

- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/api/axiosClient.js`
- `frontend/src/components/layout/`
- `frontend/src/components/documents/`
- `frontend/src/components/ai-sidebar/`

## Current flow

`main.jsx` mounts `<App />` into the root DOM node, wraps it with `GoogleOAuthProvider`, loads global CSS, and mounts the global toaster.

`App.jsx` owns `BrowserRouter`, route declarations, layout nesting, the admin guard, and fallback navigation.

Route groups:

- **Public:** `/`, auth/recovery routes, survey, OAuth callback, and shared workspace routes.
- **MainLayout user routes:** `/home`, documents, profile, library, Ask AI, AI tools, courses, authenticated workspaces, quiz/flashcard, and notifications.
- **Admin:** `/admin/**`, nested under `AdminRouteGuard` and `AdminLayout`.
- **Shared workspace:** `/workspace/shared/:token` and `/workspace/shared/:token/ai`, outside `MainLayout`.

`/` renders `LandingPage`. `/home` renders `Homepage`, including its floating authenticated AI chatbot.

## Props/state/API usage if relevant

- Pages primarily use local React state and effects.
- `axiosClient` is the shared authenticated HTTP client.
- `MainLayout` passes homepage search/filter state through outlet context.
- Reusable pages/components communicate through props and browser events such as `documents:uploaded`.

## Key decisions

- Use route layouts to share navigation shells.
- Keep shared workspace routes outside the authenticated-looking MainLayout shell.
- Reuse `ChatInterface` and `AISidebar` across AI pages.
- Keep API mode selection in parent pages, not presentational chat components.
- Use `@/` import aliases for most internal imports.

## Caveats/limitations

- No explicit frontend authentication guard wraps MainLayout routes; backend API security remains authoritative.
- API base URL and refresh endpoint are hardcoded to localhost.
- State/data fetching is mostly page-local; no shared server-state cache was verified.
- Browser events coordinate document/workspace/course refreshes, which can become difficult to trace.
- No frontend CI/CD workflow was verified in this scoped review.

## Related notes

- [[Routing]]
- [[Layouts]]
- [[API Client and Token Refresh]]
- [[Important Components]]
- [[AI Chat Surfaces]]
