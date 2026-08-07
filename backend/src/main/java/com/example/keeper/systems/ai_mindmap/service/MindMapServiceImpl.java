package com.example.keeper.systems.ai_mindmap.service;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.ai_ask.service.DocumentParserService;
import com.example.keeper.systems.ai_ask.service.GroqService;
import com.example.keeper.systems.ai_usage.enums.AiUsageFeature;
import com.example.keeper.systems.ai_usage.service.AiUsageService;
import com.example.keeper.systems.ai_mindmap.dto.response.MindMapResponse;
import com.example.keeper.systems.ai_mindmap.entity.MindMap;
import com.example.keeper.systems.ai_mindmap.enums.MindMapStatus;
import com.example.keeper.systems.ai_mindmap.repository.MindMapRepository;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;
import com.example.keeper.systems.project.repository.ProjectRepository;

@Service
@RequiredArgsConstructor
public class MindMapServiceImpl implements MindMapService {

    private final MindMapRepository mindMapRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final GroqService groqService;
    private final ObjectMapper objectMapper;
    private final AiUsageService aiUsageService;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DocumentParserService documentParserService;
    private final ProjectRepository projectRepository;

    @Override
    public MindMapResponse generate(UUID documentId, List<UUID> documentIds) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        aiUsageService.checkQuota(email);

        User user = userRepository.findByEmail(email).orElse(null);

        List<UUID> targetDocIds = new java.util.ArrayList<>();
        if (documentIds != null && !documentIds.isEmpty()) {
            targetDocIds.addAll(documentIds);
        } else if (documentId != null) {
            targetDocIds.add(documentId);
        }

        if (targetDocIds.isEmpty()) {
            throw new RuntimeException("No documents selected");
        }

        // Limit check based on user subscription tier
        aiUsageService.checkDocumentSelectionLimit(email, targetDocIds.size());

        // Validate access to all selected documents
        for (UUID docId : targetDocIds) {
            Document document = documentRepository.findById(docId)
                    .orElseThrow(() -> new RuntimeException("Document not found: " + docId));

            if (user != null) {
                boolean isOwner = document.getUploadedBy() != null && document.getUploadedBy().getId().equals(user.getId());
                boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
                boolean isPublic = document.getVisibility() == com.example.keeper.systems.document.enums.Visibility.PUBLIC;

                if (!isOwner && !isAdmin && !isPublic) {
                    boolean hasProjectAccess = projectRepository.hasUserAccessToDocumentThroughProjects(document.getId(), user.getId());
                    if (!hasProjectAccess) {
                        throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access document: " + docId);
                    }
                }
            }
        }

        // Gather chunks from each document
        int chunksPerDoc = Math.max(1, 8 / targetDocIds.size());
        StringBuilder contentBuilder = new StringBuilder();

        for (UUID docId : targetDocIds) {
            Document document = documentRepository.findById(docId).orElse(null);
            String docTitle = document != null ? document.getTitle() : "Document";

            List<DocumentChunk> docChunks = documentChunkRepository.findByDocumentId(docId);
            if (docChunks.size() > chunksPerDoc) {
                docChunks = docChunks.subList(0, chunksPerDoc);
            }

            if (!docChunks.isEmpty()) {
                StringBuilder docContentBuilder = new StringBuilder();
                docContentBuilder.append("=== FILE: ").append(docTitle).append(" ===\n");
                for (DocumentChunk chunk : docChunks) {
                    docContentBuilder.append(chunk.getContent()).append("\n");
                }

                String docContent = docContentBuilder.toString();
                int maxDocLength = 10000 / Math.max(1, targetDocIds.size());
                if (docContent.length() > maxDocLength) {
                    docContent = docContent.substring(0, maxDocLength);
                }

                if (contentBuilder.length() > 0) {
                    contentBuilder.append("\n\n");
                }
                contentBuilder.append(docContent);
            }
        }

        String content = contentBuilder.toString();
        if (content.trim().isEmpty()) {
            throw new RuntimeException("Document content not found");
        }

        String prompt = buildMindMapPrompt(content);

        // Instruct AI to balance content if multiple files are present
        if (targetDocIds.size() > 1) {
            prompt += "\nNote: The provided content is from multiple different files (separated by '=== FILE: <name> ==='). You MUST represent concepts from ALL the provided files in the generated mindmap, ensuring balanced coverage.";
        }

        String aiResponse = groqService.generateContent(prompt);

        // Strip markdown code blocks if AI wraps JSON in ```json...```
        aiResponse = aiResponse.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        validateJson(aiResponse);
        aiUsageService.recordUsage(email, AiUsageFeature.MINDMAP_GENERATION);

