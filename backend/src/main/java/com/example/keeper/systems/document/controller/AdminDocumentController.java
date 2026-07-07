package com.example.keeper.systems.document.controller;

import com.example.keeper.systems.document.dto.response.DocumentDetailResponse;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import com.example.keeper.systems.document.service.DocumentService;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.document.enums.AiParseStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("api/admin/documents")
@RequiredArgsConstructor
public class AdminDocumentController {
    private final DocumentService documentService;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getAllDocuments() {
        return ResponseEntity.ok(documentService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDetailResponse> getDocumentDetail(
            @PathVariable UUID id) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(documentService.getDetail(id, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDocument(@PathVariable UUID id) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        documentService.delete(id, email);
        return ResponseEntity.ok("Document deleted successfully!");
    }

    @PostMapping("/import")
    public ResponseEntity<?> importDocuments(@RequestBody List<Map<String, String>> requests) {
        for (Map<String, String> req : requests) {
            String title = req.get("title");
            String fileUrl = req.get("fileUrl");
            String email = req.get("uploadedByEmail");
            
            if (title == null || title.isBlank() || fileUrl == null || fileUrl.isBlank() || email == null || email.isBlank()) {
                continue;
            }

            java.util.Optional<User> uOpt = userRepository.findByEmail(email.trim());
            if (uOpt.isEmpty()) continue;

            Document doc = new Document();
            doc.setTitle(title.trim());
            doc.setDescription(req.getOrDefault("description", "").trim());
            doc.setFileUrl(fileUrl.trim());
            doc.setUploadedBy(uOpt.get());
            doc.setAiParseStatus(AiParseStatus.READY);

            String visStr = req.getOrDefault("visibility", "PUBLIC");
            try {
                doc.setVisibility(Visibility.valueOf(visStr.toUpperCase()));
            } catch (Exception e) {
                doc.setVisibility(Visibility.PUBLIC);
            }

            documentRepository.save(doc);
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Documents imported successfully"));
    }
}
