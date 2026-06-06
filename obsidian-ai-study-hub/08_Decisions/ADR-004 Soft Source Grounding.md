# ADR-004 Soft Source Grounding

## Status

Accepted

## Context

Different AI surfaces need different grounding behavior. Project Workspace AI should prioritize workspace sources, while Homepage AI must still act as a natural study assistant. Current retrieval uses keyword-selected chunks and metadata matching, not semantic vector/embedding retrieval.

Hard refusal on every weak retrieval result would harm conversational questions, clarifications, and homepage study assistance.

## Decision

Use soft, surface-specific grounding:

- Project Workspace AI is source-aware and project-context focused. It should state when workspace sources do not support a factual answer.
- Homepage AI is not strict source-grounded. It answers naturally and only claims document matches when backend discovery supplies real candidates.
- Conversational/capability questions can be answered naturally even when no relevant source context exists.

Hard refusal is avoided where it would unnecessarily damage normal conversation.

## Consequences

- Project answers communicate source limitations without making the workspace unusable for conversation.
- Homepage remains useful for general study support.
- Answers are not guaranteed claim-level grounded.
- Retrieval quality depends on keyword/chunk and metadata matching.
- Vector/embedding retrieval remains future work, not current architecture.

## Alternatives considered

- Strict refusal across all AI surfaces: rejected because it harms natural chat and homepage usefulness.
- Fully ungrounded project chat: rejected because workspace users expect project-source focus.
- Immediate vector/embedding architecture replacement: deferred as a larger future improvement.

## Related notes

- [[AI Architecture]]
- [[Project Workspace AI Flow]]
- [[Homepage AI Chatbot Flow]]
- [[AI Limitations]]
