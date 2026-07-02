package com.example.keeper.systems.ai_quiz.service;

import com.example.keeper.systems.ai_quiz.dto.request.QuizRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuizResponse;

import org.springframework.web.multipart.MultipartFile;

public interface QuizGeneratorService {
    QuizResponse generateQuiz(QuizRequest request, String userEmail);
    QuizResponse generateQuizFromFile(MultipartFile file, String text, String title, Integer questionCount, String difficulty, String userEmail);
}
