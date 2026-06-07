# Quiz Flashcard

## Purpose

Document persisted AI-generated quiz and flashcard structures.

## Entity files

- `ai_quiz/entity/Quiz.java`
- `ai_quiz/entity/Question.java`
- `ai_flashcard/entity/FlashcardSet.java`
- `ai_flashcard/entity/Flashcard.java`

## Important fields

- Quiz: title, documentId, projectId
- Question: content, options, correctAnswer, explanation
- FlashcardSet: title, sourceText
- Flashcard: term, definition

## Relationships

- Quiz many-to-one owner User
- Quiz one-to-many Questions with cascade/orphan removal
- Question many-to-one Quiz
- FlashcardSet many-to-one User and optional Document
- Flashcard many-to-one FlashcardSet
- Quiz documentId/projectId are UUID fields, not JPA relations

## Used by which modules

Quiz generation/list/take/delete, project quiz cleanup, flashcard generation/list/detail.

## Persistence caveats

- Question options are stored through `StringListConverter` in a text column.
- FlashcardSet has no mapped one-to-many flashcards collection; service queries/filtering handles cards.
- Flashcard sourceText may duplicate large source content.
- Quiz read and flashcard-set detail ownership checks are not visibly enforced.

## Related notes

- [[Quiz API]]
- [[Flashcard API]]
- [[Quiz Module]]
- [[Flashcard Module]]
