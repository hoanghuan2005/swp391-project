package com.example.keeper.systems.document.service;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.dto.response.DocumentDetailResponse;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.entity.DocumentView;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.document.repository.DocumentViewRepository;
import com.example.keeper.systems.document.service.storage.FileStorageService;
import com.example.keeper.systems.document.service.storage.FileUploadResult;
import com.example.keeper.systems.subject.entity.Subject;
import com.example.keeper.systems.subject.repository.SubjectRepository;
import com.example.keeper.systems.tag.entity.Tag;
import com.example.keeper.systems.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentViewRepository documentViewRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final TagRepository tagRepository;
    private final FileStorageService fileStorageService;

    @Override
    public Document create(CreateDocumentRequest request) {
        Document document = buildDocument(request);
        document.setFileUrl(request.getFileUrl());
        return documentRepository.save(document);
    }

    @Override
    public Document uploadAndCreate(MultipartFile file, CreateDocumentRequest request) {
        FileUploadResult uploadResult = fileStorageService.uploadFile(file, "documents");
        String fileUrl = uploadResult.getSecureUrl();
        String publicId = uploadResult.getPublicId();
        String resourceType = uploadResult.getResourceType();

        Document document = buildDocument(request);

        document.setFileUrl(fileUrl);
        document.setCloudinaryPublicId(publicId);
        document.setMimeType(uploadResult.getMimeType());
        document.setFileSize(file.getSize());
        document.setResourceType(resourceType);
        document.setOriginalFileName(uploadResult.getOriginalFileName());
        String originalFilename = uploadResult.getOriginalFileName();

        String extension = "";

        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(
                    originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }

        document.setPreviewUrl(
                fileStorageService.generatePreviewUrl(
                        publicId,
                        resourceType,
                        extension));

        document.setDownloadUrl(
                fileStorageService.generateDownloadUrl(
                        publicId,
                        resourceType,
                        extension));

        if (document.getTitle() == null || document.getTitle().trim().isEmpty()) {
            document.setTitle(resolveTitle(file));
        }

        return documentRepository.save(document);
    }

    private Document buildDocument(CreateDocumentRequest request) {
        String currentUserEmail = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user đăng nhập!"));

        Subject subject = resolveSubject(request);

        Document document = new Document();

        document.setTitle(request.getTitle());
        document.setDescription(request.getDescription());
        document.setThumbnailUrl(request.getThumbnailUrl());
        String mimeType = request.getMimeType() != null && !request.getMimeType().isBlank()
                ? request.getMimeType()
                : request.getFileType();
        document.setMimeType(mimeType);
        document.setOriginalFileName(request.getOriginalFileName());
        document.setFileSize(request.getFileSize());
        document.setVisibility(request.getVisibility());

        // document.setUploadStatus(UploadStatus.DONE);

        document.setUploadedBy(user);
        document.setSubject(subject);
        document.setTags(resolveTags(request));

        return document;
    }

    private Subject resolveSubject(CreateDocumentRequest request) {
        if (request.getSubjectId() != null) {
            return subjectRepository.findById(request.getSubjectId())
                    .orElseThrow();
        }

        String subjectCode = safeTrim(request.getSubjectCode());
        if (subjectCode == null) {
            throw new IllegalArgumentException("Subject code is required");
        }

        return subjectRepository.findByCode(subjectCode)
                .orElseGet(() -> {
                    String subjectName = safeTrim(request.getSubjectName());
                    if (subjectName == null) {
                        throw new IllegalArgumentException("Subject name is required for new subject code");
                    }

                    Subject subject = new Subject();
                    subject.setCode(subjectCode);
                    subject.setName(subjectName);
                    subject.setDescription(null);
                    return subjectRepository.save(subject);
                });
    }

    private Set<Tag> resolveTags(CreateDocumentRequest request) {
        Set<Tag> tags = new HashSet<>();
        if (request.getTagNames() == null || request.getTagNames().isEmpty()) {
            return tags;
        }

        for (String rawName : request.getTagNames()) {
            String name = safeTrim(rawName);
            if (name == null) {
                continue;
            }

            Tag tag = tagRepository.findByNameIgnoreCase(name)
                    .orElseGet(() -> tagRepository.save(new Tag(name)));
            tags.add(tag);
        }

        return tags;
    }

    private String safeTrim(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String resolveTitle(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            return "Untitled document";
        }

        int extensionIndex = originalName.lastIndexOf('.');
        return extensionIndex > 0 ? originalName.substring(0, extensionIndex) : originalName;
    }

    private String resolveResourceType(Document document) {
        if (document.getResourceType() != null && !document.getResourceType().isBlank()) {
            return document.getResourceType();
        }

        String mimeType = document.getMimeType();
        if (mimeType != null && !mimeType.isBlank()) {
            return fileStorageService.detectResourceType(mimeType);
        }

        String fileUrl = document.getFileUrl();
        if (fileUrl == null) {
            return "raw";
        }

        if (fileUrl.contains("/image/upload/")) {
            return "image";
        }

        if (fileUrl.contains("/video/upload/")) {
            return "video";
        }

        return "raw";
    }

    private String resolvePreviewUrl(Document document) {
        if (document.getPreviewUrl() != null && !document.getPreviewUrl().isBlank()) {
            return document.getPreviewUrl();
        }

        String publicId = document.getCloudinaryPublicId();
        if (publicId == null || publicId.isBlank()) {
            return document.getFileUrl();
        }

        String resourceType = resolveResourceType(document);
        return fileStorageService.generatePreviewUrl(
                publicId,
                resourceType,
                resolveExtension(document));
    }

    private String resolveDownloadUrl(Document document) {
        if (document.getDownloadUrl() != null && !document.getDownloadUrl().isBlank()) {
            return document.getDownloadUrl();
        }

        String publicId = document.getCloudinaryPublicId();
        if (publicId == null || publicId.isBlank()) {
            return document.getFileUrl();
        }

        String resourceType = resolveResourceType(document);
        return fileStorageService.generateDownloadUrl(
                publicId,
                resourceType,
                resolveExtension(document));
    }

    @Override
    public List<DocumentResponse> getAll() {
        return documentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DocumentResponse> getMyUploads(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return documentRepository.findByUploadedById(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Document getById(UUID id) {
        return documentRepository.findById(id)
                .orElseThrow();
    }

    @Override
    public DocumentDetailResponse getDetail(UUID id) {
        Document document = getById(id);
        return mapToDetail(document);
    }

    @Override
    public void recordView(UUID id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Document document = getById(id);

        Optional<DocumentView> existingView = documentViewRepository.findByUserIdAndDocumentId(user.getId(),
                document.getId());
        DocumentView view = existingView.orElseGet(() -> new DocumentView(user, document, LocalDateTime.now()));
        view.setLastViewedAt(LocalDateTime.now());
        documentViewRepository.save(view);
    }

    @Override
    public List<Document> getRecentViewed(String email, int limit) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return documentViewRepository.findRecentDocuments(user.getId(), PageRequest.of(0, limit));
    }

    // @Override
    // public List<Document> getRecommended(String email, int limit) {
    // User user = userRepository.findByEmail(email)
    // .orElseThrow(() -> new RuntimeException("User not found"));
    //
    // List<String> preferredLanguages = user.getPreferredLanguages()
    // .stream()
    // .map(value -> value == null ? "" : value.trim().toLowerCase())
    // .filter(value -> !value.isEmpty())
    // .collect(Collectors.toList());
    //
    // if (user.isSurveyCompleted() && !preferredLanguages.isEmpty()) {
    // List<Document> matches =
    // documentRepository.findByTagNames(preferredLanguages, PageRequest.of(0,
    // limit));
    // if (!matches.isEmpty()) {
    // return matches;
    // }
    // }
    //
    // return documentRepository.findTopByDownloadCount(PageRequest.of(0, limit));
    // }

    @Override
    public Document delete(UUID id) {

        Document document = getById(id);

        fileStorageService.deleteFile(document.getCloudinaryPublicId(), resolveResourceType(document));

        documentRepository.delete(document);

        return document;
    }

    private DocumentDetailResponse mapToDetail(Document document) {
        String previewUrl = resolvePreviewUrl(document);
        String downloadUrl = resolveDownloadUrl(document);
        String resourceType = resolveResourceType(document);
        String mimeType = document.getMimeType();

        return DocumentDetailResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .description(document.getDescription())
                .fileUrl(document.getFileUrl())
                .previewUrl(previewUrl)
                .downloadUrl(downloadUrl)
                .fileType(resolveFileType(document))
                .resourceType(resourceType)
                .mimeType(mimeType)
                .originalFileName(document.getOriginalFileName())
                .fileSize(document.getFileSize())
                .visibility(document.getVisibility() == null
                        ? null
                        : document.getVisibility().name())
                .downloadCount(document.getDownloadCount())
                .createdAt(document.getCreatedAt())
                .subject(DocumentDetailResponse.SubjectInfo.builder()
                        .id(document.getSubject() == null ? null : document.getSubject().getId())
                        .code(document.getSubject() == null ? null : document.getSubject().getCode())
                        .name(document.getSubject() == null ? null : document.getSubject().getName())
                        .build())
                .uploadedBy(DocumentDetailResponse.UserInfo.builder()
                        .id(document.getUploadedBy() == null ? null : document.getUploadedBy().getId())
                        .username(document.getUploadedBy() == null ? null : document.getUploadedBy().getUsername())
                        .email(document.getUploadedBy() == null ? null : document.getUploadedBy().getEmail())
                        .build())
                .tags(document.getTags() == null
                        ? List.of()
                        : document.getTags().stream()
                                .map(Tag::getName)
                                .sorted(String::compareToIgnoreCase)
                                .toList())
                .build();
    }

    private DocumentResponse mapToResponse(Document document) {
        String previewUrl = resolvePreviewUrl(document);
        String downloadUrl = resolveDownloadUrl(document);
        String resourceType = resolveResourceType(document);

        return DocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .fileType(resolveFileType(document))
                .resourceType(resourceType)
                .previewUrl(previewUrl)
                .downloadUrl(downloadUrl)
                .mimeType(document.getMimeType())
                .visibility(document.getVisibility() == null
                        ? null
                        : document.getVisibility().name())
                .downloadCount(document.getDownloadCount())
                .createdAt(document.getCreatedAt())
                .subject(DocumentResponse.SubjectInfo.builder()
                        .id(document.getSubject() == null ? null : document.getSubject().getId())
                        .code(document.getSubject() == null ? null : document.getSubject().getCode())
                        .name(document.getSubject() == null ? null : document.getSubject().getName())
                        .build())
                .tags(document.getTags() == null
                        ? List.of()
                        : document.getTags().stream()
                                .map(Tag::getName)
                                .sorted(String::compareToIgnoreCase)
                                .toList())
                .build();
    }

    private String resolveFileType(Document document) {
        String originalFileName = document.getOriginalFileName();
        if (originalFileName != null) {
            int extensionIndex = originalFileName.lastIndexOf('.');
            if (extensionIndex > 0 && extensionIndex < originalFileName.length() - 1) {
                return originalFileName.substring(extensionIndex + 1).toLowerCase();
            }
        }

        return document.getMimeType();
    }

    private String resolveExtension(Document document) {
        String originalFileName = document.getOriginalFileName();
        if (originalFileName != null) {
            int extensionIndex = originalFileName.lastIndexOf('.');
            if (extensionIndex > 0 && extensionIndex < originalFileName.length() - 1) {
                return originalFileName.substring(extensionIndex + 1).toLowerCase();
            }
        }
        return "";
    }

    @Override
    public String getDownloadUrl(UUID id) {
        Document document = getById(id);

        // Tăng số lượt tải lên 1
        int currentCount = document.getDownloadCount() != null ? document.getDownloadCount() : 0;
        document.setDownloadCount(currentCount + 1);
        documentRepository.save(document);

        String downloadUrl = resolveDownloadUrl(document);
        if (downloadUrl == null || downloadUrl.isBlank()) {
            return document.getFileUrl();
        }

        return downloadUrl;
    }
}
