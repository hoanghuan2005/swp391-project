package com.example.keeper.systems.ai_flashcard.service;

import com.example.keeper.systems.ai_ask.service.EmbeddingService;
import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.ai_flashcard.dto.FlashcardItemDto;
import com.example.keeper.systems.ai_flashcard.dto.FlashcardSetUpdateRequest;
import com.example.keeper.systems.ai_flashcard.entity.Flashcard;
import com.example.keeper.systems.ai_flashcard.entity.FlashcardSet;
import com.example.keeper.systems.ai_flashcard.repository.FlashcardRepository;
import com.example.keeper.systems.ai_flashcard.repository.FlashcardSetRepository;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.AiParseStatus;
import com.example.keeper.systems.document.repository.DocumentRepository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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

    private final FlashcardRepository flashcardRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final EmbeddingService embeddingService;

    // ====================================================================
    // 1. CÁC HÀM LẤY DỮ LIỆU TỪ DATABASE CHO SIDEBAR
    // ====================================================================

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<Map<String, Object>> getAllSetsByUser() {
        User user = getAuthenticatedUser();
        List<FlashcardSet> sets = flashcardSetRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        return sets.stream().map(set -> {
            // Đếm số lượng flashcard thực tế thuộc về Set này
            long cardCount = flashcardRepository.findAll().stream()
                    .filter(c -> c.getFlashcardSet() != null && c.getFlashcardSet().getId().equals(set.getId()))
                    .count();

            return Map.<String, Object>of(
                    "id", set.getId(),
                    "title", set.getTitle() != null ? set.getTitle() : "Untitled",
                    "cards", cardCount // <--- Đã thay số 0 thành biến đếm thực tế
            );
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAllDocumentsByUser() {
        User user = getAuthenticatedUser();
        List<Document> docs = documentRepository.findByUploadedById(user.getId());

        return docs.stream().map(doc -> Map.<String, Object>of(
                "id", doc.getId(),
                "title", doc.getOriginalFileName() != null ? doc.getOriginalFileName() : "Untitled",
                "courseCode", "General"
        )).collect(Collectors.toList());
    }

    public Map<String, Object> getSetDetailsById(UUID setId) {
        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Flashcard Set not found"));

        List<Flashcard> cards = flashcardRepository.findAll()
                .stream()
                .filter(c -> c.getFlashcardSet() != null && c.getFlashcardSet().getId().equals(setId))
                .collect(Collectors.toList());

        return Map.of(
                "id", set.getId(),
                "title", set.getTitle(),
                "flashcards", cards.stream().map(card -> Map.of(
                        "term", card.getTerm(),
                        "definition", card.getDefinition()
                )).collect(Collectors.toList())
        );
    }

    @Transactional
    public Map<String, Object> updateFlashcardSet(UUID setId, FlashcardSetUpdateRequest request) {
        User user = getAuthenticatedUser();
        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new IllegalArgumentException("Flashcard Set not found"));

        if (!set.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have permission to edit this flashcard set");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (request.getFlashcards() == null || request.getFlashcards().isEmpty()) {
            throw new IllegalArgumentException("At least one flashcard is required");
        }
        for (FlashcardItemDto card : request.getFlashcards()) {
            if (card == null || card.getTerm() == null || card.getTerm().isBlank()
                    || card.getDefinition() == null || card.getDefinition().isBlank()) {
                throw new IllegalArgumentException("Every flashcard must have a term and definition");
            }
        }

        set.setTitle(request.getTitle().trim());
        flashcardSetRepository.save(set);

        flashcardRepository.deleteAll(flashcardRepository.findByFlashcardSetId(setId));
        List<Flashcard> cards = request.getFlashcards().stream().map(item -> {
            Flashcard card = new Flashcard();
            card.setTerm(item.getTerm().trim());
            card.setDefinition(item.getDefinition().trim());
            card.setFlashcardSet(set);
            return card;
        }).collect(Collectors.toList());
        flashcardRepository.saveAll(cards);

        return getSetDetailsById(setId);
    }

    public void publishFlashcardSet(UUID id, UUID courseId, String visibility, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FlashcardSet set = flashcardSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard Set not found"));

        if (!set.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to publish this flashcard set");
        }

        set.setCourseId(courseId);
        set.setVisibility(visibility != null ? visibility : "PRIVATE");
        set.setStatus("PUBLISHED");
        
        flashcardSetRepository.save(set);
    }

    public List<Map<String, Object>> getCourseFlashcardSets(UUID courseId) {
        List<FlashcardSet> sets = flashcardSetRepository.findByCourseIdAndStatus(courseId, "PUBLISHED");
        
        return sets.stream().map(set -> {
            long cardCount = flashcardRepository.findAll().stream()
                    .filter(c -> c.getFlashcardSet() != null && c.getFlashcardSet().getId().equals(set.getId()))
                    .count();

            return Map.<String, Object>of(
                    "id", set.getId(),
                    "title", set.getTitle() != null ? set.getTitle() : "Untitled",
                    "cards", cardCount
            );
        }).collect(Collectors.toList());
    }

    // ====================================================================
    // 2. HÀM GENERATE FLASHCARD TỪ AI
    // ====================================================================

    public Map<String, Object> generateFlashcards(MultipartFile file, String text) throws Exception {

        String content = text != null ? text : "";
        Document linkedDocument = null;

        if (file != null && !file.isEmpty()) {
            String name = file.getOriginalFilename().toLowerCase();

            if (name.endsWith(".pdf")) {
                content += new PDFTextStripper().getText(Loader.loadPDF(file.getBytes()));
            } else if (name.endsWith(".docx")) {
                content += new XWPFWordExtractor(new XWPFDocument(file.getInputStream())).getText();
            } else {
                content += new String(file.getBytes());
            }

            linkedDocument = documentRepository.findAll().stream()
                    .filter(doc -> doc.getOriginalFileName() != null &&
                            doc.getOriginalFileName().equalsIgnoreCase(file.getOriginalFilename()))
                    .findFirst()
                    .orElse(null);
        }

        // --- ĐÃ THÊM: In log ra Console để kiểm tra nội dung đọc được ---
        System.out.println("====== NỘI DUNG TRÍCH XUẤT ĐƯỢC TỪ FILE ======");
        System.out.println(content);
        System.out.println("===============================================");

        // --- ĐÃ THÊM: Chặn lỗi nếu file không có chữ ---
        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Lỗi: Không tìm thấy chữ nào trong file này (File trống hoặc toàn hình ảnh).");
        }

        String title = linkedDocument != null ? linkedDocument.getTitle() : (file != null ? file.getOriginalFilename() : "AI Flashcard Set");
        return generateFlashcardsFromContent(content, title, linkedDocument);
    }

    public Map<String, Object> generateFlashcardsFromDocument(UUID documentId) throws Exception {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (document.getAiParseStatus() == AiParseStatus.PENDING) {
            throw new RuntimeException("Document is still being processed for AI. Please try again shortly.");
        }
        if (document.getAiParseStatus() == AiParseStatus.FAILED || document.getAiParseStatus() == AiParseStatus.UNSUPPORTED) {
            throw new RuntimeException("Document is not available for AI flashcards.");
        }

        float[] queryEmbedding = embeddingService.embed("key concepts, terms, and important definitions");
        List<DocumentChunk> chunks = documentChunkRepository.findSimilarChunksByDocumentId(documentId, java.util.Arrays.toString(queryEmbedding), 20);

        String content = chunks.stream()
                .map(DocumentChunk::getContent)
                .collect(Collectors.joining("\n\n"));

        if (content.trim().isEmpty()) {
            throw new RuntimeException("No parsed text found for this document.");
        }

        if (content.length() > 30000) {
            content = content.substring(0, 30000);
        }

        return generateFlashcardsFromContent(content, document.getTitle(), document);
    }

    private Map<String, Object> generateFlashcardsFromContent(String content, String title, Document linkedDocument) throws Exception {
        // --- ĐÃ SỬA: Cập nhật prompt để ép AI đọc văn bản ---
        String raw = callGroqApi("Trích xuất các khái niệm và định nghĩa quan trọng từ văn bản sau để làm flashcard. Văn bản: \n\n" + content);

        String cleanJson = raw
                .replaceAll("(?s).*(\\[.*\\]).*", "$1")
                .replaceAll("\\}\\s*\\{", "}, {");

        List<FlashcardItemDto> parsedCards = objectMapper.readValue(
                cleanJson,
                new TypeReference<List<FlashcardItemDto>>() {}
        );

        List<FlashcardItemDto> cards = parsedCards.stream()
                .filter(card -> card.getTerm() != null && !card.getTerm().isBlank()
                        && card.getDefinition() != null && !card.getDefinition().isBlank())
                .collect(Collectors.toList());

        if (cards.isEmpty()) {
            throw new RuntimeException("AI did not generate valid flashcards.");
        }

        User user = getAuthenticatedUser();
        FlashcardSet set = new FlashcardSet();
        set.setTitle(title != null ? title : "AI Flashcard Set");
        set.setSourceText(content);
        set.setUser(user);
        set.setDocument(linkedDocument);

        flashcardSetRepository.save(set);

        for (FlashcardItemDto item : cards) {
            Flashcard flashcard = new Flashcard();
            flashcard.setTerm(item.getTerm());
            flashcard.setDefinition(item.getDefinition());
            flashcard.setFlashcardSet(set);
            flashcardRepository.save(flashcard);
        }

        return Map.of(
            "id", set.getId(),
            "flashcards", cards
        );
    }

    private String callGroqApi(String content) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        // --- ĐÃ SỬA: Ép cứng System Prompt không cho phép AI tự bịa nội dung ---
        String systemPrompt = "Bạn là trợ lý AI chuyên tạo flashcard. " +
                "Nhiệm vụ: Trích xuất các khái niệm (term) và định nghĩa (definition) TỪ ĐÚNG NỘI DUNG VĂN BẢN MÀ USER CUNG CẤP. " +
                "Tuyệt đối KHÔNG tự bịa ra nội dung nếu văn bản không có. " +
                "Luôn trả về duy nhất 1 mảng JSON hợp lệ, không markdown, không giải thích thêm.";

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", content)),
                "temperature", 0.1);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(groqApiUrl, entity, String.class);
            return objectMapper.readTree(response.getBody()).path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }
}
