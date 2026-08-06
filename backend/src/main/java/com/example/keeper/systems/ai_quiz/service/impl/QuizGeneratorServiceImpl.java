package com.example.keeper.systems.ai_quiz.service.impl;

import com.example.keeper.systems.ai_ask.service.GroqService;
import com.example.keeper.systems.ai_ask.service.EmbeddingService;
import com.example.keeper.systems.ai_ask.service.DocumentParserService;
import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.ai_usage.service.AiUsageService;
import com.example.keeper.systems.ai_usage.enums.AiUsageFeature;
import com.example.keeper.systems.auth.repository.SubscriptionPlanRepository;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.AiParseStatus;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.project.entity.Project;
import com.example.keeper.systems.project.repository.ProjectMemberRepository;
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.ai_quiz.dto.request.QuizRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuestionDTO;
import com.example.keeper.systems.ai_quiz.dto.response.QuizResponse;
import com.example.keeper.systems.ai_quiz.entity.Question;
import com.example.keeper.systems.ai_quiz.entity.Quiz;
import com.example.keeper.systems.ai_quiz.repository.QuizRepository;
import com.example.keeper.systems.ai_quiz.service.QuizGeneratorService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizGeneratorServiceImpl implements QuizGeneratorService {

    private static final double SIMILARITY_THRESHOLD = 0.35;

    private final QuizRepository quizRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final GroqService groqService;
    private final EmbeddingService embeddingService;
    private final AiUsageService aiUsageService;
    private final DocumentParserService documentParserService;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    private int getMaxQuizQuestions(User user) {
        String tierCode = user.getSubscriptionTier() != null ? user.getSubscriptionTier().name() : "FREE";
        return subscriptionPlanRepository.findByCodeAndIsActiveTrue(tierCode)
                .map(p -> p.getMaxQuizQuestionsPerGeneration() != null ? p.getMaxQuizQuestionsPerGeneration() : (tierCode.equalsIgnoreCase("PRO") ? 50 : 20))
                .orElse(tierCode.equalsIgnoreCase("PRO") ? 50 : 20);
    }

    @Override
    @Transactional
    public QuizResponse generateQuiz(QuizRequest request, String userEmail) {
        aiUsageService.checkQuota(userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdmin = user.getRole() != null && "ADMIN".equals(user.getRole().getName());

        List<UUID> targetDocIds = new ArrayList<>();
        if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
            targetDocIds.addAll(request.getDocumentIds());
        } else if (request.getDocumentId() != null) {
            targetDocIds.add(request.getDocumentId());
        }

        if (!targetDocIds.isEmpty()) {
            aiUsageService.checkDocumentSelectionLimit(userEmail, targetDocIds.size());
        }

        // Enforce document permission check
        for (UUID docId : targetDocIds) {
            Document document = documentRepository.findById(docId)
                    .orElseThrow(() -> new RuntimeException("Document not found: " + docId));
            boolean isOwner = document.getUploadedBy() != null && document.getUploadedBy().getId().equals(user.getId());
            boolean isPublic = document.getVisibility() == Visibility.PUBLIC;
            if (!isAdmin && !isOwner && !isPublic) {
                boolean hasProjectAccess = projectRepository.hasUserAccessToDocumentThroughProjects(document.getId(), user.getId());
                if (!hasProjectAccess) {
                    throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access document: " + docId);
                }
            }
        }

        // Enforce project permission check
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            boolean isOwner = project.getOwner() != null && project.getOwner().getId().equals(user.getId());
            boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId());
            if (!isAdmin && !isOwner && !isMember) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this project.");
            }
        }

        // Enforce tier-based question count limit
        int maxQuestions = getMaxQuizQuestions(user);
        if (!isAdmin && request.getQuestionCount() != null && request.getQuestionCount() > maxQuestions) {
            request.setQuestionCount(maxQuestions);
            log.info("Clamped quiz question count to {} for tier {}", maxQuestions, user.getSubscriptionTier());
        }

        String context = "";
        if (request.getDocumentId() != null || (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) || request.getProjectId() != null) {
            context = fetchContext(request);
        }

        // --- SAFETY CHECK & FALLBACK CONTEXT ---
        if (context.trim().isEmpty()) {
            if (request.getDocumentId() != null) {
                Document document = documentRepository.findById(request.getDocumentId()).orElse(null);
                if (document != null) {
                    context = "Document Title: " + document.getTitle();
                    if (document.getDescription() != null && !document.getDescription().trim().isEmpty()) {
                        context += "\nDocument Description: " + document.getDescription();
                    }
                    log.info("Using document metadata fallback context for document: {}", request.getDocumentId());
                }
            } else if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
                StringBuilder fallbackBuilder = new StringBuilder();
                for (UUID docId : request.getDocumentIds()) {
                    Document document = documentRepository.findById(docId).orElse(null);
                    if (document != null) {
                        if (fallbackBuilder.length() > 0) {
                            fallbackBuilder.append("\n\n");
                        }
                        fallbackBuilder.append("Document Title: ").append(document.getTitle());
                        if (document.getDescription() != null && !document.getDescription().trim().isEmpty()) {
                            fallbackBuilder.append("\nDocument Description: ").append(document.getDescription());
                        }
                    }
                }
                context = fallbackBuilder.toString();
                log.info("Using document metadata fallback context for documents: {}", request.getDocumentIds());
            } else if (request.getProjectId() != null) {
                Project project = projectRepository.findById(request.getProjectId()).orElse(null);
                if (project != null) {
                    context = "Project Name: " + project.getName();
                    if (project.getDescription() != null && !project.getDescription().trim().isEmpty()) {
                        context += "\nProject Description: " + project.getDescription();
                    }
                    log.info("Using project metadata fallback context for project: {}", request.getProjectId());
                }
            }
        }

        // If the document hasn't been vectorized yet (0 chunks) AND the user didn't type a topic
        if (context.trim().isEmpty() && (request.getTopic() == null || request.getTopic().trim().isEmpty())) {
            // Fall back to using the document's title as the topic so Gemini doesn't crash
            String fallbackTopic = request.getTitle();
            if (fallbackTopic != null && fallbackTopic.startsWith("Quiz: ")) {
                fallbackTopic = fallbackTopic.replace("Quiz: ", "").trim();
            }
            request.setTopic(fallbackTopic);
            log.warn("Document chunks were empty. Falling back to topic: {}", fallbackTopic);
        }
        // ------------------------

        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(
                context,
                request.getTopic(),
                request.getQuestionCount(),
                request.getDifficulty()
        );

        String aiResponse = groqService.generateContent(systemPrompt, userPrompt, 0.3);
        aiUsageService.recordUsage(userEmail, AiUsageFeature.QUIZ_GENERATION);
        log.info("Raw AI response for quiz: {}", aiResponse);


        try {
            String jsonContent = extractJsonArray(aiResponse);
            List<ParsedQuestion> parsedQuestions =
                    objectMapper.readValue(jsonContent, new TypeReference<List<ParsedQuestion>>() {});
            validateQuestions(parsedQuestions, request.getQuestionCount());


            Quiz quiz = new Quiz();
            quiz.setTitle(request.getTitle());
            
            UUID finalDocId = null;
            if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
                finalDocId = request.getDocumentIds().get(0);
            } else {
                finalDocId = request.getDocumentId();
            }
            quiz.setDocumentId(finalDocId);
            quiz.setProjectId(request.getProjectId());
            quiz.setOwner(user);

            List<Question> questions = parsedQuestions.stream().map(pq -> {
                Question q = new Question();
                q.setQuiz(quiz);
                q.setContent(pq.getContent());
                q.setOptions(pq.getOptions());
                q.setCorrectAnswer(pq.getCorrectAnswer());
                q.setExplanation(pq.getExplanation());
                return q;
            }).collect(Collectors.toList());

            quiz.setQuestions(questions);

            Quiz savedQuiz = quizRepository.save(quiz);
            return mapToResponse(savedQuiz);

        } catch (Exception e) {
            log.error("Failed to parse AI generated quiz. AI Response: {}", aiResponse, e);
            throw new RuntimeException("AI failed to generate a valid quiz structure. Please try again.");
        }
    }

    private String extractJsonArray(String response) {
        if (response == null || response.isBlank()) {
            throw new RuntimeException("AI returned an empty response.");
        }

        int start = response.indexOf('[');
        int end = response.lastIndexOf(']');

        if (start == -1 || end == -1 || start >= end) {
            throw new RuntimeException("AI did not return a valid JSON array. Raw response: " + response);
        }

        return response.substring(start, end + 1);
    }

    private String fetchContext(QuizRequest request) {
        List<DocumentChunk> chunks = new java.util.ArrayList<>();
        
        String query = request.getTopic() != null && !request.getTopic().trim().isEmpty() 
            ? request.getTopic() 
            : request.getTitle();
            
        float[] queryEmbedding = null;
        boolean embeddingFailed = false;
        try {
            queryEmbedding = embeddingService.embed(query);
        } catch (Exception e) {
            log.warn("Jina embedding failed in QuizGenerator, falling back to sequential chunks. Error: {}", e.getMessage());
            embeddingFailed = true;
        }

        List<UUID> docIds = new ArrayList<>();
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            project.getDocuments().forEach(d -> {
                documentParserService.ensureChunksExist(d.getId());
            });
            Project updatedProject = projectRepository.findById(request.getProjectId()).orElse(project);
            updatedProject.getDocuments().forEach(this::ensureReadyForAi);
            docIds = updatedProject.getDocuments().stream()
                    .filter(d -> d.getAiParseStatus() == AiParseStatus.READY)
                    .map(Document::getId)
                    .collect(Collectors.toList());
        } else {
            if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
                docIds.addAll(request.getDocumentIds());
            } else if (request.getDocumentId() != null) {
                docIds.add(request.getDocumentId());
            }
            
            for (UUID docId : docIds) {
                documentParserService.ensureChunksExist(docId);
                Document document = documentRepository.findById(docId)
                        .orElseThrow(() -> new RuntimeException("Document not found: " + docId));
                ensureReadyForAi(document);
            }
        }

        if (docIds.isEmpty()) return "";

        int chunksPerDoc = Math.max(1, 8 / docIds.size());

        StringBuilder contextBuilder = new StringBuilder();
        for (UUID docId : docIds) {
            Document document = documentRepository.findById(docId).orElse(null);
            String docTitle = document != null ? document.getTitle() : "Document";

            List<DocumentChunk> docChunks;
            if (embeddingFailed) {
                List<DocumentChunk> seqChunks = documentChunkRepository.findByDocumentId(docId);
                docChunks = seqChunks.size() > chunksPerDoc ? seqChunks.subList(0, chunksPerDoc) : seqChunks;
            } else {
                docChunks = documentChunkRepository.findSimilarChunksByDocumentIdWithThreshold(
                        docId,
                        java.util.Arrays.toString(queryEmbedding),
                        chunksPerDoc,
                        SIMILARITY_THRESHOLD
                );
                if (docChunks.isEmpty()) {
                    List<DocumentChunk> seqChunks = documentChunkRepository.findByDocumentId(docId);
                    docChunks = seqChunks.size() > chunksPerDoc ? seqChunks.subList(0, chunksPerDoc) : seqChunks;
                    log.info("Quiz context search missed threshold, falling back to sequential chunks for document: {}", docId);
                }
            }

            if (!docChunks.isEmpty()) {
                if (contextBuilder.length() > 0) {
                    contextBuilder.append("\n\n");
                }
                contextBuilder.append("=== FILE: ").append(docTitle).append(" ===\n");
                for (DocumentChunk chunk : docChunks) {
                    contextBuilder.append(chunk.getContent()).append("\n");
                }
            }
        }

        String combined = contextBuilder.toString();

        // Limit to 10,000 characters
        return combined.length() > 10000 ? combined.substring(0, 10000) : combined;
    }

    private void ensureReadyForAi(Document document) {
        AiParseStatus status = document.getAiParseStatus();
        if (status == AiParseStatus.PENDING) {
            throw new RuntimeException("Document is still being processed for AI. Please try again shortly.");
        }
        if (status == AiParseStatus.FAILED || status == AiParseStatus.UNSUPPORTED) {
            throw new RuntimeException("This document cannot be used because it failed to parse or is unsupported for AI operations.");
        }
    }

    private void validateQuestions(List<ParsedQuestion> questions, Integer requestedCount) {
        if (questions == null || questions.isEmpty()) {
            throw new RuntimeException("AI returned no questions.");
        }

        int expectedCount = requestedCount != null ? requestedCount : 5;
        if (questions.size() != expectedCount) {
            log.warn("AI returned {} questions while {} were requested.", questions.size(), expectedCount);
        }

        for (ParsedQuestion question : questions) {
            if (question.getContent() == null || question.getContent().isBlank()) {
                throw new RuntimeException("AI returned a question without content.");
            }
            if (question.getOptions() == null || question.getOptions().size() != 4) {
                throw new RuntimeException("AI returned a question without exactly 4 options.");
            }
            if (question.getCorrectAnswer() == null || !question.getOptions().contains(question.getCorrectAnswer())) {
                throw new RuntimeException("AI returned a correctAnswer that does not match any option.");
            }
        }
    }

    private String buildSystemPrompt() {
        return """
            You are an expert educator.
            Your task is to create high-quality multiple-choice questions in valid JSON format.
            
            IMPORTANT RULES:
            - Return ONLY valid JSON.
            - Do NOT use markdown.
            - Do NOT include ```json
            - Do NOT include explanations outside the JSON array.
            - Each question must have exactly 4 options.
            - correctAnswer must exactly match one of the options.
            
            Output this exact JSON format:
            [
              {
                "content": "Question text here",
                "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
                "correctAnswer": "Choice A",
                "explanation": "Brief explanation"
              }
            ]
            """;
    }

    private String buildUserPrompt(String context, String topic, Integer count, String difficulty) {
        int targetCount = count != null ? count : 5;
        String targetDifficulty = difficulty != null ? difficulty : "Medium";
        String targetTopic = topic != null && !topic.trim().isEmpty() ? topic : "the provided document context";

        return """
            Create exactly %1$d multiple-choice questions at "%2$s" difficulty about %3$s.
            %4$s
            
            - You MUST generate exactly %1$d questions.
            - The provided DOCUMENT CONTEXT contains information from different files/documents (marked by "=== FILE: <name> ===" headers). You MUST distribute the generated questions evenly across all the files provided in the DOCUMENT CONTEXT so that all files are represented.
            - If the provided DOCUMENT CONTEXT does not contain enough information to generate %1$d unique questions, you MUST create the remaining questions yourself. These extra questions MUST be directly based on, inferred from, or closely related to the concepts in the provided DOCUMENT CONTEXT to ensure they remain relevant to the files' subject matter. Under no circumstances should you generate fewer than %1$d questions.
            - The generated questions, options, and explanations MUST be in the same language as the provided DOCUMENT CONTEXT or topic (e.g., if the document is in Vietnamese, generate questions in Vietnamese).
            """.formatted(
                    targetCount,
                    targetDifficulty,
                    targetTopic,
                    context.isEmpty() ? "" : "\nDOCUMENT CONTEXT:\n" + context
        );
    }

    @Override
    @Transactional
    public QuizResponse generateQuizFromFile(MultipartFile file, String text, String title, Integer questionCount, String difficulty, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Enforce tier-based question count limit
        int maxQuestions = getMaxQuizQuestions(user);
        boolean isAdmin = user.getRole() != null && "ADMIN".equals(user.getRole().getName());
        if (!isAdmin && questionCount != null && questionCount > maxQuestions) {
            questionCount = maxQuestions;
            log.info("Clamped quiz question count to {} for tier {}", maxQuestions, user.getSubscriptionTier());
        }

        String context = "";
        if (file != null && !file.isEmpty()) {
            context = documentParserService.parseTextOnly(file);
        } else if (text != null && !text.trim().isEmpty()) {
            context = text;
        }

        if (context.length() > 10000) {
            context = context.substring(0, 10000);
        }

        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(
                context,
                null,
                questionCount,
                difficulty
        );

        aiUsageService.checkQuota(userEmail);
        String aiResponse = groqService.generateContent(systemPrompt, userPrompt, 0.3);
        aiUsageService.recordUsage(userEmail, AiUsageFeature.QUIZ_GENERATION);
        log.info("Raw AI response for quiz from file: {}", aiResponse);

        try {
            String jsonContent = extractJsonArray(aiResponse);
            List<ParsedQuestion> parsedQuestions =
                    objectMapper.readValue(jsonContent, new TypeReference<List<ParsedQuestion>>() {});
            validateQuestions(parsedQuestions, questionCount);

            Quiz quiz = new Quiz();
            quiz.setTitle(title);
            quiz.setDocumentId(null);
            quiz.setProjectId(null);
            quiz.setOwner(user);

            List<Question> questions = parsedQuestions.stream().map(pq -> {
                Question q = new Question();
                q.setQuiz(quiz);
                q.setContent(pq.getContent());
                q.setOptions(pq.getOptions());
                q.setCorrectAnswer(pq.getCorrectAnswer());
                q.setExplanation(pq.getExplanation());
                return q;
            }).collect(Collectors.toList());

            quiz.setQuestions(questions);

            Quiz savedQuiz = quizRepository.save(quiz);
            return mapToResponse(savedQuiz);

        } catch (Exception e) {
            log.error("Failed to parse AI generated quiz from file. AI Response: {}", aiResponse, e);
            throw new RuntimeException("AI failed to generate a valid quiz structure. Please try again.");
        }
    }

    private QuizResponse mapToResponse(Quiz quiz) {
        List<QuestionDTO> questionDTOs = quiz.getQuestions().stream()
                .map(q -> QuestionDTO.builder()
                        .id(q.getId())
                        .content(q.getContent())
                        .options(q.getOptions())
                        .correctAnswer(q.getCorrectAnswer())
                        .explanation(q.getExplanation())
                        .build())
                .collect(Collectors.toList());

        // Extract source document's course info for smart publish
        UUID documentCourseId = null;
        String documentCourseName = null;
        String documentCourseCode = null;
        if (quiz.getDocumentId() != null) {
            Document doc = documentRepository.findById(quiz.getDocumentId()).orElse(null);
            if (doc != null && doc.getCourse() != null) {
                documentCourseId = doc.getCourse().getId();
                documentCourseName = doc.getCourse().getName();
                documentCourseCode = doc.getCourse().getCode();
            }
        }

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .documentId(quiz.getDocumentId())
                .projectId(quiz.getProjectId())
                .ownerId(quiz.getOwner().getId())
                .courseId(quiz.getCourseId())
                .documentCourseId(documentCourseId)
                .documentCourseName(documentCourseName)
                .documentCourseCode(documentCourseCode)
                .createdAt(quiz.getCreatedAt())
                .questions(questionDTOs)
                .build();
    }

    // Helper static class for JSON parsing
    @lombok.Data
    private static class ParsedQuestion {
        private String content;
        private List<String> options;
        private String correctAnswer;
        private String explanation;
    }
}
