package com.example.keeper.systems.ai_ask.service;

import com.example.keeper.systems.ai_ask.client.JinaEmbeddingClient;
import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class EmbeddingService {

    private final JinaEmbeddingClient client;
    private final DocumentChunkRepository repository;

    public EmbeddingService(
            JinaEmbeddingClient client,
            DocumentChunkRepository repository) {

        this.client = client;
        this.repository = repository;
    }

    public float[] embed(String text) {

        try {
            return client.embed(text);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to generate embedding",
                    e
            );
        }
    }

    public void saveChunk(String content)
            throws IOException {

        float[] embedding =
                client.embed(content);

        DocumentChunk chunk =
                new DocumentChunk();

        chunk.setContent(content);
        chunk.setEmbedding(embedding);

        repository.save(chunk);
    }
}