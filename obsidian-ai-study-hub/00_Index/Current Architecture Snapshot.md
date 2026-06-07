# Current Architecture Snapshot

## Last updated

2026-06-06

## Core stack summary

- Frontend: React/Vite SPA with React Router, Axios, Tailwind/shadcn-style components, and local page state.
- Backend: Spring Boot layered architecture with Spring Security, Spring Data JPA, DTOs, and SQL persistence.
- External integrations: Groq, Cloudinary, mail, and OAuth2.
- Authentication: stateless JWT access token plus persisted refresh token.

## Main route/API/module overview

- `/` → public LandingPage
- `/home` → Homepage inside MainLayout with floating Homepage AI chatbot
- `/ask-ai` → Normal Ask AI
- `/workspace/:projectId/ai` → authenticated Project Workspace AI
- `/workspace/shared/:token/ai` → public shared workspace AI
- `/documents/:id` → authenticated document detail route used by AI source links
- `/admin/**` → frontend admin guard plus backend admin API rules

Backend generally follows Controller → Service → Repository → Entity/DTO. Key modules include auth, document, project, AI Ask, quiz, flashcard, catalogs, admin, profile, and notifications.

## Main AI flows

### Normal Ask AI

Saved non-project conversations, optionally linked to one document. Document context uses keyword-selected chunks. See [[Normal Ask AI Flow]].

### Homepage AI Chatbot

Floating authenticated chatbot on `/home`. It sends `mode: HOMEPAGE_ASSISTANT`, answers general study questions naturally, and focuses on discovering real PUBLIC documents by metadata. See [[Homepage AI Chatbot Flow]] and [[ADR-001 Homepage Chatbot Mode]].

### Project Workspace AI

Source-aware/project-context-focused AI with multiple saved conversations scoped by `projectId`. See [[Project Workspace AI Flow]] and [[ADR-003 Project Scoped Conversations]].

### Shared Workspace AI

Uses `shareToken` and project context. Chat is temporary and unsaved. See [[Shared Workspace AI Flow]].

### AI Source Links

Backend returns real `documentId/title` references in `AskAIResponse.sources`; frontend renders `/documents/{documentId}`. Groq does not generate URLs. See [[AI Source Links Flow]] and [[ADR-002 AI Source Links]].

## Main data model highlights

- User has Role, profile, languages, followed courses, and one persisted refresh token.
- Document contains file/discovery metadata and relates to uploader, course, tags, and category.
- DocumentChunk stores parsed text context; no vector/embedding model exists.
- Project has owner, share token, and attached documents.
- AiConversation stores optional documentId/projectId and owns AiMessages.
- AiMessage stores role/content/token count but not sources.
- Quiz/Question and FlashcardSet/Flashcard persist generated study content.

See [[Data Model Index]].

## Known limitations

- Keyword/metadata retrieval only; no vector/embedding search.
- Sources are document-level and not persisted in old message history.
- Several ownership/IDOR checks require remediation or confirmation.
- Hardcoded secrets/configuration and localhost URLs exist.
- Shared token lifecycle and shared source-link access need review.
- Document parsing uses unmanaged asynchronous execution.
- API errors/responses and Groq integration are inconsistent.
- No CI/CD workflow is verified.

## Key notes

- [[AI Architecture]]
- [[Backend Architecture]]
- [[Frontend Architecture]]
- [[API Index]]
- [[Data Model Index]]
- [[Architecture Decision Index]]
- [[Technical Debt Index]]
