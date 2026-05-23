package com.example.keeper.systems.ai_ask.service.impl;

import com.example.keeper.systems.ai_ask.dto.request.AskRequest;
import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.ai_ask.service.AiAskService;
import com.example.keeper.systems.ai_ask.service.GeminiService;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.project.entity.Project;
import com.example.keeper.systems.project.repository.ProjectRepository;
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
    private final ProjectRepository projectRepository;
    private final GeminiService geminiService;

    @Override
    public String ask(UUID userId, AskRequest request) {

        String documentContent;

        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            
            List<UUID> documentIds = project.getDocuments().stream()
                    .map(Document::getId)
                    .collect(Collectors.toList());
                    
            List<DocumentChunk> chunks = documentChunkRepository.findByDocumentIdIn(documentIds);
            
            documentContent = chunks.stream()
                .map(DocumentChunk::getContent)
                .collect(Collectors.joining("\n\n"));
                
        } else if (request.getDocumentId() != null) {
            Document document = documentRepository.findById(request.getDocumentId())
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(request.getDocumentId());
            
            if (chunks.isEmpty()) {
                documentContent = document.getDescription() != null ? document.getDescription() : document.getTitle();
            } else {
                documentContent = chunks.stream()
                    .map(DocumentChunk::getContent)
                    .collect(Collectors.joining("\n\n"));
            }
        } else {
            throw new IllegalArgumentException("Either projectId or documentId must be provided");
        }

        // CRITICAL TOKEN LIMIT HANDLING
        if (documentContent.length() > 25000) {
            documentContent = documentContent.substring(0, 25000);
        }

        String prompt = buildPrompt(documentContent, request.getQuestion());

        return geminiService.ask(prompt);
    }

    private String buildPrompt(String content, String question) {

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
