# Backend Risks

## Purpose

Track backend maintainability, reliability, and consistency risks.

## Current risks

- Document parsing uses unmanaged `CompletableFuture.runAsync()` with no verified managed executor, queue, retry, or job visibility.
- Dashboard and admin-user controllers access repositories directly.
- Flashcard service duplicates Groq HTTP integration.
- Flashcard generation logs extracted source content to console.
- Controllers/services use inconsistent response models: DTOs, entities, generic maps, strings, and empty responses.
- Runtime exceptions are commonly thrown directly; no consistent scoped API error model was verified.
- Some entity IDs are stored as loose UUID fields instead of JPA relationships, shifting integrity checks into application logic.
- Project deletion cleanup for project-scoped AI conversations is uncertain.

## Impact

Parsing work can be difficult to operate, sensitive content may enter logs, integrations diverge, and API clients receive inconsistent errors/shapes.

## Recommended direction

- Move parsing to a managed executor or durable job queue.
- Consolidate external AI calls behind one adapter.
- Remove source-content logging and adopt structured safe logging.
- Standardize controller/service boundaries, DTO responses, and exception handling.
- Define lifecycle cleanup for project-linked data.

## Related notes

- [[Backend Architecture]]
- [[DocumentServiceImpl]]
- [[GroqServiceImpl]]
- [[Future Improvements]]
