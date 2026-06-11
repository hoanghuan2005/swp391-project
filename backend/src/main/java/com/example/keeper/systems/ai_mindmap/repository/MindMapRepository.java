package com.example.keeper.systems.ai_mindmap.repository;

import com.example.keeper.systems.ai_mindmap.entity.MindMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MindMapRepository
        extends JpaRepository<MindMap, UUID> {

    Optional<MindMap> findByDocumentId(UUID documentId);

}
