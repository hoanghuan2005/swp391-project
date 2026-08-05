package com.example.keeper.systems.ai_ask.service.impl;

import com.example.keeper.systems.ai_ask.entity.AiConversation;
import com.example.keeper.systems.ai_ask.entity.AiMessage;
import com.example.keeper.systems.ai_ask.repository.AiConversationRepository;
import com.example.keeper.systems.ai_ask.repository.AiMessageRepository;
import com.example.keeper.systems.ai_ask.service.ConversationService;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationServiceImpl
        implements ConversationService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final UserRepository userRepository;

    @Value("${groq.model}")
    private String model;

    private User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found"));
    }

    private void validateOwnership(AiConversation conversation) {
        User currentUser = getCurrentAuthenticatedUser();
        if (conversation.getUserId() != null && !conversation.getUserId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access denied: You do not own this conversation.");
        }
    }

    @Override
    public AiConversation createConversation(UUID userId, String title, UUID documentId, UUID projectId) {

        String sanitizedTitle = title != null
                ? title.replaceAll("\\\\n|\\\\r|[\r\n]", " ").replaceAll("\\s+", " ").trim()
                : "New Chat";
        if (sanitizedTitle.isBlank()) {
            sanitizedTitle = "New Chat";
        }

        AiConversation conversation =
                AiConversation.builder()
                        .userId(userId)
                        .title(sanitizedTitle)
                        .documentId(documentId)
                        .projectId(projectId)
                        .modelName("groq:" + model)
                        .build();

        return conversationRepository.save(conversation);
    }

    @Override
    public List<AiConversation> getUserConversations(
            UUID userId
    ) {

        return conversationRepository
                .findByUserIdAndProjectIdIsNullOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<AiConversation> getUserConversations(UUID userId, UUID projectId) {
        if (projectId == null) {
            return getUserConversations(userId);
        }

        return conversationRepository
                .findByUserIdAndProjectIdOrderByCreatedAtDesc(userId, projectId);
    }

    @Override
    public AiConversation getConversation(UUID id) {

        AiConversation conversation = conversationRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Conversation not found"
                        ));
        validateOwnership(conversation);
        return conversation;
    }

    @Override
    public void deleteConversation(UUID id) {
        AiConversation conversation = conversationRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Conversation not found"
                        ));
        validateOwnership(conversation);
        conversationRepository.delete(conversation);
    }

    @Override
    public List<AiMessage> getConversationMessages(UUID conversationId) {
        AiConversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Conversation not found"
                        ));
        validateOwnership(conversation);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }
}