        String title = "Mindmap: Generated MindMap";
        try {
            Document firstDoc = documentRepository.findById(targetDocIds.get(0)).orElse(null);
            String docTitle = firstDoc != null && firstDoc.getTitle() != null ? firstDoc.getTitle() : "Generated MindMap";
            String rawTitle = targetDocIds.size() > 1 
                ? docTitle + " (+" + (targetDocIds.size() - 1) + ")"
                : docTitle;
            if (rawTitle.startsWith("Mindmap: ")) {
                title = rawTitle;
            } else {
                title = "Mindmap: " + rawTitle;
            }
        } catch (Exception e) {
            // ignore
        }

        MindMap mindMap = MindMap.builder()
                .documentId(targetDocIds.get(0))
                .title(title)
                .content(aiResponse)
                .status(MindMapStatus.COMPLETED)
                .user(user)
                .build();

        mindMapRepository.save(mindMap);

        return mapToResponse(mindMap);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public MindMapResponse generateFromFile(MultipartFile file, String text, String title) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        aiUsageService.checkQuota(email);

        String content = "";
        if (file != null && !file.isEmpty()) {
            content = documentParserService.parseTextOnly(file);
        } else if (text != null && !text.trim().isEmpty()) {
            content = text;
        }

        if (content.trim().isEmpty()) {
            throw new RuntimeException("Content not found");
        }

        if (content.length() > 30000) {
            content = content.substring(0, 30000);
        }

        String prompt = buildMindMapPrompt(content);

        String aiResponse =
                groqService.generateContent(prompt);

        // Strip markdown code blocks if AI wraps JSON in ```json...```
        aiResponse = aiResponse.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        validateJson(aiResponse);
        aiUsageService.recordUsage(email, AiUsageFeature.MINDMAP_GENERATION);

        User user = userRepository.findByEmail(email).orElse(null);

        String formattedTitle = title;
        if (formattedTitle == null || formattedTitle.trim().isEmpty()) {
            formattedTitle = "Generated MindMap";
        }
        if (!formattedTitle.startsWith("Mindmap: ")) {
            formattedTitle = "Mindmap: " + formattedTitle;
        }

        MindMap mindMap = MindMap.builder()
                .documentId(UUID.randomUUID())
                .title(formattedTitle)
                .content(aiResponse)
                .status(MindMapStatus.COMPLETED)
                .user(user)
                .build();

        mindMapRepository.save(mindMap);

        return mapToResponse(mindMap);
    }

    @Override
    public MindMapResponse getByDocument(UUID documentId) {

        MindMap mindMap =
                mindMapRepository.findByDocumentId(documentId)
                        .orElseThrow(() ->
                                new RuntimeException("MindMap not found"));

        return mapToResponse(mindMap);
    }

    @Override
    public void delete(UUID id) {

        mindMapRepository.deleteById(id);
    }

    private String buildMindMapPrompt(String content) {

        return """
                Analyze the document below.

                Create a hierarchical mindmap.

                Rules:
                - Max depth 4
                - Max 8 children per node
                - Use concise labels
                - Return VALID JSON ONLY
                - No markdown
                - No explanation

                Format:

                {
                  "id":"root",
                  "label":"Main Topic",
                  "children":[
                    {
                      "id":"node-1",
                      "label":"Sub Topic",
                      "children":[]
                    }
                  ]
                }

                DOCUMENT:

                %s
                """.formatted(content);
    }

    private void validateJson(String json) {

        try {

            objectMapper.readTree(json);

        } catch (Exception e) {

            throw new RuntimeException(
                    "AI returned invalid JSON"
            );
        }
    }

    @Override
    public List<MindMapResponse> getUserMindMaps() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        List<MindMap> mindMaps = mindMapRepository.findAllByUserEmailOrderByCreatedAtDesc(email);

        return mindMaps.stream()
                .map(this::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public MindMapResponse renameMindMap(UUID id, String newTitle, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MindMap mindMap = mindMapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MindMap not found"));

        if (mindMap.getUser() != null) {
            if (!mindMap.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("You do not have permission to rename this mindmap");
            }
        } else {
            Document doc = documentRepository.findById(mindMap.getDocumentId()).orElse(null);
            if (doc != null && !doc.getUploadedBy().getId().equals(user.getId())) {
                throw new RuntimeException("You do not have permission to rename this mindmap");
            }
        }

        if (newTitle == null || newTitle.isBlank()) {
            throw new RuntimeException("Title is required");
        }

        mindMap.setTitle(newTitle.trim());
        mindMapRepository.save(mindMap);
        return mapToResponse(mindMap);
    }

    private MindMapResponse mapToResponse(
            MindMap mindMap
    ) {

        return MindMapResponse.builder()
                .id(mindMap.getId())
                .documentId(mindMap.getDocumentId())
                .title(mindMap.getTitle())
                .content(mindMap.getContent())
                .status(mindMap.getStatus())
                .createdAt(mindMap.getCreatedAt())
                .updatedAt(mindMap.getUpdatedAt())
                .build();
    }
}
