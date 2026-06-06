# Future Improvements

## Purpose

Provide a prioritized improvement direction without claiming these capabilities already exist.

## Recommended priorities

### Security and authorization

- Move JWT, Groq, Cloudinary, mail, OAuth, origins, and redirect configuration into secure environment-specific configuration.
- Add consistent ownership/authorization checks for ID-based operations.
- Add share-token expiry, rotation, and revocation.

### AI quality and citations

- Persist document source references with AI message history.
- Add chunk-level evidence and citation UX.
- Evaluate vector/embedding retrieval using a measured benchmark; it is not currently implemented.
- Standardize Groq timeout, retry, error, and response parsing behavior.

### Backend reliability

- Replace unmanaged asynchronous parsing with a managed executor or durable job queue.
- Standardize API error responses and DTO usage.
- Remove sensitive content logging and consolidate Groq integration.
- Define cleanup rules for project-linked conversations and generated content.

### Frontend reliability

- Use environment-configured API URLs.
- Add a refresh-token single-flight queue.
- Add explicit authenticated-route handling where appropriate.
- Formalize shared data refresh instead of relying on global custom events.

### Delivery

- Add automated build/test/security checks and a CI/CD workflow.
- CI/CD is a recommendation; no workflow is currently verified.

## Related notes

- [[Security Risks]]
- [[AI Limitations]]
- [[Backend Risks]]
- [[Frontend Risks]]
- [[Current Architecture Snapshot]]
