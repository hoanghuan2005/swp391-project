package com.example.keeper.systems.ai_quiz.converter;

import com.example.keeper.systems.ai_quiz.dto.response.QuizQuestionAttempt;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

@Converter
public class QuizAttemptDetailsConverter implements AttributeConverter<List<QuizQuestionAttempt>, String> {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<QuizQuestionAttempt> attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Error converting quiz details to JSON", e);
        }
    }

    @Override
    public List<QuizQuestionAttempt> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<QuizQuestionAttempt>>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Error converting JSON to quiz details list", e);
        }
    }
}
