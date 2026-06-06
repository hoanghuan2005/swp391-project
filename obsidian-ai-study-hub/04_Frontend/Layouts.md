# Layouts

## Purpose

Document the shared user/admin page shells and navigation responsibilities.

## Important files

- `frontend/src/components/layout/MainLayout.jsx`
- `frontend/src/components/layout/Navbar.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/AdminLayout.jsx`
- `frontend/src/components/layout/AdminNavbar.jsx`
- `frontend/src/components/layout/AdminSidebar.jsx`
- `frontend/src/components/layout/AdminRouteGuard.jsx`

## Current flow

`MainLayout` renders Navbar, collapsible Sidebar, content Outlet, survey reminder/modal, and logout modal. It keeps search/filter state and passes it through Outlet context, currently consumed by Homepage.

Navbar handles search/filter inputs, user identity from decoded JWT, notification preview/read operations, and logout UI. Sidebar loads profile summary, followed courses, workspaces, and upload/create dialogs.

`AdminLayout` provides separate admin navbar/sidebar/content and logout modal. `AdminRouteGuard` redirects missing-token users to login and non-admin roles to `/home`.

## Props/state/API usage if relevant

- Layouts own sidebar-open and modal state.
- Navbar receives search/filter/logout callbacks.
- Sidebar uses profile, courses, and project APIs plus global update events.
- Admin navigation active state comes from `useLocation()`.

## Key decisions

- Separate user and admin navigation shells.
- Use nested `<Outlet />` for page content.
- Keep homepage search/filter controls in MainLayout/Navbar.
- Keep shared workspace routes outside both layouts.

## Caveats/limitations

- MainLayout triggers profile/survey checks for most routes.
- Navbar and Sidebar perform multiple independent client-side requests.
- Some navigation targets/features are placeholders or use broad global events.
- Frontend role decoding is only a UX guard, not an authorization boundary.

## Related notes

- [[Routing]]
- [[Frontend Architecture]]
- [[Important Components]]
- [[API Client and Token Refresh]]
