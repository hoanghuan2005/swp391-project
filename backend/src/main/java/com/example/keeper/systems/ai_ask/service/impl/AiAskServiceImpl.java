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
import com.example.keeper.systems.ai_ask.service.GeminiService;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.project.entity.Project;
import com.example.keeper.systems.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiAskServiceImpl implements AiAskService {

    private final ConversationService conversationService;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ProjectRepository projectRepository;
    private final GeminiService geminiService;

    @Override
    public AskAIResponse ask(AskAIRequest request) {

        AiConversation conversation =
                conversationService.getConversation(
                        request.getConversationId()
                );

        // Update conversation's documentId if provided and not already set
        if (request.getDocumentId() != null && conversation.getDocumentId() == null) {
            conversation.setDocumentId(request.getDocumentId());
            conversationRepository.save(conversation);
        }

        // SAVE USER MESSAGE
        AiMessage userMessage =
                AiMessage.builder()
                        .conversation(conversation)
                        .role(MessageRole.USER)
                        .content(request.getMessage())
                        .build();

        messageRepository.save(userMessage);

        // Update chat title if it is currently default and this is the first user message
        List<AiMessage> allMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        if ("New Chat".equals(conversation.getTitle())) {
            String firstMsg = request.getMessage();
            if (firstMsg != null && !firstMsg.isBlank()) {
                String newTitle = firstMsg.length() > 30 ? firstMsg.substring(0, 27) + "..." : firstMsg;
                conversation.setTitle(newTitle);
                conversationRepository.save(conversation);
            }
        }

        // LOAD HISTORY (Limit to top 20 for prompt context window size)
        List<AiMessage> history =
                messageRepository
                        .findTop20ByConversationIdOrderByCreatedAtAsc(
                                conversation.getId()
                        );

        // BUILD PROMPT WITH DOCUMENT CONTEXT
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are StudyMate AI, a helpful study assistant.\n");

        UUID docId = request.getDocumentId() != null ? request.getDocumentId() : conversation.getDocumentId();
        if (docId != null) {
            List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(docId);
            if (chunks != null && !chunks.isEmpty()) {
                prompt.append("Use the following document context to answer the user's questions. ")
                        .append("Only answer questions based on the document if they are related to it. ")
                        .append("If the answer cannot be found in the document, you can use your general knowledge, ")
                        .append("but prioritize document content:\n");
                prompt.append("--- BEGIN DOCUMENT CONTEXT ---\n");
                for (DocumentChunk chunk : chunks) {
                    prompt.append(chunk.getContent()).append("\n");
                }
                prompt.append("--- END DOCUMENT CONTEXT ---\n\n");
            }
        }

        prompt.append("Here is the chat conversation history:\n");
        for (AiMessage message : history) {
            prompt.append(message.getRole())
                    .append(": ")
                    .append(message.getContent())
                    .append("\n");
        }
        
        prompt.append("ASSISTANT: ");

        // GEMINI API CALL
        String aiAnswer =
                geminiService.generateContent(
                        prompt.toString()
                );

        // SAVE ASSISTANT MESSAGE
        AiMessage assistantMessage =
                AiMessage.builder()
                        .conversation(conversation)
                        .role(MessageRole.ASSISTANT)
                        .content(aiAnswer)
                        .build();

        messageRepository.save(assistantMessage);

        // RESPONSE
        return AskAIResponse.builder()
                .conversationId(conversation.getId())
                .assistantMessageId(
                        assistantMessage.getId()
                )
                .answer(aiAnswer)
                .build();
    }
}