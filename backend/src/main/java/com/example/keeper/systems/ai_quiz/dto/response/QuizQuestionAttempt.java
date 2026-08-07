package com.example.keeper.systems.ai_quiz.dto.response;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestionAttempt {
    private UUID questionId;
    private String content;
    private List<String> options;
    private String correctAnswer;
    private String selectedAnswer;
    private boolean correct;
    private String explanation;
}
