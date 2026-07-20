package com.example.keeper.systems.document.repository;

import com.example.keeper.systems.document.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {

    List<DocumentVersion> findByDocumentIdOrderByCreatedAtDesc(UUID documentId);

    Optional<DocumentVersion> findFirstByDocumentIdOrderByCreatedAtDesc(UUID documentId);
}
