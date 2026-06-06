# ADR-001 Homepage Chatbot Mode

## Status

Accepted

## Context

The homepage needs a floating study assistant that can answer normal conversational and study questions while prioritizing discovery of real public documents. Reusing Project Workspace AI behavior would make homepage chat too strict and would mix project-scoped grounding with general discovery.

## Decision

Homepage sends `mode: HOMEPAGE_ASSISTANT` through the common AI Ask API.

Backend routing treats Homepage AI as a separate mode after project/shared routing and before Normal Ask AI behavior. Homepage AI remains a normal conversational assistant with document-discovery focus. It uses backend metadata discovery only when document-search intent is detected.

Normal Ask AI, Homepage AI, and Project Workspace AI remain separate behaviors.

## Consequences

- Homepage can answer general study questions naturally.
- Real document candidates can be recommended without changing Project Workspace AI.
- A new mode value is required in frontend and backend request handling.
- Mode-specific behavior remains concentrated in `AiAskServiceImpl`.
- Homepage conversation messages are saved, but the widget does not reload them after refresh.

## Alternatives considered

- Reuse Normal Ask AI without a mode: rejected because backend could not reliably apply homepage discovery behavior.
- Reuse Project Workspace AI: rejected because homepage chat should not be strict project-source-grounded.
- Create a separate homepage endpoint: not selected; the common ask endpoint with explicit mode keeps the API surface smaller.

## Related notes

- [[Homepage AI Chatbot Flow]]
- [[AI Chat Surfaces]]
- [[Homepage AI Discovery Module]]
- [[AI Ask API]]
