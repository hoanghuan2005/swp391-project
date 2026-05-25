package com.example.keeper.systems.ai_quiz.service;

import com.example.keeper.systems.ai_quiz.dto.request.QuizRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuizResponse;

public interface QuizGeneratorService {
    QuizResponse generateQuiz(QuizRequest request, String userEmail);
}
