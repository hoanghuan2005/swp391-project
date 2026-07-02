package com.example.keeper.systems.ai_mindmap.controller;

import com.example.keeper.systems.ai_mindmap.dto.request.GenerateMindMapRequest;
import com.example.keeper.systems.ai_mindmap.dto.response.MindMapResponse;
import com.example.keeper.systems.ai_mindmap.service.MindMapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/mindmaps")
@RequiredArgsConstructor
public class MindMapController {

    private final MindMapService mindMapService;

    @GetMapping
    public ResponseEntity<List<MindMapResponse>> getUserMindMaps() {
        return ResponseEntity.ok(
                mindMapService.getUserMindMaps()
        );
    }

    @PostMapping("/generate")
    public ResponseEntity<MindMapResponse> generate(
            @RequestBody GenerateMindMapRequest request
    ) {

        return ResponseEntity.ok(
                mindMapService.generate(request.getDocumentId())
        );
    }

    @PostMapping(value = "/generate-from-file", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MindMapResponse> generateFromFile(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text,
            @RequestParam("title") String title
    ) {
        return ResponseEntity.ok(
                mindMapService.generateFromFile(file, text, title)
        );
    }

    @GetMapping("/document/{documentId}")
    public ResponseEntity<MindMapResponse> getByDocument(
            @PathVariable UUID documentId
    ) {

        return ResponseEntity.ok(
                mindMapService.getByDocument(documentId)
        );
    }

    @DeleteMapping("/{mindMapId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID mindMapId
    ) {

        mindMapService.delete(mindMapId);

        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/rename")
    public ResponseEntity<MindMapResponse> rename(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> request
    ) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return ResponseEntity.ok(
                mindMapService.renameMindMap(id, request.get("title"), email)
        );
    }
}
