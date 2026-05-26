package com.example.keeper.systems.ai_flashcard.service;

import com.example.keeper.systems.ai_flashcard.dto.FlashcardItemDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiFlashcardService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model}")
    private String model;

    private final ObjectMapper objectMapper;

    private final RestTemplate restTemplate;

    public List<FlashcardItemDto> generateFlashcards(
            String textContent
    ) {

        String systemPrompt = """
                Bạn là một chuyên gia giáo dục.

                Hãy đọc đoạn văn bản sau và tạo flashcard học tập.

                QUY ĐỊNH:
                - Chỉ trả về JSON array thuần túy
                - Không markdown
                - Không ```json
                - Không giải thích thêm

                Format:

                [
                  {
                    "term": "...",
                    "definition": "..."
                  }
                ]

                Văn bản:
                """ + textContent;

        String rawJsonAiResponse =
                callGroqApi(systemPrompt);

        System.out.println("=== AI RESPONSE ===");
        System.out.println(rawJsonAiResponse);

        if (rawJsonAiResponse == null
                || rawJsonAiResponse.isBlank()) {

            return List.of();
        }

        String cleanJson = rawJsonAiResponse
                .replace("```json", "")
                .replace("```", "")
                .trim();

        int startIndex = cleanJson.indexOf("[");

        int endIndex = cleanJson.lastIndexOf("]");

        if (startIndex >= 0 && endIndex >= 0) {

            cleanJson =
                    cleanJson.substring(
                            startIndex,
                            endIndex + 1
                    );
        }

        try {

            return objectMapper.readValue(
                    cleanJson,
                    new TypeReference<List<FlashcardItemDto>>() {}
            );

        } catch (Exception e) {

            System.err.println(
                    "JSON PARSE ERROR: " + e.getMessage()
            );

            System.err.println(
                    "INVALID JSON: " + cleanJson
            );

            throw new RuntimeException(
                    "Failed to parse AI response"
            );
        }
    }

    private String callGroqApi(String prompt) {

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);

        headers.setBearerAuth(groqApiKey);

        Map<String, Object> requestBody = Map.of(

                "model", model,

                "messages", List.of(

                        Map.of(
                                "role", "system",
                                "content",
                                "You are an educational flashcard AI."
                        ),

                        Map.of(
                                "role", "user",
                                "content", prompt
                        )
                ),

                "temperature", 0.3
        );

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(requestBody, headers);

        try {

            ResponseEntity<String> response =
                    restTemplate.postForEntity(
                            groqApiUrl,
                            entity,
                            String.class
                    );

            JsonNode root =
                    objectMapper.readTree(
                            response.getBody()
                    );

            return root.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

        } catch (Exception e) {

            e.printStackTrace();

            return "[]";
        }
    }
}
