package com.example.keeper.systems.ai_ask.service.impl;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.ai_ask.service.AiAskService;
import com.example.keeper.systems.ai_ask.service.GeminiService;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiAskServiceImpl implements AiAskService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final GeminiService geminiService;

    @Override
    public String ask(UUID userId,
                      UUID documentId,
                      String question) {

        Document document =
                documentRepository.findById(documentId)
                        .orElseThrow(
                                () -> new RuntimeException("Document not found")
                        );

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        
        String documentContent;
        if (chunks.isEmpty()) {
            documentContent = document.getDescription() != null ? document.getDescription() : document.getTitle();
        } else {
            documentContent = chunks.stream()
                .map(DocumentChunk::getContent)
                .collect(Collectors.joining("\n\n"));
        }

        String prompt = buildPrompt(
                documentContent,
                question
        );

        return geminiService.ask(prompt);
    }

    private String buildPrompt(String content,
                               String question) {

        return """
                You are an AI study assistant.

                Answer ONLY based on the document.

                DOCUMENT:
                %s

                QUESTION:
                %s
                """.formatted(content, question);
    }
}
