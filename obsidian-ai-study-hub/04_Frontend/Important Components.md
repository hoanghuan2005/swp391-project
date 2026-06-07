# Important Components

## Purpose

Summarize reusable frontend components and hooks that carry important cross-page behavior.

## Important files

- `frontend/src/components/chat/ChatInterface.jsx`
- `frontend/src/components/ai-sidebar/`
- `frontend/src/components/documents/`
- `frontend/src/components/layout/`
- `frontend/src/hooks/useDocuments.js`

## Current flow

Important shared pieces:

- **ChatInterface:** chat rendering, input, sending state, assistant-only source links.
- **AISidebar:** configurable AI history/document sidebar composed from header, history, and document sections.
- **UploadDocumentDialog:** loads catalog options, uploads multipart documents, optionally links to a project, and dispatches `documents:uploaded`.
- **DocumentDetailView/FilePreview/PdfViewer:** document detail, view recording, preview selection, PDF paging/zoom.
- **RecentDocuments:** recent-document list and download links.
- **SelectExistingDocument:** selects one document or links multiple documents to a project.
- **useDocuments:** loads current user's uploads and refreshes after global upload events.
- **MainLayout/AdminLayout:** shared navigation shells.

## Props/state/API usage if relevant

Components generally receive callbacks and selected items from page owners. Document components call `axiosClient` or `documentApi`; AI sidebar components remain mostly presentational. Browser custom events coordinate refreshes.

## Key decisions

- Compose AI sidebars from smaller reusable sections.
- Keep API-mode/business decisions in pages rather than `ChatInterface`.
- Reuse upload and document-selection dialogs across homepage/sidebar/workspace flows.
- Use route links for document and navigation destinations.

## Caveats/limitations

- API usage is split between direct `axiosClient` calls and domain wrappers.
- Global custom events are loosely typed and globally scoped.
- Several components contain placeholder behaviors such as favorite alerts.
- Some list operations/filtering are performed entirely client-side.

## Related notes

- [[Frontend Architecture]]
- [[ChatInterface]]
- [[AskAIPage]]
- [[ProjectWorkspacePage]]
- [[Layouts]]
