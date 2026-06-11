package com.example.keeper.systems.ai_mindmap.controller;

import com.example.keeper.systems.ai_mindmap.dto.request.GenerateMindMapRequest;
import com.example.keeper.systems.ai_mindmap.dto.response.MindMapResponse;
import com.example.keeper.systems.ai_mindmap.service.MindMapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mindmaps")
@RequiredArgsConstructor
public class MindMapController {

    private final MindMapService mindMapService;

    @PostMapping("/generate")
    public ResponseEntity<MindMapResponse> generate(
            @RequestBody GenerateMindMapRequest request
    ) {

        return ResponseEntity.ok(
                mindMapService.generate(request.getDocumentId())
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
}
