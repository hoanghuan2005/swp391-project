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

    @JsonIgnore
    @AssertTrue(message = "Either documentId or projectId must be provided")
    public boolean isDocumentOrProjectPresent() {
        return documentId != null || projectId != null;
    }
}
