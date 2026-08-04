package com.example.keeper.systems.ai_mindmap.service;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
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
import com.example.keeper.systems.ai_ask.service.DocumentParserService;
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.document.enums.Visibility;

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
    @org.springframework.transaction.annotation.Transactional
    public MindMapResponse generate(UUID documentId, String email) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        checkDocumentAccess(document, email);

        List<DocumentChunk> chunks =
                documentChunkRepository.findByDocumentId(documentId);

        if (chunks.isEmpty()) {
            throw new RuntimeException("Document content not found");
        }

        String content = chunks.stream()
                .map(DocumentChunk::getContent)
                .collect(java.util.stream.Collectors.joining("\n"));

        String prompt = buildMindMapPrompt(content);

        aiUsageService.checkQuota(email);

        String aiResponse =
                groqService.generateContent(prompt);

        // Strip markdown code blocks if AI wraps JSON in ```json...```
        aiResponse = aiResponse.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        validateJson(aiResponse);
        aiUsageService.recordUsage(email, AiUsageFeature.MINDMAP_GENERATION);

        String title = "Mindmap: Generated MindMap";
        if (document.getTitle() != null) {
            String docTitle = document.getTitle();
            if (docTitle.startsWith("Mindmap: ")) {
                title = docTitle;
            } else {
                title = "Mindmap: " + docTitle;
            }
        }

        User user = userRepository.findByEmail(email).orElse(null);

        MindMap mindMap = MindMap.builder()
                .documentId(documentId)
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

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        aiUsageService.checkQuota(email);

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
    public MindMapResponse getByDocument(UUID documentId, String email) {
        MindMap mindMap =
                mindMapRepository.findByDocumentId(documentId)
                        .orElseThrow(() ->
                                new RuntimeException("MindMap not found"));

        checkMindMapAccess(mindMap, email);

        return mapToResponse(mindMap);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void delete(UUID id, String email) {
        MindMap mindMap = mindMapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MindMap not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());

        if (!isAdmin) {
            if (mindMap.getUser() != null) {
                if (!mindMap.getUser().getId().equals(user.getId())) {
                    throw new org.springframework.security.access.AccessDeniedException("You do not have permission to delete this mindmap.");
                }
            } else if (mindMap.getDocumentId() != null) {
                Document doc = documentRepository.findById(mindMap.getDocumentId()).orElse(null);
                if (doc != null && !doc.getUploadedBy().getId().equals(user.getId())) {
                    throw new org.springframework.security.access.AccessDeniedException("You do not have permission to delete this mindmap.");
                }
            }
        }

        mindMapRepository.delete(mindMap);
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
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to rename this mindmap");
            }
        } else {
            Document doc = documentRepository.findById(mindMap.getDocumentId()).orElse(null);
            if (doc != null && !doc.getUploadedBy().getId().equals(user.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to rename this mindmap");
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

    private void checkDocumentAccess(Document document, String email) {
        if (document.getVisibility() == Visibility.PRIVATE) {
            if (email == null || "anonymousUser".equals(email)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied. Please log in.");
            }
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (document.getUploadedBy().getId().equals(user.getId())) {
                return;
            }

            if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName())) {
                return;
            }

            boolean hasAccess = projectRepository.hasUserAccessToDocumentThroughProjects(document.getId(), user.getId());
            if (!hasAccess) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied. You do not have access to this private document.");
            }
        }
    }

    private void checkMindMapAccess(MindMap mindMap, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
        if (isAdmin) {
            return;
        }

        if (mindMap.getUser() != null) {
            if (!mindMap.getUser().getId().equals(user.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this mindmap.");
            }
        } else if (mindMap.getDocumentId() != null) {
            Document doc = documentRepository.findById(mindMap.getDocumentId()).orElse(null);
            if (doc != null) {
                checkDocumentAccess(doc, email);
            }
        }
    }
}
