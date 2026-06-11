package com.example.keeper.systems.ai_quiz.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class QuestionUpdateRequest {
    private String content;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
}
