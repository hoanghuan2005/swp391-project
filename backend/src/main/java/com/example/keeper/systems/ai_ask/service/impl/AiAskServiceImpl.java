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
import com.example.keeper.systems.ai_ask.service.GrokService; // <-- Kept Grok Service
import com.example.keeper.systems.project.entity.Project; // <-- Kept Project Entity
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.document.entity.Document;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
    private final GrokService grokService; // <-- Updated variable to match Grok

    @Override
    @Transactional
    public AskAIResponse ask(AskAIRequest request) {

        AiConversation conversation = null;
        List<AiMessage> history = new ArrayList<>();

        // 1. Handle Standard Conversation (AskAIPage)
        if (request.getConversationId() != null) {
            conversation = conversationService.getConversation(request.getConversationId());

            // Update documentId if provided
            if (request.getDocumentId() != null && conversation.getDocumentId() == null) {
                conversation.setDocumentId(request.getDocumentId());
                conversationRepository.save(conversation);
            }

            // Save user message
            AiMessage userMessage = AiMessage.builder()
                    .conversation(conversation)
                    .role(MessageRole.USER)
                    .content(request.getMessage())
                    .build();
            messageRepository.save(userMessage);

            // Update title for new chats
            if ("New Chat".equals(conversation.getTitle())) {
                String firstMsg = request.getMessage();
                if (firstMsg != null && !firstMsg.isBlank()) {
                    String newTitle = firstMsg.length() > 30 ? firstMsg.substring(0, 27) + "..." : firstMsg;
                    conversation.setTitle(newTitle);
                    conversationRepository.save(conversation);
                }
            }

            // Load history
            history = messageRepository.findTop20ByConversationIdOrderByCreatedAtAsc(conversation.getId());
        }

        // 2. Build the AI Prompt
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are StudyMate AI, a helpful study assistant.\n");

        // 3. Inject Context (Project Workspace vs Single Document)
        if (request.getProjectId() != null) {
            // Project Workspace Mode: Load all documents tied to this project
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found"));

            prompt.append("You are operating inside the Project Workspace: ").append(project.getName()).append("\n");
            prompt.append("Use the following compiled project documentation context to answer questions:\n");
            prompt.append("--- BEGIN PROJECT DOCS CONTEXT ---\n");

            if (project.getDocuments() != null && !project.getDocuments().isEmpty()) {
                for (Document doc : project.getDocuments()) {
                    List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(doc.getId());
                    if (chunks != null && !chunks.isEmpty()) {
                        prompt.append("\n[Source Document: ").append(doc.getTitle()).append("]\n");
                        for (DocumentChunk chunk : chunks) {
                            prompt.append(chunk.getContent()).append("\n");
                        }
                    }
                }
            } else {
                prompt.append("(No documents attached to this workspace yet.)\n");
            }
            prompt.append("--- END PROJECT DOCS CONTEXT ---\n\n");

        } else {
            // Standard Mode: Load single document if present
            UUID docId = request.getDocumentId() != null ? request.getDocumentId() :
                    (conversation != null ? conversation.getDocumentId() : null);

            if (docId != null) {
                List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(docId);
                if (chunks != null && !chunks.isEmpty()) {
                    prompt.append("Use the following document context to answer the user's questions. ")
                            .append("Prioritize document content:\n");
                    prompt.append("--- BEGIN DOCUMENT CONTEXT ---\n");
                    for (DocumentChunk chunk : chunks) {
                        prompt.append(chunk.getContent()).append("\n");
                    }
                    prompt.append("--- END DOCUMENT CONTEXT ---\n\n");
                }
            }
        }

        // 4. Append History & Current Question
        if (!history.isEmpty()) {
            prompt.append("Here is the chat conversation history:\n");
            for (AiMessage message : history) {
                prompt.append(message.getRole()).append(": ").append(message.getContent()).append("\n");
            }
        } else if (conversation == null) {
            // If operating statelessly in a workspace, just inject the current question
            prompt.append("USER: ").append(request.getMessage()).append("\n");
        }

        prompt.append("ASSISTANT: ");

        // 5. Call AI Engine
        String aiAnswer = grokService.generateContent(prompt.toString()); // <-- Updated to call grokService

        // 6. Save & Return Response
        if (conversation != null) {
            // Stateful Return (AskAIPage)
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

        // Stateless Return (ProjectWorkspacePage)
        return AskAIResponse.builder()
                .conversationId(null)
                .assistantMessageId(null)
                .answer(aiAnswer)
                .build();
    }
}