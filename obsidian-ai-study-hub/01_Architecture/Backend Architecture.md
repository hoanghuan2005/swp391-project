# Backend Architecture

## Purpose

Provide an onboarding map of the Spring Boot backend and its main module boundaries.

## High-level layered architecture

Most modules follow:

```text
HTTP request
  -> Controller
  -> Service / ServiceImpl
  -> Spring Data Repository
  -> Entity/database
  -> DTO response
```

Controllers map HTTP and obtain the authenticated email when needed. Services own most business logic and cross-module coordination. Repositories use Spring Data JPA. Entities generally extend `BaseEntity`; request/response DTOs are used where a module has established them.

## Security filter/config role

`SecurityConfig` configures stateless Spring Security, CORS, OAuth2 login, role rules, public routes, and the JWT filter chain. `JwtAuthenticationFilter` reads bearer tokens, resolves the user, blocks banned users, and populates `SecurityContextHolder`.

Public routes include auth, OAuth2, shared projects, shared AI ask, and selected catalog GET endpoints. `/api/admin/**` requires `ADMIN`; most remaining endpoints require authentication.

## External integrations

- **Groq:** `GroqServiceImpl` calls the configured chat-completions-compatible endpoint with `RestTemplate`. AI flashcards also call Groq directly.
- **Cloudinary:** `CloudinaryConfig`, `FileStorageService`, and `CloudinaryService` support document/avatar storage.
- **Mail:** `EmailService` uses `JavaMailSender` for signup and password-reset OTP messages.
- **OAuth2:** `SecurityConfig` supports OAuth2 login, user auto-provisioning, and token redirect.

No credential values are documented in this vault.

## Important backend conventions

- Constructor injection with Lombok `@RequiredArgsConstructor` is common.
- Current-user identity usually comes from `SecurityContextHolder` or `AuthService.getCurrentUser()`.
- Service methods often use `@Transactional` around multi-entity writes.
- AI-ready documents use `AiParseStatus` and persisted `DocumentChunk` rows.
- Runtime exceptions are commonly thrown directly; no scoped global exception layer was verified.

## Main backend risks/caveats

- A JWT signing key is hardcoded in source; move it to secure configuration.
- OAuth redirect and CORS origins are hardcoded for localhost.
- Several ID-based endpoints/services do not visibly enforce owner access, including some document, project, quiz-read, and AI-conversation operations.
- Category mutation routes are authenticated but are not included in the verified admin-only matcher rules.
- Document parsing uses `CompletableFuture.runAsync()` without a verified managed executor.
- Flashcard service logs extracted content and duplicates Groq HTTP integration.
- Some controllers access repositories directly, especially dashboard/admin.

## Related notes

- [[SecurityConfig]]
- [[JwtAuthenticationFilter]]
- [[Auth Module]]
- [[Document Module]]
- [[Project Workspace Module]]
- [[AI Ask Module]]
