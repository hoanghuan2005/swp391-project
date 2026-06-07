package com.example.keeper.systems.ai_ask.service.impl;

import com.example.keeper.systems.ai_ask.service.GroqService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GroqServiceImpl implements GroqService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model}")
    private String model;

    private final RestTemplate restTemplate;

    @Override
    public String generateContent(String prompt) {

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);

        headers.setBearerAuth(groqApiKey);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of(
                                "role", "user",
                                "content", prompt
                        )
                )
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(requestBody, headers);

        try {

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(
                            groqApiUrl,
                            request,
                            Map.class
                    );

            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("choices")) {

                List<Map<String, Object>> choices =
                        (List<Map<String, Object>>) body.get("choices");

                if (!choices.isEmpty()) {

                    Map<String, Object> message =
                            (Map<String, Object>)
                                    choices.get(0).get("message");

                    return (String) message.get("content");
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to get response from Groq API", e);
        }

        return "No response generated.";
    }
}