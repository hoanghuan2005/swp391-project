package com.example.keeper.systems.ai_ask.service;

public interface GroqService {

    String generateContent(String prompt);

    String generateContent(
            String systemPrompt,
            String userPrompt,
            double temperature
    );
}