package com.example.keeper.systems.ai_flashcard.repository;

import com.example.keeper.systems.ai_flashcard.entity.FlashcardSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FlashcardSetRepository extends JpaRepository<FlashcardSet, UUID> {

    List<FlashcardSet> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<FlashcardSet> findByCourseIdAndStatus(UUID courseId, String status);
}