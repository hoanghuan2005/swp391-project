package com.example.keeper.systems.document.controller;

import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.dto.response.DocumentDetailResponse;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.document.service.DocumentService;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
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

    @Operation(summary = "Upload a document")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentDetailResponse upload(
            @Parameter(
                    description = "Document file",
                    required = true,
                    content = @Content(
                            mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE,
                            schema = @Schema(type = "string", format = "binary")))
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Visibility visibility,
            @RequestParam(required = false) UUID uploadedById,
            @RequestParam(required = false) UUID courseId,
            @RequestParam(required = false) String courseCode,
            @RequestParam(required = false) String courseName,
            @RequestParam(required = false) List<String> tagNames) {

        UUID resolvedUploadedById = uploadedById;

        if (resolvedUploadedById == null) {
            String email = SecurityContextHolder.getContext()
                    .getAuthentication()
                    .getName();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            resolvedUploadedById = user.getId();
        }

        CreateDocumentRequest request = new CreateDocumentRequest();

        request.setTitle(title);
        request.setDescription(description);
        request.setVisibility(
                visibility != null ? visibility : Visibility.PUBLIC);

        request.setUploadedById(resolvedUploadedById);

        request.setCourseId(courseId);
        request.setCourseCode(courseCode);
        request.setCourseName(courseName);
        request.setTagNames(tagNames);

        Document document = documentService.uploadAndCreate(file, request);

        return documentService.getDetail(document.getId());
    }

    @GetMapping
    public List<DocumentResponse> getAll() {
        return documentService.getAll();
    }

    @GetMapping("/recent")
    public List<DocumentResponse> getRecentDocuments(
            @RequestParam(defaultValue = "10") int limit) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return documentService.getRecentViewed(email, limit);
    }

    @PostMapping("/{id}/view")
    public void recordView(@PathVariable UUID id) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        documentService.recordView(id, email);
    }

    @GetMapping("/my-uploads")
    public List<DocumentResponse> getMyUploads() {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return documentService.getMyUploads(email);
    }

    // =========================
    // TÍNH NĂNG: FAVORITE (THẢ TIM) TÀI LIỆU
    // =========================

    @GetMapping("/favorites")
    public List<DocumentResponse> getMyFavorites() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        // Gọi xuống service để lấy danh sách tài liệu user đã thích
        return documentService.getMyFavorites(email);
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        // Gọi xuống service để Thêm/Xóa tim
        documentService.toggleFavorite(id, email);
        return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái yêu thích"));
    }

    // =========================
    // API CHO AI FLASHCARD & KHÁC
    // =========================

    @GetMapping("/my-documents")
    public ResponseEntity<?> getMyDocuments() {

        List<Map<String, Object>> data = documentService.getAll()
                .stream()
                .map(doc -> {

                    Map<String, Object> item = new java.util.HashMap<>();

                    item.put("id", doc.getId());
                    item.put("name", doc.getTitle() != null
                            ? doc.getTitle()
                            : "Untitled");

                    item.put("course", "SWP391");

                    return item;
                })
                .toList();

        return ResponseEntity.ok(
                Map.of("data", data)
        );
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

    // API tải tài liệu
    @GetMapping("/{id}/download")
    public ResponseEntity<Map<String, String>> downloadDocument(
            @PathVariable UUID id) {

        String fileUrl = documentService.getDownloadUrl(id);

        return ResponseEntity.ok(
                Map.of("downloadUrl", fileUrl)
        );
    }
}