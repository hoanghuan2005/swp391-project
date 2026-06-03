package com.example.keeper.systems.ai_ask.service;

import com.example.keeper.systems.ai_ask.entity.AiConversation;
import com.example.keeper.systems.ai_ask.entity.AiMessage;

import java.util.List;
import java.util.UUID;

public interface ConversationService {

    AiConversation createConversation(UUID userId, String title, UUID documentId, UUID projectId);

    List<AiConversation> getUserConversations(UUID userId);

    List<AiConversation> getUserConversations(UUID userId, UUID projectId);

    AiConversation getConversation(UUID id);

    void deleteConversation(UUID id);

    List<AiMessage> getConversationMessages(UUID conversationId);
}
