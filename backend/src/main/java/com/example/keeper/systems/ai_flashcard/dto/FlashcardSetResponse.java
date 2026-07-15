package com.example.keeper.systems.ai_flashcard.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class FlashcardSetResponse {
    private UUID id;
    private String title;
    private UUID documentId;
    private UUID userId;
    private String status;
    private String visibility;
    private boolean savedToLibrary;
    private UUID courseId;
    // Source document's course info (for smart publish)
    private UUID documentCourseId;
    private String documentCourseName;
    private String documentCourseCode;
    private long cards;
    private LocalDateTime createdAt;
    private List<FlashcardResponse> flashcards;
}
