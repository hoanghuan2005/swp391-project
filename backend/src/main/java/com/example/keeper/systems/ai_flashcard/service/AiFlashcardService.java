package com.example.keeper.systems.ai_flashcard.service;

import com.example.keeper.systems.ai_flashcard.dto.FlashcardItemDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiFlashcardService {

    @Value("${GEMINI_API_KEY}")
    private String apiKey;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public AiFlashcardService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate(); // Khởi tạo RestTemplate để gọi HTTP Request
    }

    public List<FlashcardItemDto> generateFlashcards(String textContent) {
        // 1. Viết Prompt ép AI trả về chuẩn JSON
        String systemPrompt = "Bạn là một chuyên gia giáo dục. " +
                "Hãy đọc đoạn văn bản sau và trích xuất các thuật ngữ, khái niệm quan trọng nhất để làm flashcard. " +
                "QUY ĐỊNH BẮT BUỘC: Chỉ trả về kết quả dưới dạng một mảng JSON thuần túy, không có Markdown (không dùng ```json), không có text giải thích thêm. " +
                "Cấu trúc mỗi object trong mảng gồm 2 key: 'term' (thuật ngữ) và 'definition' (định nghĩa).\n\n" +
                "Văn bản: " + textContent;

        // 2. Gọi API thật đến Gemini
        String rawJsonAiResponse = callGeminiApi(systemPrompt);

        // THÊM ĐOẠN NÀY ĐỂ IN RA CONSOLE XEM AI TRẢ VỀ GÌ
        System.out.println("=== KẾT QUẢ TỪ GEMINI TRẢ VỀ ===");
        System.out.println(rawJsonAiResponse);
        System.out.println("=================================");

        // Nếu API lỗi và trả về mảng rỗng thì dừng luôn
        if (rawJsonAiResponse == null || rawJsonAiResponse.trim().equals("[]")) {
            return List.of();
        }

        // 3. Làm sạch chuỗi JSON cực mạnh (Tự động cắt bỏ text thừa)
        String cleanJson = rawJsonAiResponse.replace("```json", "").replace("```", "").trim();
        int startIndex = cleanJson.indexOf("[");
        int endIndex = cleanJson.lastIndexOf("]");

        if (startIndex >= 0 && endIndex >= 0) {
            cleanJson = cleanJson.substring(startIndex, endIndex + 1); // Cắt lấy đúng phần từ [ đến ]
        }

        // 4. Map chuỗi JSON thành List Object
        try {
            return objectMapper.readValue(cleanJson, new TypeReference<List<FlashcardItemDto>>() {});
        } catch (Exception e) {
            System.err.println("=== LỖI PARSE JSON: " + e.getMessage());
            System.err.println("=== DỮ LIỆU BỊ LỖI: " + cleanJson);
            throw new RuntimeException("Lỗi khi parse dữ liệu từ AI: " + e.getMessage());
        }
    }

    // Hàm gọi API thật của Google Gemini
    private String callGeminiApi(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
        System.out.println("=== KIỂM TRA URL: " + url);
        // Xây dựng Body Request theo đúng chuẩn của Gemini API
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();

        parts.put("text", prompt);
        contents.put("parts", List.of(parts));
        requestBody.put("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            // Bắn request lên Google
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            // Bóc tách kết quả JSON trả về từ Google
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

        } catch (Exception e) {
            System.err.println("Lỗi khi gọi Gemini API: " + e.getMessage());
            return "[]"; // Trả về mảng rỗng nếu lỗi
        }
    }
}