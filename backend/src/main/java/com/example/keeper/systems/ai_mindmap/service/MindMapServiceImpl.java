package com.example.keeper.systems.ai_mindmap.service;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.ai_ask.service.GroqService;
import com.example.keeper.systems.ai_mindmap.dto.response.MindMapResponse;
import com.example.keeper.systems.ai_mindmap.entity.MindMap;
import com.example.keeper.systems.ai_mindmap.enums.MindMapStatus;
import com.example.keeper.systems.ai_mindmap.repository.MindMapRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MindMapServiceImpl implements MindMapService {

    private final MindMapRepository mindMapRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final GroqService groqService;
    private final ObjectMapper objectMapper;

    @Override
    public MindMapResponse generate(UUID documentId) {

        List<DocumentChunk> chunks =
                documentChunkRepository.findByDocumentId(documentId);

        if (chunks.isEmpty()) {
            throw new RuntimeException("Document content not found");
        }

        String content = chunks.stream()
                .map(DocumentChunk::getContent)
                .collect(java.util.stream.Collectors.joining("\n"));

        String prompt = buildMindMapPrompt(content);

        String aiResponse =
                groqService.generateContent(prompt);

        // Strip markdown code blocks if AI wraps JSON in ```json...```
        aiResponse = aiResponse.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        validateJson(aiResponse);

        MindMap mindMap = MindMap.builder()
                .documentId(documentId)
                .title("Generated MindMap")
                .content(aiResponse)
                .status(MindMapStatus.COMPLETED)
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
