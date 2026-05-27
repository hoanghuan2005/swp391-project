package com.example.keeper.systems.ai_quiz.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class QuizRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private UUID documentId;

    private UUID projectId;

    private String topic;

    private Integer questionCount;

    private String difficulty;

    @JsonIgnore
    @AssertTrue(message = "Either documentId, projectId, or topic must be provided")
    public boolean isValidRequest() {
        return documentId != null || projectId != null || (topic != null && !topic.trim().isEmpty());
    }
}
