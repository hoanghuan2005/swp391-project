package com.example.keeper.systems.ai_ask.repository;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {
    List<DocumentChunk> findByDocumentId(UUID documentId);

    List<DocumentChunk> findByDocumentIdIn(List<UUID> documentIds);

    void deleteByDocumentId(UUID documentId);

    @Query(value = "SELECT * FROM document_chunks ORDER BY embedding <-> :queryEmbedding LIMIT :limit", nativeQuery = true)
    List<DocumentChunk> findSimilarChunks(@Param("queryEmbedding") float[] queryEmbedding, @Param("limit") int limit);
}
