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

    private static final String PROJECT_ACK_MESSAGE =
            "I'm here. Ask me a question about the documents in this workspace.";
    private static final String PROJECT_ACK_MESSAGE_VI =
            "Mình ở đây. Bạn có thể hỏi mình về các tài liệu trong workspace này.";
    private static final String PROJECT_CAPABILITY_MESSAGE =
            "I can answer questions using the documents in this workspace. If the sources do not support an answer, I will say I cannot answer from the workspace sources.";
    private static final String PROJECT_CAPABILITY_MESSAGE_VI =
            "Mình có thể trả lời câu hỏi dựa trên các tài liệu trong workspace này. Nếu nguồn không hỗ trợ câu trả lời, mình sẽ nói rõ là không thể trả lời từ nguồn workspace.";

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
            String deterministicResponse = getProjectDeterministicResponse(request.getMessage());
            if (deterministicResponse != null) {
                return buildResponse(conversation, deterministicResponse);
            }

            boolean hasRelevantProjectContext = appendProjectContext(prompt, request);
            if (!hasRelevantProjectContext) {
                appendNoRelevantProjectContextInstruction(prompt);
            }
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

        return buildResponse(conversation, aiAnswer);
    }

    private AskAIResponse buildResponse(AiConversation conversation, String answer) {
        if (conversation == null) {
            return AskAIResponse.builder()
                    .conversationId(null)
                    .assistantMessageId(null)
                    .answer(answer)
                    .build();
        }

        AiMessage assistantMessage = AiMessage.builder()
                .conversation(conversation)
                .role(MessageRole.ASSISTANT)
                .content(answer)
                .build();
        messageRepository.save(assistantMessage);

        return AskAIResponse.builder()
                .conversationId(conversation.getId())
                .assistantMessageId(assistantMessage.getId())
                .answer(answer)
                .build();
    }

    private boolean appendProjectContext(StringBuilder prompt, AskAIRequest request) {
        Project project = resolveProject(request);

        prompt.append("You are operating inside the Project Workspace: ").append(project.getName()).append("\n");
        prompt.append("Respond in the same language as the user's latest message.\n");

        boolean hasTargetedSelection = request.getDocumentIds() != null && !request.getDocumentIds().isEmpty();
        if (hasTargetedSelection) {
            prompt.append("Use only the following SELECTED sources chosen by the user to answer questions:\n");
        } else {
            prompt.append("Use the following compiled project documentation context to answer questions:\n");
        }

        prompt.append("--- BEGIN PROJECT DOCS CONTEXT ---\n");

        boolean hasReadyContext = false;
        if (project.getDocuments() == null || project.getDocuments().isEmpty()) {
            prompt.append("(No documents attached to this workspace yet.)\n");
        } else {
            for (Document doc : project.getDocuments()) {
                if (hasTargetedSelection && !request.getDocumentIds().contains(doc.getId())) {
                    continue;
                }

                if (doc.getAiParseStatus() != AiParseStatus.READY) {
                    prompt.append("\n[Skipped Document: ")
                            .append(doc.getTitle())
                            .append(" - aiParseStatus: ")
                            .append(doc.getAiParseStatus())
                            .append("]\n");
                    continue;
                }

                List<DocumentChunk> chunks = selectRelevantChunks(
                        request.getMessage(),
                        documentChunkRepository.findByDocumentId(doc.getId()),
                        30000,
                        true
                );

                if (!chunks.isEmpty()) {
                    prompt.append("\n[Source Document: ").append(doc.getTitle()).append("]\n");
                    for (DocumentChunk chunk : chunks) {
                        prompt.append(chunk.getContent()).append("\n");
                    }
                    hasReadyContext = true;
                }
            }
        }

        prompt.append("--- END PROJECT DOCS CONTEXT ---\n\n");
        if (hasReadyContext) {
            prompt.append("Use the workspace source excerpts as the primary basis for your answer. ")
                    .append("If the sources do not support a factual claim, say so.\n");
        }
        return hasReadyContext;
    }

    private void appendNoRelevantProjectContextInstruction(StringBuilder prompt) {
        prompt.append("No clearly relevant workspace source excerpts were found for this question.\n");
        prompt.append("You are still in Project Workspace mode.\n");
        prompt.append("Respond in the same language as the user's latest message.\n");
        prompt.append("Do not invent factual answers that are not supported by workspace sources.\n");
        prompt.append("If the user asks about document/workspace content and the sources are insufficient, ")
                .append("say that the workspace sources do not contain enough information.\n");
        prompt.append("If the user is asking a conversational, clarification, or capability question, ")
                .append("answer naturally and briefly.\n");
    }

    private String getProjectDeterministicResponse(String message) {
        if (message == null || message.isBlank()) {
            return null;
        }

        String normalized = normalizeMessage(message);
        if (isGreetingAcknowledgementOrThanks(normalized)) {
            return projectMessage(message, PROJECT_ACK_MESSAGE, PROJECT_ACK_MESSAGE_VI);
        }

        if (isWorkspaceCapabilityQuestion(normalized)) {
            return projectMessage(message, PROJECT_CAPABILITY_MESSAGE, PROJECT_CAPABILITY_MESSAGE_VI);
        }

        return null;
    }

    private String projectMessage(String userMessage, String english, String vietnamese) {
        return isClearlyVietnamese(userMessage) ? vietnamese : english;
    }

    private boolean isGreetingAcknowledgementOrThanks(String normalized) {
        return normalized.equals("hi")
                || normalized.equals("hello")
                || normalized.equals("hey")
                || normalized.equals("good")
                || normalized.equals("ok")
                || normalized.equals("okay")
                || normalized.equals("thanks")
                || normalized.equals("thank you")
                || normalized.equals("got it")
                || normalized.equals("understood")
                || normalized.equals("sounds good")
                || normalized.equals("chao")
                || normalized.equals("xin chao")
                || normalized.equals("cam on")
                || normalized.equals("xin cam on")
                || normalized.equals("ổn")
                || normalized.equals("được")
                || normalized.equals("cảm ơn")
                || normalized.equals("xin cảm ơn")
                || normalized.equals("chào")
                || normalized.equals("xin chào");
    }

    private boolean isWorkspaceCapabilityQuestion(String normalized) {
        return normalized.equals("what can you do")
                || normalized.equals("what can you do here")
                || normalized.equals("what can i ask")
                || normalized.equals("what can i ask you")
                || normalized.equals("what can you answer")
                || normalized.equals("what questions can you answer")
                || normalized.equals("how can you help")
                || normalized.equals("how can you help me")
                || normalized.equals("ban tra loi duoc gi")
                || normalized.equals("ban co the tra loi gi")
                || normalized.equals("ban co the lam gi")
                || normalized.equals("minh hoi duoc gi")
                || normalized.equals("mình hỏi được gì")
                || normalized.equals("bạn trả lời được gì")
                || normalized.equals("vậy bạn trả lời được gì")
                || normalized.equals("bạn có thể trả lời gì")
                || normalized.equals("bạn có thể làm gì");
    }

    private String normalizeMessage(String message) {
        return message.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private boolean isClearlyVietnamese(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }

        String lower = message.toLowerCase(Locale.ROOT);
        if (lower.matches(".*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ].*")) {
            return true;
        }

        String normalized = normalizeMessage(message);
        return normalized.contains("xin chao")
                || normalized.contains("cam on")
                || normalized.contains("tai lieu")
                || normalized.contains("workspace nay")
                || normalized.contains("duoc gi")
                || normalized.contains("tra loi");
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
        return selectRelevantChunks(message, chunks, maxCharacters, false);
    }

    private List<DocumentChunk> selectRelevantChunks(
            String message,
            List<DocumentChunk> chunks,
            int maxCharacters,
            boolean requireKeywordMatch
    ) {
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

            int score = scoreChunk(content, keywords);
            if (!keywords.isEmpty() && requireKeywordMatch && score == 0) {
                continue;
            }
            if (!keywords.isEmpty() && !requireKeywordMatch && score == 0 && !selected.isEmpty()) {
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
