package com.example.keeper.systems.document.service;

import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.entity.Document;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface DocumentService {

    Document create(CreateDocumentRequest request);

    Document uploadAndCreate(MultipartFile file, CreateDocumentRequest request);

    List<Document> getAll();

    List<Document> getMyUploads(String email);

    Document getById(UUID id);

    void recordView(UUID id, String email);

    List<Document> getRecentViewed(String email, int limit);

//    List<Document> getRecommended(String email, int limit);

    Document delete(UUID id);

    String getDownloadUrl(UUID id);
}
