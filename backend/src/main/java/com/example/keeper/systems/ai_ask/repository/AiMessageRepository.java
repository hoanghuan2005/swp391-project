package com.example.keeper.systems.ai_ask.repository;

import com.example.keeper.systems.ai_ask.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AiMessageRepository
        extends JpaRepository<AiMessage, UUID> {

    List<AiMessage>
    findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    List<AiMessage>
    findTop20ByConversationIdOrderByCreatedAtAsc(UUID conversationId);
}