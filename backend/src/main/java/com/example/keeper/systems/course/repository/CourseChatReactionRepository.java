package com.example.keeper.systems.course.repository;

import com.example.keeper.systems.course.entity.CourseChatReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseChatReactionRepository extends JpaRepository<CourseChatReaction, UUID> {
    Optional<CourseChatReaction> findByMessageIdAndUserId(UUID messageId, UUID userId);
}
