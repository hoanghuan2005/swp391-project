package com.example.keeper.systems.ai_quiz.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
public class QuizSubmitRequest {
    @NotNull(message = "Elapsed seconds is required")
    private Integer elapsedSeconds;

    @NotNull(message = "Answers are required")
    private Map<UUID, String> answers;
}
