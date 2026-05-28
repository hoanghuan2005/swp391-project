package com.example.keeper.systems.ai_flashcard.repository;

import com.example.keeper.systems.ai_flashcard.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {

    List<Flashcard> findByFlashcardSetId(UUID setId);
}