package com.example.keeper.systems.document.controller;

import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.dto.response.DocumentDetailResponse;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.document.service.DocumentService;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;

    @PostMapping
    public DocumentDetailResponse create(
            @RequestBody CreateDocumentRequest request) {
        Document document = documentService.create(request);
        return documentService.getDetail(document.getId());
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentDetailResponse upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Visibility visibility,
            @RequestParam(required = false) UUID uploadedById,
            @RequestParam(required = false) UUID subjectId,
            @RequestParam(required = false) String subjectCode,
            @RequestParam(required = false) String subjectName,
            @RequestParam(required = false) List<String> tagNames) {
        UUID resolvedUploadedById = uploadedById;
        if (resolvedUploadedById == null) {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            resolvedUploadedById = user.getId();
        }

        CreateDocumentRequest request = new CreateDocumentRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setVisibility(visibility != null ? visibility : Visibility.PUBLIC);
        request.setUploadedById(resolvedUploadedById);
        request.setSubjectId(subjectId);
        request.setSubjectCode(subjectCode);
        request.setSubjectName(subjectName);
        request.setTagNames(tagNames);

        Document document = documentService.uploadAndCreate(file, request);
        return documentService.getDetail(document.getId());
    }

    @GetMapping
    public List<DocumentResponse> getAll() {
        return documentService.getAll();
    }

    @GetMapping("/my-uploads")
    public List<DocumentResponse> getMyUploads() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return documentService.getMyUploads(email);
    }

    @GetMapping("/{id}")
    public DocumentDetailResponse getById(
            @PathVariable UUID id) {
        return documentService.getDetail(id);
    }

    @GetMapping("/{id}/detail")
    public DocumentDetailResponse getDetail(
            @PathVariable UUID id) {
        return documentService.getDetail(id);
    }

    @DeleteMapping("/{id}")
    public Document delete(
            @PathVariable UUID id) {
        return documentService.delete(id);
    }

    // API Tải tài liệu
    @GetMapping("/{id}/download")
    public org.springframework.http.ResponseEntity<java.util.Map<String, String>> downloadDocument(
            @PathVariable UUID id) {
        String fileUrl = documentService.getDownloadUrl(id);
        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("downloadUrl", fileUrl));
    }
}
