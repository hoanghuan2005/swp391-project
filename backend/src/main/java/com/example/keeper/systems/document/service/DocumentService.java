package com.example.keeper.systems.document.service;

import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.entity.Document;

import java.util.List;
import java.util.UUID;

public interface DocumentService {

    Document create(CreateDocumentRequest request);

    List<Document> getAll();

    Document getById(UUID id);

    Document delete(UUID id);
}
