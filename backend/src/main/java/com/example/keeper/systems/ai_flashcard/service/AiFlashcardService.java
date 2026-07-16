package com.example.keeper.systems.ai_flashcard.service;

import com.example.keeper.systems.ai_ask.service.EmbeddingService;
import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.ai_ask.service.GroqService;
import com.example.keeper.systems.ai_ask.service.DocumentParserService;
import com.example.keeper.systems.ai_flashcard.dto.FlashcardItemDto;
import com.example.keeper.systems.ai_flashcard.dto.FlashcardSetUpdateRequest;
import com.example.keeper.systems.ai_flashcard.dto.FlashcardResponse;
import com.example.keeper.systems.ai_flashcard.dto.FlashcardSetResponse;
import com.example.keeper.systems.ai_flashcard.entity.Flashcard;
import com.example.keeper.systems.ai_flashcard.entity.FlashcardSet;
import com.example.keeper.systems.ai_flashcard.repository.FlashcardRepository;
import com.example.keeper.systems.ai_flashcard.repository.FlashcardSetRepository;
import com.example.keeper.systems.ai_usage.service.AiUsageService;
import com.example.keeper.systems.ai_usage.enums.AiUsageFeature;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.AiParseStatus;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.document.enums.Visibility;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiFlashcardService {

    private final ObjectMapper objectMapper;
    private final GroqService groqService;

    private final FlashcardRepository flashcardRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final EmbeddingService embeddingService;
    private final AiUsageService aiUsageService;
    private final DocumentParserService documentParserService;
    private final ProjectRepository projectRepository;

    // Helper method to map entities to FlashcardSetResponse
    private FlashcardSetResponse mapToFlashcardSetResponse(FlashcardSet set) {
        if (set == null)
            return null;

        List<Flashcard> cards = flashcardRepository.findByFlashcardSetId(set.getId());
        List<FlashcardResponse> flashcardResponses = cards.stream()
                .map(card -> FlashcardResponse.builder()
                        .id(card.getId())
                        .term(card.getTerm())
                        .definition(card.getDefinition())
                        .build())
                .collect(Collectors.toList());

        // Extract source document's course info for smart publish
        UUID documentCourseId = null;
        String documentCourseName = null;
        String documentCourseCode = null;
        if (set.getDocument() != null && set.getDocument().getCourse() != null) {
            var course = set.getDocument().getCourse();
            documentCourseId = course.getId();
            documentCourseName = course.getName();
            documentCourseCode = course.getCode();
        }

        return FlashcardSetResponse.builder()
                .id(set.getId())
                .title(set.getTitle() != null ? set.getTitle() : "Untitled")
                .documentId(set.getDocument() != null ? set.getDocument().getId() : null)
                .userId(set.getUser() != null ? set.getUser().getId() : null)
                .status(set.getStatus())
                .visibility(set.getVisibility())
                .savedToLibrary(set.isSavedToLibrary())
                .courseId(set.getCourseId())
                .documentCourseId(documentCourseId)
                .documentCourseName(documentCourseName)
                .documentCourseCode(documentCourseCode)
                .cards(flashcardResponses.size())
                .createdAt(set.getCreatedAt())
                .flashcards(flashcardResponses)
                .build();
    }

    public List<FlashcardSetResponse> getAllSetsByUser(String email, Boolean savedToLibrary) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<FlashcardSet> sets = flashcardSetRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        if (savedToLibrary != null) {
            sets = sets.stream()
                    .filter(s -> s.isSavedToLibrary() == savedToLibrary)
                    .collect(Collectors.toList());
        }

        return sets.stream()
                .map(this::mapToFlashcardSetResponse)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAllDocumentsByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Document> docs = documentRepository.findByUploadedById(user.getId());

        return docs.stream().map(doc -> Map.<String, Object>of(
                "id", doc.getId(),
                "title", doc.getOriginalFileName() != null ? doc.getOriginalFileName() : "Untitled",
                "courseCode", "General")).collect(Collectors.toList());
    }

    public FlashcardSetResponse getSetDetailsById(UUID setId) {
        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Flashcard Set not found"));
        return mapToFlashcardSetResponse(set);
    }

    public FlashcardSetResponse getSetDetailsById(UUID setId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Flashcard set not found"));

        boolean isOwner = set.getUser() != null && set.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());

        if (!isOwner && !isAdmin) {
            boolean hasAccess = false;
            if (set.getDocument() != null) {
                Document doc = set.getDocument();
                if (doc.getVisibility() == Visibility.PUBLIC || doc.getUploadedBy().getId().equals(user.getId())) {
                    hasAccess = true;
                } else {
                    hasAccess = projectRepository.hasUserAccessToDocumentThroughProjects(doc.getId(), user.getId());
                }
            }
            if (!hasAccess) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this flashcard set.");
            }
        }

        return getSetDetailsById(setId);
    }

    @Transactional
    public FlashcardSetResponse updateFlashcardSet(UUID setId, FlashcardSetUpdateRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
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
        if (request.getSavedToLibrary() != null) {
            set.setSavedToLibrary(request.getSavedToLibrary());
        }
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

        return mapToFlashcardSetResponse(set);
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
        set.setSavedToLibrary(true);

        flashcardSetRepository.save(set);
    }

    public List<FlashcardSetResponse> getCourseFlashcardSets(UUID courseId) {
        List<FlashcardSet> sets = flashcardSetRepository.findByCourseIdAndStatus(courseId, "PUBLISHED");

        return sets.stream()
                .map(this::mapToFlashcardSetResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FlashcardSetResponse generateFlashcards(MultipartFile file, String text, String email) throws Exception {
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

        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Lỗi: Không tìm thấy chữ nào trong file này (File trống hoặc toàn hình ảnh).");
        }

        String title = linkedDocument != null ? linkedDocument.getTitle()
                : (file != null ? file.getOriginalFilename() : "AI Flashcard Set");
        return generateFlashcardsFromContent(content, title, linkedDocument, email);
    }

    @Transactional
    public FlashcardSetResponse generateFlashcardsFromDocument(UUID documentId, String email) throws Exception {
        documentParserService.ensureChunksExist(documentId);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (document.getAiParseStatus() == AiParseStatus.PENDING) {
            throw new RuntimeException("Document is still being processed for AI. Please try again shortly.");
        }
        if (document.getAiParseStatus() == AiParseStatus.FAILED
                || document.getAiParseStatus() == AiParseStatus.UNSUPPORTED) {
            log.warn("Document {} parsing status is {}, using metadata fallback for flashcard generation.", documentId,
                    document.getAiParseStatus());
        }

        List<DocumentChunk> chunks;
        try {
            float[] queryEmbedding = embeddingService.embed("key concepts, terms, and important definitions");
            chunks = documentChunkRepository.findSimilarChunksByDocumentId(documentId,
                    java.util.Arrays.toString(queryEmbedding), 20);
        } catch (Exception e) {
            log.warn("Jina embedding failed for document {}, falling back to sequential chunks. Error: {}", documentId,
                    e.getMessage());
            chunks = documentChunkRepository.findByDocumentId(documentId);
            if (chunks.size() > 20) {
                chunks = chunks.subList(0, 20);
            }
        }

        String content = chunks.stream()
                .map(DocumentChunk::getContent)
                .collect(Collectors.joining("\n\n"));

        if (content.trim().isEmpty()) {
            String desc = document.getDescription();
            if (desc != null && !desc.trim().isEmpty()) {
                content = "Document Title: " + document.getTitle() + "\nDocument Description: " + desc;
            } else {
                content = "Document Title: " + document.getTitle();
            }
            log.info("Using document metadata fallback content for flashcard generation on document: {}", documentId);
        }

        if (content.length() > 30000) {
            content = content.substring(0, 30000);
        }

        return generateFlashcardsFromContent(content, document.getTitle(), document, email);
    }

    private FlashcardSetResponse generateFlashcardsFromContent(String content, String title, Document linkedDocument,
            String email) throws Exception {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        aiUsageService.checkQuota(user.getEmail());

        String systemPrompt = "Bạn là trợ lý AI chuyên tạo flashcard. "
                + "Nhiệm vụ: Trích xuất các khái niệm (term) và định nghĩa (definition) "
                + "TỪ ĐÚNG NỘI DUNG VĂN BẢN MÀ USER CUNG CẤP. "
                + "Tuyệt đối KHÔNG tự bịa ra nội dung nếu văn bản không có. "
                + "Luôn trả về duy nhất 1 mảng JSON hợp lệ, không markdown, không giải thích thêm.";

        String userPrompt = "Trích xuất các khái niệm và định nghĩa quan trọng từ văn bản sau để làm flashcard. "
                + "Văn bản:\n\n"
                + content;

        String raw = groqService.generateContent(
                systemPrompt,
                userPrompt,
                0.1);

        String cleanJson = raw
                .replaceAll("(?s).*(\\[.*\\]).*", "$1")
                .replaceAll("\\}\\s*\\{", "}, {");

        List<FlashcardItemDto> parsedCards = objectMapper.readValue(
                cleanJson,
                new TypeReference<List<FlashcardItemDto>>() {
                });

        List<FlashcardItemDto> cards = parsedCards.stream()
                .filter(card -> card.getTerm() != null && !card.getTerm().isBlank()
                        && card.getDefinition() != null && !card.getDefinition().isBlank())
                .collect(Collectors.toList());

        if (cards.isEmpty()) {
            throw new RuntimeException("AI did not generate valid flashcards.");
        }

        aiUsageService.recordUsage(user.getEmail(), AiUsageFeature.FLASHCARD_GENERATION);

        FlashcardSet set = new FlashcardSet();
        set.setTitle(title != null ? title : "AI Flashcard Set");
        set.setSourceText(content);
        set.setUser(user);
        set.setDocument(linkedDocument);

        flashcardSetRepository.save(set);

        List<Flashcard> flashcards = cards.stream()
                .map(item -> {
                    Flashcard flashcard = new Flashcard();
                    flashcard.setTerm(item.getTerm());
                    flashcard.setDefinition(item.getDefinition());
                    flashcard.setFlashcardSet(set);
                    return flashcard;
                })
                .collect(Collectors.toList());

        flashcardRepository.saveAll(flashcards);

        return mapToFlashcardSetResponse(set);
    }

    @Transactional
    public void toggleFavorite(UUID setId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FlashcardSet flashcardSet = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new RuntimeException("Flashcard set not found"));

        if (flashcardSet.getFavoritedByUsers().contains(user)) {
            flashcardSet.getFavoritedByUsers().remove(user);
        } else {
            flashcardSet.getFavoritedByUsers().add(user);
        }

        flashcardSetRepository.save(flashcardSet);
    }

    public List<FlashcardSetResponse> getMyFavorites(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<FlashcardSet> favoriteSets = flashcardSetRepository.findByFavoritedByUsersContains(user);

        return favoriteSets.stream()
                .map(this::mapToFlashcardSetResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteFlashcardSet(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FlashcardSet set = flashcardSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard set not found"));

        if (!set.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to delete this flashcard set");
        }

        // Delete all child flashcards to avoid foreign key constraint violations
        var dependentCards = flashcardRepository.findByFlashcardSetId(id);
        if (dependentCards != null && !dependentCards.isEmpty()) {
            flashcardRepository.deleteAll(dependentCards);
        }

        // Clear join table associations for favorites
        if (set.getFavoritedByUsers() != null) {
            set.getFavoritedByUsers().clear();
        }

        flashcardSetRepository.delete(set);
    }

    @Transactional
    public FlashcardSetResponse renameFlashcardSet(UUID setId, String newTitle, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FlashcardSet set = flashcardSetRepository.findById(setId)
                .orElseThrow(() -> new IllegalArgumentException("Flashcard set not found"));

        if (!set.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have permission to rename this flashcard set");
        }
        if (newTitle == null || newTitle.isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        set.setTitle(newTitle.trim());
        flashcardSetRepository.save(set);
        return getSetDetailsById(setId);
    }
}