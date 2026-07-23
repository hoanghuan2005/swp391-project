package com.example.keeper.systems.document.service;

import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.dto.request.UpdateDocumentRequest;
import com.example.keeper.systems.document.dto.response.DocumentDetailResponse;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import com.example.keeper.systems.document.entity.Document;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface DocumentService {

    Document create(CreateDocumentRequest request);

    Document uploadAndCreate(MultipartFile file, CreateDocumentRequest request);

    List<DocumentResponse> getAll();

    Page<DocumentResponse> getPublicDocuments(int page, int size);

    List<DocumentResponse> getMyUploads(String email);

    Document getById(UUID id);

    DocumentDetailResponse getDetail(UUID id, String email);

    void recordView(UUID id, String email);

    List<DocumentResponse> getRecentViewed(String email, int limit);

    // =========================
    // TÍNH NĂNG: FAVORITE (THẢ TIM) TÀI LIỆU
    // =========================
    List<DocumentResponse> getMyFavorites(String email);

    void toggleFavorite(UUID documentId, String email);
    // =========================

    List<DocumentResponse> getRecommended(String email, int limit);

    Document delete(UUID id, String email);

    String getDownloadUrl(UUID id, String email);

    DocumentDetailResponse update(UUID id, UpdateDocumentRequest request);

    void reportDocument(UUID documentId, com.example.keeper.systems.document.dto.request.DocumentReportRequest request, String reporterEmail);

    List<com.example.keeper.systems.document.dto.response.DocumentReportResponse> getAllReports();

    void resolveReport(UUID reportId, String status);

    boolean checkDuplicate(String fileName, Long fileSize, String email);

    // =========================
    // TÍNH NĂNG: DOCUMENT VERSIONING (QUẢN LÝ PHIÊN BẢN)
    // =========================
    com.example.keeper.systems.document.entity.DocumentVersion uploadNewVersion(UUID documentId, MultipartFile file, String changelog, String email);

    List<com.example.keeper.systems.document.dto.response.DocumentVersionResponse> getDocumentVersions(UUID documentId);

    String getDownloadUrlForVersion(UUID documentId, UUID versionId, String email);

    com.example.keeper.systems.document.dto.response.DocumentVersionResponse approveVersion(UUID documentId, UUID versionId, String email);

    com.example.keeper.systems.document.dto.response.DocumentVersionResponse rejectVersion(UUID documentId, UUID versionId, String reason, String email);
}