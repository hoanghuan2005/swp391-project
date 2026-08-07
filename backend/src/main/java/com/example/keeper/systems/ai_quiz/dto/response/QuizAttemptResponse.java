package com.example.keeper.systems.ai_quiz.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class QuizAttemptResponse {
    private UUID id;
    private UUID quizId;
    private String quizTitle;
    private UUID courseId;
    private int score;
    private int totalQuestions;
    private int elapsedSeconds;
    private LocalDateTime createdAt;
    private List<QuizQuestionAttempt> details;
}
