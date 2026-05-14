package com.example.keeper.systems.document.service;

import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
//    private final UserRepository userRepository;
//    private final SubjectRepository subjectRepository;

    @Override
    public Document create(CreateDocumentRequest request) {

        User user = userRepository.findById(request.getUploadedById())
                .orElseThrow();

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow();

        Document document = new Document();

        document.setTitle(request.getTitle());
        document.setDescription(request.getDescription());
        document.setFileUrl(request.getFileUrl());
        document.setThumbnailUrl(request.getThumbnailUrl());
        document.setFileType(request.getFileType());
        document.setFileSize(request.getFileSize());
        document.setVisibility(request.getVisibility());

        document.setUploadStatus(UploadStatus.DONE);

        document.setUploadedBy(user);
        document.setSubject(subject);

        return documentRepository.save(document);
    }

    @Override
    public List<Document> getAll() {
        return documentRepository.findAll();
    }

    @Override
    public Document getById(UUID id) {
        return documentRepository.findById(id)
                .orElseThrow();
    }

    @Override
    public Document delete(UUID id) {

        Document document = getById(id);

        documentRepository.delete(document);

        return document;
    }
}
