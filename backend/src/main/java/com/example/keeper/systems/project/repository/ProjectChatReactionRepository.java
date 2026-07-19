package com.example.keeper.systems.project.repository;

import com.example.keeper.systems.project.entity.ProjectChatReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ProjectChatReactionRepository extends JpaRepository<ProjectChatReaction, UUID> {
    Optional<ProjectChatReaction> findByMessageIdAndUserId(UUID messageId, UUID userId);
}
