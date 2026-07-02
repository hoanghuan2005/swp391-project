package com.example.keeper.systems.ai_mindmap.repository;

import com.example.keeper.systems.ai_mindmap.entity.MindMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MindMapRepository
        extends JpaRepository<MindMap, UUID> {

    Optional<MindMap> findByDocumentId(UUID documentId);

    @Query("SELECT m FROM MindMap m WHERE m.user.email = :email OR (m.user IS NULL AND m.documentId IN (SELECT d.id FROM Document d WHERE d.uploadedBy.email = :email)) ORDER BY m.createdAt DESC")
    List<MindMap> findAllByUserEmailOrderByCreatedAtDesc(@Param("email") String email);

    @Query("SELECT COUNT(m) FROM MindMap m WHERE m.documentId IN (SELECT d.id FROM Document d WHERE d.uploadedBy.id = :userId)")
    long countByDocumentOwnerId(@Param("userId") UUID userId);

}
