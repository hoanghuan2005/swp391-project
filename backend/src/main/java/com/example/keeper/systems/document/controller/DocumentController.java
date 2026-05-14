package com.example.keeper.systems.document.controller;

import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    public Document create(
            @RequestBody CreateDocumentRequest request
    ) {
        return documentService.create(request);
    }

    @GetMapping
    public List<Document> getAll() {
        return documentService.getAll();
    }

    @GetMapping("/{id}")
    public Document getById(
            @PathVariable UUID id
    ) {
        return documentService.getById(id);
    }

    @DeleteMapping("/{id}")
    public Document delete(
            @PathVariable UUID id
    ) {
        return documentService.delete(id);
    }
}
