package com.example.keeper.systems.ai_ask.service.impl;

import com.example.keeper.systems.ai_ask.dto.request.AskAIRequest;
import com.example.keeper.systems.ai_ask.dto.response.AskAIResponse;
import com.example.keeper.systems.ai_ask.entity.AiConversation;
import com.example.keeper.systems.ai_ask.entity.AiMessage;
import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.enums.MessageRole;
import com.example.keeper.systems.ai_ask.repository.AiConversationRepository;
import com.example.keeper.systems.ai_ask.repository.AiMessageRepository;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.ai_ask.service.AiAskService;
import com.example.keeper.systems.ai_ask.service.ConversationService;
import com.example.keeper.systems.ai_ask.service.GroqService;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.AiParseStatus;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.project.entity.Project;
import com.example.keeper.systems.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiAskServiceImpl implements AiAskService {

    private final ConversationService conversationService;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ProjectRepository projectRepository;
    private final DocumentRepository documentRepository;
    private final GroqService groqService;

    @Override
    @Transactional
    public AskAIResponse ask(AskAIRequest request) {
        AiConversation conversation = null;
        List<AiMessage> history = new ArrayList<>();

        if (request.getConversationId() != null) {
            conversation = conversationService.getConversation(request.getConversationId());

            if (request.getDocumentId() != null && conversation.getDocumentId() == null) {
                conversation.setDocumentId(request.getDocumentId());
                conversationRepository.save(conversation);
            }

            history = messageRepository.findTop20ByConversationIdOrderByCreatedAtAsc(conversation.getId());

            AiMessage userMessage = AiMessage.builder()
                    .conversation(conversation)
                    .role(MessageRole.USER)
                    .content(request.getMessage())
                    .build();
            messageRepository.save(userMessage);

            if ("New Chat".equals(conversation.getTitle())) {
                String firstMsg = request.getMessage();
                if (firstMsg != null && !firstMsg.isBlank()) {
                    String newTitle = firstMsg.length() > 30 ? firstMsg.substring(0, 27) + "..." : firstMsg;
                    conversation.setTitle(newTitle);
                    conversationRepository.save(conversation);
                }
            }
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are StudyMate AI, a helpful study assistant.\n");

        boolean isProjectRequest = (request.getShareToken() != null && !request.getShareToken().isBlank())
                || request.getProjectId() != null;

        if (isProjectRequest) {
            appendProjectContext(prompt, request);
        } else {
            appendDocumentContext(prompt, request, conversation);
        }

        if (!history.isEmpty()) {
            prompt.append("Here is the chat conversation history:\n");
            for (AiMessage message : history) {
                prompt.append(message.getRole()).append(": ").append(message.getContent()).append("\n");
            }
        }

        String userQuery = request.getMessage() != null
                ? request.getMessage()
                : "Please introduce yourself and summarize these files.";
        prompt.append("USER: ").append(userQuery).append("\n");
        prompt.append("ASSISTANT: ");

        String aiAnswer = groqService.generateContent(prompt.toString());

        if (conversation != null) {
            AiMessage assistantMessage = AiMessage.builder()
                    .conversation(conversation)
                    .role(MessageRole.ASSISTANT)
                    .content(aiAnswer)
                    .build();
            messageRepository.save(assistantMessage);

            return AskAIResponse.builder()
                    .conversationId(conversation.getId())
                    .assistantMessageId(assistantMessage.getId())
                    .answer(aiAnswer)
                    .build();
        }

        return AskAIResponse.builder()
                .conversationId(null)
                .assistantMessageId(null)
                .answer(aiAnswer)
                .build();
    }

    private void appendProjectContext(StringBuilder prompt, AskAIRequest request) {
        Project project = resolveProject(request);

        prompt.append("You are operating inside the Project Workspace: ").append(project.getName()).append("\n");

        boolean hasTargetedSelection = request.getDocumentIds() != null && !request.getDocumentIds().isEmpty();
        if (hasTargetedSelection) {
            prompt.append("Use only the following SELECTED sources chosen by the user to answer questions:\n");
        } else {
            prompt.append("Use the following compiled project documentation context to answer questions:\n");
        }

        prompt.append("--- BEGIN PROJECT DOCS CONTEXT ---\n");

        if (project.getDocuments() == null || project.getDocuments().isEmpty()) {
            prompt.append("(No documents attached to this workspace yet.)\n");
        } else {
            for (Document doc : project.getDocuments()) {
                if (hasTargetedSelection && !request.getDocumentIds().contains(doc.getId())) {
                    continue;
                }

                ensureReadyForAi(doc);
                List<DocumentChunk> chunks = selectRelevantChunks(
                        request.getMessage(),
                        documentChunkRepository.findByDocumentId(doc.getId()),
                        30000
                );

                if (!chunks.isEmpty()) {
                    prompt.append("\n[Source Document: ").append(doc.getTitle()).append("]\n");
                    for (DocumentChunk chunk : chunks) {
                        prompt.append(chunk.getContent()).append("\n");
                    }
                }
            }
        }

        prompt.append("--- END PROJECT DOCS CONTEXT ---\n\n");
    }

    private void appendDocumentContext(StringBuilder prompt, AskAIRequest request, AiConversation conversation) {
        UUID docId = request.getDocumentId() != null
                ? request.getDocumentId()
                : (conversation != null ? conversation.getDocumentId() : null);

        if (docId == null) {
            return;
        }

        Document document = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        ensureReadyForAi(document);

        List<DocumentChunk> chunks = selectRelevantChunks(
                request.getMessage(),
                documentChunkRepository.findByDocumentId(docId),
                30000
        );

        if (chunks.isEmpty()) {
            return;
        }

        prompt.append("Use the following document context to answer the user's questions. ")
                .append("Prioritize document content:\n");
        prompt.append("--- BEGIN DOCUMENT CONTEXT ---\n");
        for (DocumentChunk chunk : chunks) {
            prompt.append(chunk.getContent()).append("\n");
        }
        prompt.append("--- END DOCUMENT CONTEXT ---\n\n");
    }

    private Project resolveProject(AskAIRequest request) {
        if (request.getShareToken() != null && !request.getShareToken().isBlank()) {
            return projectRepository.findByShareToken(request.getShareToken())
                    .orElseThrow(() -> new RuntimeException("Project not found or invalid shared link"));
        }

        return projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    private void ensureReadyForAi(Document document) {
        AiParseStatus status = document.getAiParseStatus();
        if (status == AiParseStatus.PENDING) {
            throw new RuntimeException("Document is still being processed for AI. Please try again shortly.");
        }
        if (status == AiParseStatus.FAILED || status == AiParseStatus.UNSUPPORTED) {
            throw new RuntimeException("Document is not available for AI context.");
        }
    }

    private List<DocumentChunk> selectRelevantChunks(String message, List<DocumentChunk> chunks, int maxCharacters) {
        if (chunks == null || chunks.isEmpty()) {
            return List.of();
        }

        List<String> keywords = extractKeywords(message);
        List<DocumentChunk> ordered = new ArrayList<>(chunks);

        if (!keywords.isEmpty()) {
            ordered.sort(Comparator
                    .comparingInt((DocumentChunk chunk) -> scoreChunk(chunk.getContent(), keywords))
                    .reversed()
                    .thenComparing(DocumentChunk::getChunkIndex));
        } else {
            ordered.sort(Comparator.comparing(DocumentChunk::getChunkIndex));
        }

        List<DocumentChunk> selected = new ArrayList<>();
        int totalLength = 0;
        for (DocumentChunk chunk : ordered) {
            String content = chunk.getContent();
            if (content == null || content.isBlank()) {
                continue;
            }
            if (!keywords.isEmpty() && scoreChunk(content, keywords) == 0 && !selected.isEmpty()) {
                continue;
            }
            if (totalLength + content.length() > maxCharacters && !selected.isEmpty()) {
                break;
            }
            selected.add(chunk);
            totalLength += content.length();
        }

        selected.sort(Comparator.comparing(DocumentChunk::getChunkIndex));
        return selected;
    }

    private List<String> extractKeywords(String message) {
        if (message == null || message.isBlank()) {
            return List.of();
        }

        String[] words = message.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+");
        List<String> keywords = new ArrayList<>();
        for (String word : words) {
            if (word.length() >= 4 && keywords.stream().noneMatch(word::equals)) {
                keywords.add(word);
            }
            if (keywords.size() >= 12) {
                break;
            }
        }
        return keywords;
    }

    private int scoreChunk(String content, List<String> keywords) {
        if (content == null || content.isBlank()) {
            return 0;
        }

        String lower = content.toLowerCase(Locale.ROOT);
        int score = 0;
        for (String keyword : keywords) {
            if (lower.contains(keyword)) {
                score++;
            }
        }
        return score;
    }
}
