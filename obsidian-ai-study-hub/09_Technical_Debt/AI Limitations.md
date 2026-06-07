# AI Limitations

## Purpose

Track current retrieval, grounding, citation, and AI-integration limitations.

## Current limitations

- Document/project context retrieval uses substring keyword scoring with character limits.
- Homepage discovery uses phrase-based intent detection and SQL metadata matching.
- No vector/embedding search or persistence is implemented.
- Source links identify documents, not exact chunks or answer claims.
- Sources are not persisted in `AiMessage`, so old history does not restore citations.
- Homepage discovery quality depends on metadata completeness and database collation.
- Groq adapter has no verified timeout strategy, retry policy, circuit breaker, or typed response handling.
- Flashcards duplicate direct Groq integration instead of using the shared adapter.

## Impact

Relevant sources can be missed, weak matches can be included, answer support is coarse-grained, and external AI failures have limited resilience.

## Recommended direction

- Persist source/citation snapshots with messages.
- Add chunk-level evidence before claiming claim-level citations.
- Evaluate semantic/vector retrieval with measured quality before replacing current ranking.
- Standardize Groq integration, timeouts, retries, and error responses.

## Related notes

- [[ADR-002 AI Source Links]]
- [[ADR-004 Soft Source Grounding]]
- [[AI Architecture]]
- [[GroqServiceImpl]]
- [[Future Improvements]]
