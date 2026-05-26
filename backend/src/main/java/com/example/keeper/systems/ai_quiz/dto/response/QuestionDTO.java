package com.example.keeper.systems.ai_quiz.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QuestionDTO {
    private UUID id;
    private String content;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
}
