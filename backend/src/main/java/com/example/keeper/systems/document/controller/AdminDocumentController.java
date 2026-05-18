package com.example.keeper.systems.document.controller;

import com.example.keeper.systems.document.dto.response.DocumentDetailResponse;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import com.example.keeper.systems.document.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("api/admin/documents")
@RequiredArgsConstructor
public class AdminDocumentController {
    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getAllDocuments() {
        return ResponseEntity.ok(documentService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDetailResponse> getDocumentDetail(
            @PathVariable UUID id) {
        return ResponseEntity.ok(documentService.getDetail(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDocument(@PathVariable UUID id) {
        documentService.delete(id);
        return ResponseEntity.ok("Document deleted successfully!");
    }
}
