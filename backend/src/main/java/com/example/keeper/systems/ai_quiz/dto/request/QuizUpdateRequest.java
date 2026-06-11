package com.example.keeper.systems.ai_quiz.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class QuizUpdateRequest {
    private String title;
    private List<QuestionUpdateRequest> questions;
}
