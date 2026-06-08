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

    @Query(value = "SELECT * FROM document_chunks ORDER BY embedding <-> cast(:queryEmbedding as vector) LIMIT :limit", nativeQuery = true)
    List<DocumentChunk> findSimilarChunks(@Param("queryEmbedding") String queryEmbedding, @Param("limit") int limit);

    @Query(value = "SELECT * FROM document_chunks WHERE document_id = :documentId ORDER BY embedding <-> cast(:queryEmbedding as vector) LIMIT :limit", nativeQuery = true)
    List<DocumentChunk> findSimilarChunksByDocumentId(@Param("documentId") UUID documentId, @Param("queryEmbedding") String queryEmbedding, @Param("limit") int limit);

    @Query(value = "SELECT * FROM document_chunks WHERE document_id IN :documentIds ORDER BY embedding <-> cast(:queryEmbedding as vector) LIMIT :limit", nativeQuery = true)
    List<DocumentChunk> findSimilarChunksByDocumentIds(@Param("documentIds") List<UUID> documentIds, @Param("queryEmbedding") String queryEmbedding, @Param("limit") int limit);
}
