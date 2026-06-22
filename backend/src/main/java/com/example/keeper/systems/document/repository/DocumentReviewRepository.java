package com.example.keeper.systems.document.repository;

import com.example.keeper.systems.document.entity.DocumentReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentReviewRepository extends JpaRepository<DocumentReview, UUID> {
    List<DocumentReview> findByDocumentIdOrderByCreatedAtDesc(UUID documentId);
    Optional<DocumentReview> findByDocumentIdAndUserId(UUID documentId, UUID userId);
}
