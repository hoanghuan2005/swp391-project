package com.example.keeper.systems.ai_ask.repository;

import com.example.keeper.systems.ai_ask.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AiConversationRepository
        extends JpaRepository<AiConversation, UUID> {

    List<AiConversation>
    findByUserIdAndProjectIdIsNullOrderByCreatedAtDesc(UUID userId);

    List<AiConversation>
    findByUserIdAndProjectIdOrderByCreatedAtDesc(UUID userId, UUID projectId);
}
