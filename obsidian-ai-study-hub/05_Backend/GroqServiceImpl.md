# GroqServiceImpl

## Purpose

Provide the common backend adapter for sending a prompt to Groq and returning generated text.

## Current behavior

Builds a JSON request with configured model and one user-role message, adds bearer authentication, posts with `RestTemplate`, and returns the first choice message content.

Used by AI Ask and Quiz generation. Flashcard generation currently implements a separate direct Groq call.

## Dependencies

- Configured Groq API URL, model, and API key
- Shared `RestTemplate` bean

## Risks/caveats

- No timeout, retry, circuit breaker, typed response DTO, or structured error mapping was verified.
- Raw `Map` parsing is fragile.
- Flashcard Groq integration is duplicated.
- Never document or log configured credential values.

## Related notes

- [[AI Ask Module]]
- [[Quiz Module]]
- [[Flashcard Module]]
- [[AiAskServiceImpl]]
