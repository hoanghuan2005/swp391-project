package com.example.keeper.systems.ai_flashcard.service;

import com.example.keeper.systems.ai_flashcard.dto.FlashcardItemDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

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

    public List<FlashcardItemDto> generateFlashcards(MultipartFile file, String text) throws Exception {
        String content = text != null ? text : "";

        if (file != null && !file.isEmpty()) {
            String name = file.getOriginalFilename().toLowerCase();
            if (name.endsWith(".pdf")) {
                content += new PDFTextStripper().getText(Loader.loadPDF(file.getBytes()));
            } else if (name.endsWith(".docx")) {
                content += new XWPFWordExtractor(new XWPFDocument(file.getInputStream())).getText();
            } else {
                content += new String(file.getBytes());
            }
        }

        String raw = callGroqApi("Tạo flashcard từ nội dung sau (chỉ trả về JSON array): " + content);
        String cleanJson = raw.replaceAll("(?s).*(\\[.*\\]).*", "$1")
                .replaceAll("\\}\\s*\\{", "}, {");

        return objectMapper.readValue(cleanJson, new TypeReference<List<FlashcardItemDto>>() {
        });
    }

    private String callGroqApi(String content) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        // System prompt là nơi quan trọng nhất để "dạy" AI trả về đúng format
        String systemPrompt = "Bạn là chuyên gia tạo flashcard. " +
                "Luôn trả về duy nhất 1 mảng JSON hợp lệ. " +
                "Mỗi phần tử trong mảng bắt buộc phải có 2 trường: 'term' và 'definition'. " +
                "Không giải thích, không markdown, không thêm bất kỳ văn bản nào ngoài JSON.";

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", "Nội dung: " + content)
                ),
                "temperature", 0.1
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(groqApiUrl, entity, String.class);
            return objectMapper.readTree(response.getBody())
                    .path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }
}