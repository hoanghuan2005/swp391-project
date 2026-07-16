package com.example.keeper.systems.ai_quiz.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QuizResponse {
    private UUID id;
    private String title;
    private UUID documentId;
    private UUID projectId;
    private UUID ownerId;
    private UUID courseId;
    // Source document's course info (for smart publish)
    private UUID documentCourseId;
    private String documentCourseName;
    private String documentCourseCode;
    private LocalDateTime createdAt;
    private List<QuestionDTO> questions;
}
