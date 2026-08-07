package com.example.keeper.systems.document.service;

import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.dto.request.UpdateDocumentRequest;
import com.example.keeper.systems.document.dto.response.DocumentDetailResponse;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.entity.DocumentView;
import com.example.keeper.systems.document.enums.AiParseStatus;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.document.repository.DocumentViewRepository;
import com.example.keeper.systems.document.service.storage.FileStorageService;
import com.example.keeper.systems.document.service.storage.FileUploadResult;
import com.example.keeper.systems.follow.repository.UserFollowRepository;
import com.example.keeper.systems.major.repository.MajorRepository;
import com.example.keeper.systems.notification.service.NotificationService;
import com.example.keeper.systems.ai_ask.service.DocumentParserService;
import com.example.keeper.systems.ai_flashcard.repository.FlashcardSetRepository;
import com.example.keeper.systems.category.entity.Category;
import com.example.keeper.systems.category.repository.CategoryRepository;
import com.example.keeper.systems.course.entity.Course;
import com.example.keeper.systems.course.repository.CourseRepository;
import com.example.keeper.systems.tag.entity.Tag;
import com.example.keeper.systems.tag.repository.TagRepository;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.document.repository.DocumentReportRepository;
import com.example.keeper.systems.document.entity.DocumentReport;
import com.example.keeper.systems.document.dto.request.DocumentReportRequest;
import com.example.keeper.systems.document.dto.response.DocumentReportResponse;
import com.example.keeper.systems.document.dto.response.DocumentVersionResponse;
import com.example.keeper.systems.document.entity.DocumentVersion;
import com.example.keeper.systems.document.repository.DocumentVersionRepository;
import com.example.keeper.systems.ai_ask.service.EmbeddingService;
import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.charset.Charset;
import java.text.Normalizer;
import java.nio.charset.StandardCharsets;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentViewRepository documentViewRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final TagRepository tagRepository;
    private final FileStorageService fileStorageService;
    private final DocumentParserService documentParserService;
    private final DocumentChunkRepository documentChunkRepository;
    private final MajorRepository majorRepository;
    private final UserFollowRepository userFollowRepository;
    private final NotificationService notificationService;
    private final DocumentQuotaService documentQuotaService;
    private final CategoryRepository categoryRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final ProjectRepository projectRepository;
    private final DocumentReportRepository documentReportRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final EmbeddingService embeddingService;

    @Override
    public Document create(CreateDocumentRequest request) {
        documentQuotaService.validateDocumentCreation(getCurrentUserEmail());
        Document document = buildDocument(request);
        document.setFileUrl(request.getFileUrl());
        document.setAiParseStatus(AiParseStatus.UNSUPPORTED);
        Document savedDoc = documentRepository.save(document);
        notifyFollowers(savedDoc);
        return savedDoc;
    }

    @Override
    public Document uploadAndCreate(MultipartFile file, CreateDocumentRequest request) {
        validateSupportedFileFormat(file);
        documentQuotaService.validateUpload(getCurrentUserEmail(), file.getSize());

        Document document = buildDocument(request);
        User u = document.getUploadedBy();
        String folder = getUserFolderName(u);

        FileUploadResult uploadResult = fileStorageService.uploadFile(file, folder);
        String fileUrl = uploadResult.getSecureUrl();
        String publicId = uploadResult.getPublicId();
        String resourceType = uploadResult.getResourceType();

        document.setFileUrl(fileUrl);
        document.setCloudinaryPublicId(publicId);
        document.setMimeType(uploadResult.getMimeType());
        document.setFileSize(file.getSize());
        document.setResourceType(resourceType);
        String originalFilename = sanitizeFilename(uploadResult.getOriginalFileName());

        document.setOriginalFileName(originalFilename);

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
            document.setTitle(
                    sanitizeFilename(resolveTitle(file)));
        }
        document.setAiParseStatus(resolveAiParseStatus(file));

        byte[] fileBytes = null;
        String parserFilename = file.getOriginalFilename();
        String parserContentType = file.getContentType();
        if (document.getAiParseStatus() == AiParseStatus.PENDING) {
            try {
                fileBytes = file.getBytes();
            } catch (IOException e) {
                log.warn("Failed to copy document bytes before async parsing. Filename: {}, Error: {}",
                        parserFilename,
                        e.getMessage());
                document.setAiParseStatus(AiParseStatus.FAILED);
            }
        }

        Document savedDocument = documentRepository.save(document);

        // Save initial DocumentVersion (v1.0)
        try {
            DocumentVersion initialVersion = new DocumentVersion();
            initialVersion.setDocument(savedDocument);
            initialVersion.setVersionNumber(savedDocument.getCurrentVersionNumber() != null ? savedDocument.getCurrentVersionNumber() : "v1.0");
            initialVersion.setFileUrl(fileUrl);
            initialVersion.setCloudinaryPublicId(publicId);
            initialVersion.setMimeType(uploadResult.getMimeType());
            initialVersion.setResourceType(resourceType);
            initialVersion.setOriginalFileName(originalFilename);
            initialVersion.setFileSize(file.getSize());
            initialVersion.setChangelog("Initial upload");
            initialVersion.setUploadedBy(savedDocument.getUploadedBy());
            documentVersionRepository.save(initialVersion);
        } catch (Exception e) {
            log.error("Failed to save initial document version", e);
        }

        notifyFollowers(savedDocument);

        if (savedDocument.getAiParseStatus() == AiParseStatus.PENDING && fileBytes != null) {
            byte[] stableFileBytes = fileBytes;
            // Asynchronously parse document for AI features.
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                boolean parsed = documentParserService.parseAndChunkDocument(
                        stableFileBytes,
                        parserFilename,
                        parserContentType,
                        savedDocument.getId());
                documentRepository.findById(savedDocument.getId()).ifPresent(doc -> {
                    doc.setAiParseStatus(parsed ? AiParseStatus.READY : AiParseStatus.FAILED);
                    documentRepository.save(doc);
                });
            });
        }

        return savedDocument;
    }

    private Document buildDocument(CreateDocumentRequest request) {
        String currentUserEmail = getCurrentUserEmail();

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found!"));

        Course course = resolveCourse(request);

        Document document = new Document();

        document.setTitle(sanitizeOptionalFilename(request.getTitle()));
        document.setDescription(request.getDescription());
        document.setThumbnailUrl(request.getThumbnailUrl());
        String mimeType = request.getMimeType() != null && !request.getMimeType().isBlank()
                ? request.getMimeType()
                : request.getFileType();
        document.setMimeType(mimeType);
        document.setOriginalFileName(sanitizeOptionalFilename(request.getOriginalFileName()));
        document.setFileSize(request.getFileSize());
        document.setVisibility(request.getVisibility());

        // document.setUploadStatus(UploadStatus.DONE);

        document.setUploadedBy(user);
        document.setCourse(course);
        document.setTags(resolveTags(request));

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            document.setCategory(category);
        }

        return document;
    }

    private String getCurrentUserEmail() {
        return org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
    }

    private Course resolveCourse(CreateDocumentRequest request) {
        if (request.getCourseId() != null) {
            return courseRepository.findById(request.getCourseId())
                    .orElseThrow();
        }

        String courseCode = safeTrim(request.getCourseCode());
        if (courseCode == null) {
            return null;
        }

        if (request.getMajorId() != null) {
            return courseRepository.findByMajorIdAndCode(request.getMajorId(), courseCode)
                    .orElseGet(() -> {
                        String courseName = safeTrim(request.getCourseName());
                        if (courseName == null) {
                            courseName = courseCode;
                        }

                        com.example.keeper.systems.major.entity.Major major = majorRepository
                                .findById(request.getMajorId())
                                .orElseThrow(() -> new RuntimeException("Major not found"));

                        Course course = new Course();
                        course.setCode(courseCode);
                        course.setName(courseName);
                        course.setDescription(null);
                        course.setMajor(major);
                        return courseRepository.save(course);
                    });
        }

        return courseRepository.findByCode(courseCode)
                .orElseGet(() -> {
                    String courseName = safeTrim(request.getCourseName());
                    if (courseName == null) {
                        courseName = courseCode;
                    }

                    Course course = new Course();
                    course.setCode(courseCode);
                    course.setName(courseName);
                    course.setDescription(null);
                    return courseRepository.save(course);
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
        String url = null;
        if (document.getPreviewUrl() != null && !document.getPreviewUrl().isBlank()) {
            url = document.getPreviewUrl();
        } else {
            String publicId = document.getCloudinaryPublicId();
            if (publicId == null || publicId.isBlank()) {
                url = document.getFileUrl();
            } else {
                String resourceType = resolveResourceType(document);
                url = fileStorageService.generatePreviewUrl(
                        publicId,
                        resourceType,
                        resolveExtension(document));
            }
        }
        return fixCloudinaryDocumentUrl(url, resolveExtension(document));
    }

    private String resolveDownloadUrl(Document document) {
        String url = null;
        if (document.getDownloadUrl() != null && !document.getDownloadUrl().isBlank()) {
            url = document.getDownloadUrl();
        } else {
            String publicId = document.getCloudinaryPublicId();
            if (publicId == null || publicId.isBlank()) {
                url = document.getFileUrl();
            } else {
                String resourceType = resolveResourceType(document);
                url = fileStorageService.generateDownloadUrl(
                        publicId,
                        resourceType,
                        resolveExtension(document));
            }
        }
        return fixCloudinaryDocumentUrl(url, resolveExtension(document));
    }

    private String fixCloudinaryDocumentUrl(String url, String extension) {
        if (url == null) return null;
        String ext = extension != null ? extension.toLowerCase() : "";
        boolean isDoc = ext.equals("pdf") || ext.equals("docx") || ext.equals("doc")
                || ext.equals("pptx") || ext.equals("ppt") || ext.equals("xlsx") || ext.equals("txt");
        if (isDoc && url.contains("res.cloudinary.com") && url.contains("/image/upload/")) {
            return url.replace("/image/upload/", "/raw/upload/");
        }
        return url;
    }

    @Override
    public List<DocumentResponse> getAll() {
        return documentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public org.springframework.data.domain.Page<DocumentResponse> getPublicDocuments(int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        org.springframework.data.domain.Page<Document> docPage = documentRepository.findByVisibilityOrderByCreatedAtDesc(Visibility.PUBLIC, pageable);
        return docPage.map(this::mapToResponse);
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

    private void checkDocumentAccess(Document document, String email) {
        if (document.getVisibility() == Visibility.PRIVATE) {
            if (email == null || "anonymousUser".equals(email)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied. Please log in.");
            }
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            if (document.getUploadedBy().getId().equals(user.getId())) {
                return;
            }
            
            if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName())) {
                return;
            }
            
            boolean hasAccess = projectRepository.hasUserAccessToDocumentThroughProjects(document.getId(), user.getId());
            if (!hasAccess) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied. You do not have access to this private document.");
            }
        }
    }

    @Override
    public DocumentDetailResponse getDetail(UUID id, String email) {
        Document document = getById(id);
        checkDocumentAccess(document, email);
        return mapToDetail(document);
    }

    @Override
    public void recordView(UUID id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Document document = getById(id);

        int currentViews = document.getViewCount() != null ? document.getViewCount() : 0;
        document.setViewCount(currentViews + 1);
        documentRepository.save(document);

        Optional<DocumentView> existingView = documentViewRepository.findByUserIdAndDocumentId(user.getId(),
                document.getId());
        DocumentView view = existingView.orElseGet(() -> new DocumentView(user, document, LocalDateTime.now()));
        view.setLastViewedAt(LocalDateTime.now());
        documentViewRepository.save(view);
    }

    @Override
    public List<DocumentResponse> getRecentViewed(String email, int limit) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return documentViewRepository.findRecentDocuments(user.getId(), PageRequest.of(0, limit))
                .stream()
                .map(dv -> {
                    DocumentResponse res = mapToResponse(dv.getDocument());
                    res.setLastViewedAt(dv.getLastViewedAt());
                    return res;
                })
                .toList();
    }

    @Override
    public List<DocumentResponse> getRecommended(String email, int limit) {
        String schoolName = null;
        String majorName = null;
        List<String> languageNames = List.of();

        User user = null;
        if (email != null && !email.isBlank() && !"anonymousUser".equalsIgnoreCase(email)) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                user = userOpt.get();
                if (user.isSurveyCompleted()) {
                    if (user.getProfile() != null) {
                        schoolName = user.getProfile().getSchoolName();
                        if (schoolName == null || schoolName.isBlank()) {
                            schoolName = user.getProfile().getSchoolCode();
                        }
                        majorName = user.getProfile().getMajor();
                    }
                    if (user.getLanguages() != null) {
                        languageNames = user.getLanguages().stream()
                                .map(l -> l.getName().trim().toLowerCase())
                                .filter(name -> !name.isEmpty())
                                .collect(Collectors.toList());
                    }
                }
            }
        }

        List<DocumentResponse> resultList = new java.util.ArrayList<>();
        Set<UUID> addedIds = new HashSet<>();

        // 1. IMPLEMENT VECTOR SEARCH (TOP PRIORITY)
        try {
            StringBuilder contextText = new StringBuilder();

            // Get context from 3 most recent documents viewed by user
            if (user != null) {
                var recentViews = documentViewRepository.findRecentDocuments(user.getId(), PageRequest.of(0, 3));
                for (var view : recentViews) {
                    if (view.getDocument() != null && view.getDocument().getTitle() != null) {
                        contextText.append(view.getDocument().getTitle()).append(" ");
                        if (view.getDocument().getDescription() != null) {
                            contextText.append(view.getDocument().getDescription()).append(" ");
                        }
                    }
                }
            }

            // If no viewing history, use survey data
            if (contextText.toString().trim().isEmpty()) {
                if (majorName != null) contextText.append(majorName).append(" ");
                if (schoolName != null) contextText.append(schoolName).append(" ");
                if (!languageNames.isEmpty()) contextText.append(String.join(" ", languageNames)).append(" ");
            }

            String queryText = contextText.toString().trim();
            if (!queryText.isEmpty()) {
                float[] embedding = embeddingService.embed(queryText);
                if (embedding != null && embedding.length > 0) {
                    String vectorStr = java.util.Arrays.toString(embedding);
                    List<DocumentChunk> similarChunks = documentChunkRepository.findSimilarPublicChunks(vectorStr, limit * 5);

                    for (DocumentChunk chunk : similarChunks) {
                        UUID docId = chunk.getDocumentId();
                        if (docId != null && !addedIds.contains(docId)) {
                            Optional<Document> docOpt = documentRepository.findById(docId);
                            if (docOpt.isPresent()) {
                                Document doc = docOpt.get();
                                if (doc.getVisibility() == Visibility.PUBLIC) {
                                    addedIds.add(docId);
                                    resultList.add(mapToResponse(doc));
                                    if (resultList.size() >= limit) break;
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Vector search recommendation failed, falling back to SQL query. Error: {}", e.getMessage());
        }

        // 2. FALLBACK 1: SQL QUERY (IF VECTOR SEARCH HAS NOT ENOUGH RESULTS)
        if (resultList.size() < limit) {
            boolean hasSurveyData = (schoolName != null && !schoolName.isBlank())
                    || (majorName != null && !majorName.isBlank())
                    || !languageNames.isEmpty();

            if (hasSurveyData) {
                List<String> queryLanguages = languageNames.isEmpty() ? List.of("__DUMMY_LANG__") : languageNames;
                List<Document> recommendedDocs = documentRepository.findRecommendedDocuments(
                        schoolName,
                        majorName,
                        queryLanguages,
                        PageRequest.of(0, limit)
                );
                for (Document doc : recommendedDocs) {
                    if (resultList.size() >= limit) break;
                    if (addedIds.add(doc.getId())) {
                        resultList.add(mapToResponse(doc));
                    }
                }
            }
        }

        // 3. FALLBACK 2: TOP PUBLIC DOCUMENTS (IF STILL NOT ENOUGH RESULTS)
        if (resultList.size() < limit) {
            List<Document> topDocs = documentRepository.findTopPublicDocuments(PageRequest.of(0, limit * 2));
            for (Document doc : topDocs) {
                if (resultList.size() >= limit) break;
                if (addedIds.add(doc.getId())) {
                    resultList.add(mapToResponse(doc));
                }
            }
        }

        return resultList;
    }

    @Override
    @Transactional
    public Document delete(UUID id, String email) {

        Document document = getById(id);

        if (email != null) {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
            boolean isOwner = document.getUploadedBy().getId().equals(user.getId());
            boolean isUploaderAdmin = document.getUploadedBy().getRole() != null && "ADMIN".equalsIgnoreCase(document.getUploadedBy().getRole().getName());

            if (isAdmin) {
                if (isUploaderAdmin && !isOwner) {
                    throw new org.springframework.security.access.AccessDeniedException("You cannot delete a document uploaded by another Admin.");
                }
            } else if (!isOwner) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to delete this document.");
            }
        }

        fileStorageService.deleteFile(document.getCloudinaryPublicId(), resolveResourceType(document));

        documentViewRepository.deleteByDocumentId(document.getId());

        documentChunkRepository.deleteByDocumentId(document.getId());

        flashcardSetRepository.clearDocumentReference(document.getId());

        documentReportRepository.deleteByDocumentId(document.getId());

        documentRepository.deleteDocumentReviewAssociations(document.getId());
        documentRepository.deleteProjectDocumentAssociations(document.getId());
        documentRepository.deleteUserFavoriteAssociations(document.getId());

        documentRepository.delete(document);

        return document;
    }

    private DocumentDetailResponse mapToDetail(Document document) {
        String previewUrl = resolvePreviewUrl(document);
        String downloadUrl = resolveDownloadUrl(document);
        String resourceType = resolveResourceType(document);
        String mimeType = document.getMimeType();

        Double avgRating = 0.0;
        Integer revCount = 0;
        if (document.getReviews() != null && !document.getReviews().isEmpty()) {
            double sum = 0;
            for (com.example.keeper.systems.document.entity.DocumentReview r : document.getReviews()) {
                sum += r.getRating();
            }
            avgRating = sum / document.getReviews().size();
            revCount = document.getReviews().size();
        }

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
                .aiParseStatus(document.getAiParseStatus() == null
                        ? null
                        : document.getAiParseStatus().name())
                .downloadCount(document.getDownloadCount())
                .viewCount(document.getViewCount() != null ? document.getViewCount() : 0)
                .createdAt(document.getCreatedAt())
                .category(document.getCategory() == null ? null
                        : DocumentDetailResponse.CategoryInfo.builder()
                                .id(document.getCategory().getId())
                                .code(document.getCategory().getCode())
                                .name(document.getCategory().getName())
                                .build())
                .course(document.getCourse() == null ? null
                        : DocumentDetailResponse.CourseInfo.builder()
                                .id(document.getCourse().getId())
                                .code(document.getCourse().getCode())
                                .name(document.getCourse().getName())
                                .major(document.getCourse().getMajor() == null ? null
                                        : DocumentDetailResponse.MajorInfo.builder()
                                                .id(document.getCourse().getMajor().getId())
                                                .code(document.getCourse().getMajor().getCode())
                                                .name(document.getCourse().getMajor().getName())
                                                .school(document.getCourse().getMajor().getSchool() == null ? null
                                                        : DocumentDetailResponse.SchoolInfo.builder()
                                                                .id(document.getCourse().getMajor().getSchool().getId())
                                                                .code(document.getCourse().getMajor().getSchool()
                                                                        .getCode())
                                                                .name(document.getCourse().getMajor().getSchool()
                                                                        .getName())
                                                                .build())
                                                .build())
                                .build())
                .uploadedBy(DocumentDetailResponse.UserInfo.builder()
                        .id(document.getUploadedBy() == null ? null : document.getUploadedBy().getId())
                        .username(document.getUploadedBy() == null ? null : document.getUploadedBy().getUsername())
                        .email(document.getUploadedBy() == null ? null : document.getUploadedBy().getEmail())
                        .roleName(document.getUploadedBy() == null || document.getUploadedBy().getRole() == null ? null
                                : document.getUploadedBy().getRole().getName())
                        .build())
                .tags(document.getTags() == null
                        ? List.of()
                        : document.getTags().stream()
                                .map(Tag::getName)
                                .sorted(String::compareToIgnoreCase)
                                .toList())
                .averageRating(avgRating)
                .reviewCount(revCount)
                .currentVersionNumber(document.getCurrentVersionNumber() != null ? document.getCurrentVersionNumber() : "v1.0")
                .versions(getDocumentVersions(document.getId()))
                .hasPendingVersion(documentVersionRepository.existsByDocumentIdAndStatus(document.getId(), com.example.keeper.systems.document.enums.VersionStatus.PENDING_APPROVAL))
                .build();
    }

    private DocumentResponse mapToResponse(Document document) {
        String previewUrl = resolvePreviewUrl(document);
        String downloadUrl = resolveDownloadUrl(document);
        String resourceType = resolveResourceType(document);

        Double avgRating = 0.0;
        Integer revCount = 0;
        if (document.getReviews() != null && !document.getReviews().isEmpty()) {
            double sum = 0;
            for (com.example.keeper.systems.document.entity.DocumentReview r : document.getReviews()) {
                sum += r.getRating();
            }
            avgRating = sum / document.getReviews().size();
            revCount = document.getReviews().size();
        }

        return DocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .description(document.getDescription())
                .uploadedBy(document.getUploadedBy() == null ? null
                        : DocumentResponse.UserInfo.builder()
                                .id(document.getUploadedBy().getId())
                                .username(document.getUploadedBy().getUsername())
                                .email(document.getUploadedBy().getEmail())
                                .roleName(document.getUploadedBy().getRole() == null ? null
                                        : document.getUploadedBy().getRole().getName())
                                .build())
                .fileType(resolveFileType(document))
                .resourceType(resourceType)
                .previewUrl(previewUrl)
                .downloadUrl(downloadUrl)
                .mimeType(document.getMimeType())
                .visibility(document.getVisibility() == null
                        ? null
                        : document.getVisibility().name())
                .aiParseStatus(document.getAiParseStatus() == null
                        ? null
                        : document.getAiParseStatus().name())
                .downloadCount(document.getDownloadCount())
                .viewCount(document.getViewCount() != null ? document.getViewCount() : 0)
                .createdAt(document.getCreatedAt())
                .course(document.getCourse() == null ? null
                        : DocumentResponse.CourseInfo.builder()
                                .id(document.getCourse().getId())
                                .code(document.getCourse().getCode())
                                .name(document.getCourse().getName())
                                .major(document.getCourse().getMajor() == null ? null
                                        : DocumentResponse.MajorInfo.builder()
                                                .id(document.getCourse().getMajor().getId())
                                                .code(document.getCourse().getMajor().getCode())
                                                .name(document.getCourse().getMajor().getName())
                                                .school(document.getCourse().getMajor().getSchool() == null ? null
                                                        : DocumentResponse.SchoolInfo.builder()
                                                                .id(document.getCourse().getMajor().getSchool().getId())
                                                                .code(document.getCourse().getMajor().getSchool()
                                                                        .getCode())
                                                                .name(document.getCourse().getMajor().getSchool()
                                                                        .getName())
                                                                .build())
                                                .build())
                                .build())
                .tags(document.getTags() == null
                        ? List.of()
                        : document.getTags().stream()
                                .map(Tag::getName)
                                .sorted(String::compareToIgnoreCase)
                                .toList())
                .averageRating(avgRating)
                .reviewCount(revCount)
                .hasPendingVersion(documentVersionRepository.existsByDocumentIdAndStatus(document.getId(), com.example.keeper.systems.document.enums.VersionStatus.PENDING_APPROVAL))
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

    private AiParseStatus resolveAiParseStatus(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            return AiParseStatus.UNSUPPORTED;
        }

        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".doc") 
                || lower.endsWith(".pptx") || lower.endsWith(".ppt")
                || lower.endsWith(".txt") || lower.endsWith(".csv") || lower.endsWith(".md") || lower.endsWith(".json")) {
            return AiParseStatus.PENDING;
        }

        return AiParseStatus.UNSUPPORTED;
    }

    private AiParseStatus resolveAiParseStatusFromFilename(String filename) {
        if (filename == null) {
            return AiParseStatus.UNSUPPORTED;
        }

        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".doc")
                || lower.endsWith(".pptx") || lower.endsWith(".ppt")
                || lower.endsWith(".txt") || lower.endsWith(".csv") || lower.endsWith(".md") || lower.endsWith(".json")) {
            return AiParseStatus.PENDING;
        }

        return AiParseStatus.UNSUPPORTED;
    }

    private String sanitizeFilename(String filename) {

        if (filename == null) {
            return "Untitled";
        }

        return Normalizer.normalize(repairMojibakeIfNeeded(filename), Normalizer.Form.NFC);
    }

    private String sanitizeOptionalFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }

        return Normalizer.normalize(repairMojibakeIfNeeded(filename), Normalizer.Form.NFC);
    }

    private String repairMojibakeIfNeeded(String value) {
        if (!looksLikeMojibake(value)) {
            return value;
        }

        String repaired = repairMojibake(value, StandardCharsets.ISO_8859_1);
        if (isBetterFilenameCandidate(value, repaired)) {
            return repaired;
        }

        repaired = repairMojibake(value, Charset.forName("windows-1252"));
        if (isBetterFilenameCandidate(value, repaired)) {
            return repaired;
        }

        repaired = repairMojibake(value.replace("Ã ", "Ã "), Charset.forName("windows-1252"));
        if (isBetterFilenameCandidate(value, repaired)) {
            return repaired;
        }

        return value;
    }

    private boolean looksLikeMojibake(String value) {
        return value.contains("Ã")
                || value.contains("Â")
                || value.contains("�")
                || value.contains("Ä‘")
                || value.contains("Æ°")
                || value.contains("Æ¡")
                || value.contains("áº")
                || value.contains("á»");
    }

    private String repairMojibake(String value, Charset sourceCharset) {
        try {
            return new String(
                    value.getBytes(sourceCharset),
                    StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value;
        }
    }

    private boolean isBetterFilenameCandidate(String original, String candidate) {
        return candidate != null
                && !candidate.isBlank()
                && !candidate.equals(original)
                && !candidate.contains("�")
                && mojibakeMarkerCount(candidate) < mojibakeMarkerCount(original);
    }

    private int mojibakeMarkerCount(String value) {
        int count = 0;
        String[] markers = { "Ã", "Â", "�", "Ä‘", "Æ°", "Æ¡", "áº", "á»" };
        for (String marker : markers) {
            int index = value.indexOf(marker);
            while (index >= 0) {
                count++;
                index = value.indexOf(marker, index + marker.length());
            }
        }
        return count;
    }

    @Override
    public String getDownloadUrl(UUID id, String email) {
        Document document = getById(id);
        checkDocumentAccess(document, email);

        // Increment download count by 1
        int currentCount = document.getDownloadCount() != null ? document.getDownloadCount() : 0;
        document.setDownloadCount(currentCount + 1);
        documentRepository.save(document);

        String downloadUrl = resolveDownloadUrl(document);
        if (downloadUrl == null || downloadUrl.isBlank()) {
            return document.getFileUrl();
        }

        return downloadUrl;
    }

    @Override
    public List<DocumentResponse> getMyFavorites(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Return list of favorited documents
        return user.getFavoriteDocuments().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void toggleFavorite(UUID documentId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Document document = getById(documentId);

        // Toggle favorite: remove if exists, otherwise add
        if (user.getFavoriteDocuments().contains(document)) {
            user.getFavoriteDocuments().remove(document);
        } else {
            user.getFavoriteDocuments().add(document);
        }

        userRepository.save(user);
    }

    private void notifyFollowers(Document document) {
        try {
            if (document.getUploadedBy() == null)
                return;
            User uploader = document.getUploadedBy();
            UUID creatorId = uploader.getId();
            String creatorName = uploader.getUsername() != null
                    ? uploader.getUsername()
                    : uploader.getEmail();

            Set<UUID> notifiedUserIds = new HashSet<>();
            notifiedUserIds.add(creatorId); // Exclude uploader from self-notification

            // 1. Notify users following the document creator
            List<com.example.keeper.systems.follow.entity.UserFollow> followers = userFollowRepository
                    .findByFollowingId(creatorId);

            for (com.example.keeper.systems.follow.entity.UserFollow follow : followers) {
                User follower = follow.getFollower();
                if (follower != null && notifiedUserIds.add(follower.getId())) {
                    notificationService.createNotification(
                            follower,
                            uploader,
                            com.example.keeper.systems.notification.enums.NotificationType.NEW_DOCUMENT,
                            "New Document Uploaded",
                            creatorName + " uploaded a new document: " + document.getTitle(),
                            document.getId(),
                            com.example.keeper.systems.notification.enums.ReferenceType.DOCUMENT);
                }
            }

            // 2. Notify users following the Course (if document is linked to a course)
            if (document.getCourse() != null) {
                Course course = document.getCourse();
                List<User> courseFollowers = userRepository.findUsersByFollowedCourseId(course.getId());
                String courseLabel = course.getCode() != null ? course.getCode() : course.getName();

                for (User follower : courseFollowers) {
                    if (follower != null && notifiedUserIds.add(follower.getId())) {
                        notificationService.createNotification(
                                follower,
                                uploader,
                                com.example.keeper.systems.notification.enums.NotificationType.NEW_DOCUMENT,
                                "New Document in Followed Course",
                                "New document '" + document.getTitle() + "' was uploaded in course " + courseLabel,
                                document.getId(),
                                com.example.keeper.systems.notification.enums.ReferenceType.DOCUMENT);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to notify followers for new document upload", e);
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public DocumentDetailResponse update(UUID id, UpdateDocumentRequest request) {
        Document document = getById(id);

        // Owner or Admin validation
        String currentUserEmail = getCurrentUserEmail();
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Logged in user not found!"));

        boolean isAdmin = user.getRole() != null &&
                (user.getRole().getName().equalsIgnoreCase("ADMIN") ||
                        user.getRole().getName().equalsIgnoreCase("ROLE_ADMIN"));

        boolean isOwner = document.getUploadedBy() != null &&
                document.getUploadedBy().getId().equals(user.getId());

        boolean uploaderIsAdmin = document.getUploadedBy() != null &&
                document.getUploadedBy().getRole() != null &&
                (document.getUploadedBy().getRole().getName().equalsIgnoreCase("ADMIN") ||
                        document.getUploadedBy().getRole().getName().equalsIgnoreCase("ROLE_ADMIN"));

        boolean canEdit = isOwner || (isAdmin && !uploaderIsAdmin);

        if (!canEdit) {
            throw new RuntimeException("You do not have permission to edit this document!");
        }

        // Update properties
        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            document.setTitle(request.getTitle().trim());
        }
        document.setDescription(request.getDescription());

        // Validate visibility change to PUBLIC if latest version is PENDING_APPROVAL
        if (request.getVisibility() == com.example.keeper.systems.document.enums.Visibility.PUBLIC && !isAdmin) {
            List<DocumentVersion> versions = documentVersionRepository.findByDocumentIdOrderByCreatedAtDesc(document.getId());
            if (!versions.isEmpty()) {
                DocumentVersion latestVersion = versions.get(0);
                if (latestVersion.getStatus() == com.example.keeper.systems.document.enums.VersionStatus.PENDING_APPROVAL) {
                    throw new IllegalArgumentException("Cannot change document visibility to PUBLIC because the latest version ("
                            + latestVersion.getVersionNumber() + ") is pending Admin approval.");
                }
            }
        }
        document.setVisibility(request.getVisibility());

        // Category mapping
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            document.setCategory(category);
        } else {
            document.setCategory(null);
        }

        // Course resolution
        if (request.getCourseId() != null) {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            document.setCourse(course);
        } else {
            String courseCode = safeTrim(request.getCourseCode());
            if (courseCode != null) {
                Course course;
                if (request.getMajorId() != null) {
                    course = courseRepository.findByMajorIdAndCode(request.getMajorId(), courseCode)
                            .orElseGet(() -> {
                                String courseName = safeTrim(request.getCourseName());
                                if (courseName == null) {
                                    throw new IllegalArgumentException("Course name is required for new course code");
                                }

                                com.example.keeper.systems.major.entity.Major major = majorRepository
                                        .findById(request.getMajorId())
                                        .orElseThrow(() -> new RuntimeException("Major not found"));

                                Course newCourse = new Course();
                                newCourse.setCode(courseCode);
                                newCourse.setName(courseName);
                                newCourse.setDescription(null);
                                newCourse.setMajor(major);
                                return courseRepository.save(newCourse);
                            });
                } else {
                    course = courseRepository.findByCode(courseCode)
                            .orElseGet(() -> {
                                String courseName = safeTrim(request.getCourseName());
                                if (courseName == null) {
                                    throw new IllegalArgumentException("Course name is required for new course code");
                                }

                                Course newCourse = new Course();
                                newCourse.setCode(courseCode);
                                newCourse.setName(courseName);
                                newCourse.setDescription(null);
                                return courseRepository.save(newCourse);
                            });
                }
                document.setCourse(course);
            } else {
                document.setCourse(null);
            }
        }

        // Tags resolution
        java.util.Set<Tag> tags = new java.util.HashSet<>();
        if (request.getTagNames() != null && !request.getTagNames().isEmpty()) {
            for (String rawName : request.getTagNames()) {
                String name = safeTrim(rawName);
                if (name == null) {
                    continue;
                }

                Tag tag = tagRepository.findByNameIgnoreCase(name)
                        .orElseGet(() -> tagRepository.save(new Tag(name)));
                tags.add(tag);
            }
        }
        document.setTags(tags);

        Document savedDoc = documentRepository.save(document);
        return mapToDetail(savedDoc);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void reportDocument(UUID documentId, DocumentReportRequest request, String reporterEmail) {
        Document document = getById(documentId);
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new RuntimeException("Reporter not found"));

        if (document.getUploadedBy().getId().equals(reporter.getId())) {
            throw new IllegalArgumentException("You cannot report your own document");
        }

        DocumentReport report = new DocumentReport();
        report.setDocument(document);
        report.setReporter(reporter);
        report.setReason(request.getReason());
        report.setStatus("PENDING");

        documentReportRepository.save(report);
    }

    @Override
    public List<DocumentReportResponse> getAllReports() {
        return documentReportRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(report -> DocumentReportResponse.builder()
                        .id(report.getId())
                        .documentId(report.getDocument().getId())
                        .documentTitle(report.getDocument().getTitle())
                        .uploaderId(report.getDocument().getUploadedBy().getId())
                        .uploaderUsername(report.getDocument().getUploadedBy().getUsername())
                        .uploaderEmail(report.getDocument().getUploadedBy().getEmail())
                        .isUploaderBanned(report.getDocument().getUploadedBy().isBanned())
                        .reporterId(report.getReporter().getId())
                        .reporterUsername(report.getReporter().getUsername())
                        .reporterEmail(report.getReporter().getEmail())
                        .reason(report.getReason())
                        .status(report.getStatus())
                        .createdAt(report.getCreatedAt())
                        .build())
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void resolveReport(UUID reportId, String status) {
        DocumentReport report = documentReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus(status);
        documentReportRepository.save(report);
    }

    @Override
    public boolean checkDuplicate(String fileName, Long fileSize, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return documentRepository.existsByOriginalFileNameAndFileSizeAndUploadedById(fileName, fileSize, user.getId());
    }

    // =========================
    // FEATURE: DOCUMENT VERSIONING
    // =========================

    @Override
    @org.springframework.transaction.annotation.Transactional
    public DocumentVersion uploadNewVersion(UUID documentId, MultipartFile file, String changelog, String email) {
        if (changelog == null || changelog.trim().length() < 5) {
            throw new IllegalArgumentException("Changelog is required and must be at least 5 characters long.");
        }

        validateSupportedFileFormat(file);
        User uploader = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Document document = getById(documentId);
        checkDocumentAccess(document, email);

        // Extension check against original document format
        String docOriginal = document.getOriginalFileName();
        String docExt = "";
        if (docOriginal != null && docOriginal.contains(".")) {
            docExt = docOriginal.substring(docOriginal.lastIndexOf('.') + 1).toLowerCase();
        }

        String inputFilename = file.getOriginalFilename();
        String inputExt = "";
        if (inputFilename != null && inputFilename.contains(".")) {
            inputExt = inputFilename.substring(inputFilename.lastIndexOf('.') + 1).toLowerCase();
        }

        if (!docExt.isEmpty() && !inputExt.isEmpty() && !docExt.equalsIgnoreCase(inputExt)) {
            throw new IllegalArgumentException("The new version must have the same file format as the original document (." + docExt + ").");
        }

        documentQuotaService.validateVersionUpload(email, file.getSize());

        String versionFolder = getUserFolderName(uploader);
        FileUploadResult uploadResult = fileStorageService.uploadFile(file, versionFolder);
        String fileUrl = uploadResult.getSecureUrl();
        String publicId = uploadResult.getPublicId();
        String resourceType = uploadResult.getResourceType();

        List<DocumentVersion> existingVersions = documentVersionRepository.findByDocumentIdOrderByCreatedAtDesc(documentId);
        int nextVersionNum = existingVersions.size() + 1;
        String newVersionStr = "v" + nextVersionNum + ".0";

        String originalFilename = sanitizeFilename(uploadResult.getOriginalFileName());
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }

        boolean isAdmin = uploader.getRole() != null && "ADMIN".equalsIgnoreCase(uploader.getRole().getName());

        // Any non-admin upload for new version (whether document is PUBLIC or PRIVATE) gets PENDING_APPROVAL
        com.example.keeper.systems.document.enums.VersionStatus versionStatus = isAdmin ?
                com.example.keeper.systems.document.enums.VersionStatus.APPROVED :
                com.example.keeper.systems.document.enums.VersionStatus.PENDING_APPROVAL;

        DocumentVersion newVersion = new DocumentVersion();
        newVersion.setDocument(document);
        newVersion.setVersionNumber(newVersionStr);
        newVersion.setFileUrl(fileUrl);
        newVersion.setCloudinaryPublicId(publicId);
        newVersion.setMimeType(uploadResult.getMimeType());
        newVersion.setResourceType(resourceType);
        newVersion.setOriginalFileName(originalFilename);
        newVersion.setFileSize(file.getSize());
        newVersion.setChangelog(changelog.trim());
        newVersion.setStatus(versionStatus);
        newVersion.setUploadedBy(uploader);
        DocumentVersion savedVersion = documentVersionRepository.save(newVersion);

        if (versionStatus == com.example.keeper.systems.document.enums.VersionStatus.APPROVED) {
            // Clean up old AI chunks before processing new version
            try {
                documentChunkRepository.deleteByDocumentId(documentId);
            } catch (Exception e) {
                log.warn("Failed to delete old AI chunks for document {}: {}", documentId, e.getMessage());
            }

            // Update Document active file fields directly
            document.setFileUrl(fileUrl);
            document.setCloudinaryPublicId(publicId);
            document.setMimeType(uploadResult.getMimeType());
            document.setFileSize(file.getSize());
            document.setResourceType(resourceType);
            document.setOriginalFileName(originalFilename);
            document.setCurrentVersionNumber(newVersionStr);
            document.setPreviewUrl(fileStorageService.generatePreviewUrl(publicId, resourceType, extension));
            document.setDownloadUrl(fileStorageService.generateDownloadUrl(publicId, resourceType, extension));

            AiParseStatus parseStatus = resolveAiParseStatus(file);
            document.setAiParseStatus(parseStatus);

            byte[] fileBytes = null;
            String parserFilename = file.getOriginalFilename();
            String parserContentType = file.getContentType();
            if (parseStatus == AiParseStatus.PENDING) {
                try {
                    fileBytes = file.getBytes();
                } catch (IOException e) {
                    log.warn("Failed to copy document bytes for async parsing version: {}", e.getMessage());
                    document.setAiParseStatus(AiParseStatus.FAILED);
                }
            }

            Document savedDoc = documentRepository.save(document);

            if (savedDoc.getAiParseStatus() == AiParseStatus.PENDING && fileBytes != null) {
                byte[] stableBytes = fileBytes;
                java.util.concurrent.CompletableFuture.runAsync(() -> {
                    boolean parsed = documentParserService.parseAndChunkDocument(stableBytes, parserFilename, parserContentType, savedDoc.getId());
                    documentRepository.findById(savedDoc.getId()).ifPresent(d -> {
                        d.setAiParseStatus(parsed ? AiParseStatus.READY : AiParseStatus.FAILED);
                        documentRepository.save(d);
                    });
                });
            }
        } else {
            // Notify System Admins about pending version approval
            try {
                String uploaderName = uploader.getUsername() != null ? uploader.getUsername() : uploader.getEmail();
                List<User> admins = userRepository.findAllAdmins();
                for (User admin : admins) {
                    if (!admin.getId().equals(uploader.getId())) {
                        notificationService.createNotification(
                                admin,
                                uploader,
                                com.example.keeper.systems.notification.enums.NotificationType.DOCUMENT_VERSION_PENDING,
                                "New Version Pending Approval",
                                uploaderName + " uploaded version " + newVersionStr + " for document '" + document.getTitle() + "' requiring approval.",
                                document.getId(),
                                com.example.keeper.systems.notification.enums.ReferenceType.DOCUMENT
                        );
                    }
                }
            } catch (Exception e) {
                log.error("Failed to notify admins about pending version", e);
            }

            // Also notify Document Owner if uploaded by another user
            if (document.getUploadedBy() != null && !document.getUploadedBy().getId().equals(uploader.getId())) {
                try {
                    String uploaderName = uploader.getUsername() != null ? uploader.getUsername() : uploader.getEmail();
                    notificationService.createNotification(
                            document.getUploadedBy(),
                            uploader,
                            com.example.keeper.systems.notification.enums.NotificationType.DOCUMENT_VERSION_PENDING,
                            "New Version Pending Approval",
                            uploaderName + " uploaded a new version (" + newVersionStr + ") for your document: " + document.getTitle(),
                            document.getId(),
                            com.example.keeper.systems.notification.enums.ReferenceType.DOCUMENT
                    );
                } catch (Exception e) {
                    log.error("Failed to notify document owner about pending version", e);
                }
            }
        }

        return savedVersion;
    }

    @Override
    public List<DocumentVersionResponse> getDocumentVersions(UUID documentId) {
        return documentVersionRepository.findByDocumentIdOrderByCreatedAtDesc(documentId)
                .stream()
                .map(v -> {
                    String ext = "";
                    if (v.getOriginalFileName() != null && v.getOriginalFileName().contains(".")) {
                        ext = v.getOriginalFileName().substring(v.getOriginalFileName().lastIndexOf('.') + 1).toLowerCase();
                    }
                    String pUrl = (v.getCloudinaryPublicId() != null && !v.getCloudinaryPublicId().isBlank()) ?
                            fileStorageService.generatePreviewUrl(v.getCloudinaryPublicId(), v.getResourceType(), ext) :
                            v.getFileUrl();

                    return DocumentVersionResponse.builder()
                            .id(v.getId())
                            .documentId(v.getDocument().getId())
                            .versionNumber(v.getVersionNumber())
                            .fileUrl(v.getFileUrl())
                            .previewUrl(pUrl)
                            .originalFileName(v.getOriginalFileName())
                            .fileSize(v.getFileSize())
                            .mimeType(v.getMimeType())
                            .changelog(v.getChangelog())
                            .status(v.getStatus())
                            .rejectionReason(v.getRejectionReason())
                            .uploaderId(v.getUploadedBy() != null ? v.getUploadedBy().getId() : null)
                            .uploaderName(v.getUploadedBy() != null ? (v.getUploadedBy().getUsername() != null ? v.getUploadedBy().getUsername() : v.getUploadedBy().getEmail()) : "N/A")
                            .createdAt(v.getCreatedAt())
                            .build();
                })
                .toList();
    }

    @Override
    public String getDownloadUrlForVersion(UUID documentId, UUID versionId, String email) {
        Document document = getById(documentId);
        checkDocumentAccess(document, email);

        DocumentVersion version = documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        if (!version.getDocument().getId().equals(documentId)) {
            throw new IllegalArgumentException("Version does not belong to specified document");
        }

        int currentCount = document.getDownloadCount() != null ? document.getDownloadCount() : 0;
        document.setDownloadCount(currentCount + 1);
        documentRepository.save(document);

        if (version.getCloudinaryPublicId() != null && !version.getCloudinaryPublicId().isBlank()) {
            String resourceType = version.getResourceType() != null ? version.getResourceType() : "raw";
            String ext = "";
            if (version.getOriginalFileName() != null && version.getOriginalFileName().contains(".")) {
                ext = version.getOriginalFileName().substring(version.getOriginalFileName().lastIndexOf('.') + 1);
            }
            return fileStorageService.generateDownloadUrl(version.getCloudinaryPublicId(), resourceType, ext);
        }

        return version.getFileUrl();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public DocumentVersionResponse approveVersion(UUID documentId, UUID versionId, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Document document = getById(documentId);

        boolean isAdmin = currentUser.getRole() != null && "ADMIN".equalsIgnoreCase(currentUser.getRole().getName());

        if (!isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("System Admin approval is required for version updates.");
        }

        DocumentVersion version = documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        if (!version.getDocument().getId().equals(documentId)) {
            throw new IllegalArgumentException("Version does not belong to specified document");
        }

        version.setStatus(com.example.keeper.systems.document.enums.VersionStatus.APPROVED);
        version.setRejectionReason(null);
        DocumentVersion savedVersion = documentVersionRepository.save(version);

        // Clean up old AI chunks before approving new active version
        try {
            documentChunkRepository.deleteByDocumentId(documentId);
        } catch (Exception e) {
            log.warn("Failed to delete old AI chunks on version approval for document {}: {}", documentId, e.getMessage());
        }

        // Update Document active file fields
        String extension = "";
        if (version.getOriginalFileName() != null && version.getOriginalFileName().contains(".")) {
            extension = version.getOriginalFileName().substring(version.getOriginalFileName().lastIndexOf('.') + 1).toLowerCase();
        }

        document.setFileUrl(version.getFileUrl());
        document.setCloudinaryPublicId(version.getCloudinaryPublicId());
        document.setMimeType(version.getMimeType());
        document.setFileSize(version.getFileSize());
        document.setResourceType(version.getResourceType());
        document.setOriginalFileName(version.getOriginalFileName());
        document.setCurrentVersionNumber(version.getVersionNumber());
        if (version.getCloudinaryPublicId() != null) {
            document.setPreviewUrl(fileStorageService.generatePreviewUrl(version.getCloudinaryPublicId(), version.getResourceType(), extension));
            document.setDownloadUrl(fileStorageService.generateDownloadUrl(version.getCloudinaryPublicId(), version.getResourceType(), extension));
        }

        AiParseStatus parseStatus = resolveAiParseStatusFromFilename(version.getOriginalFileName());
        document.setAiParseStatus(parseStatus);
        Document savedDoc = documentRepository.save(document);

        if (parseStatus == AiParseStatus.PENDING && version.getFileUrl() != null) {
            String vOriginalFileName = version.getOriginalFileName();
            String vMimeType = version.getMimeType();
            String vFileUrl = version.getFileUrl();
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    byte[] fileBytes = new java.net.URL(vFileUrl).openStream().readAllBytes();
                    boolean parsed = documentParserService.parseAndChunkDocument(
                            fileBytes,
                            vOriginalFileName,
                            vMimeType,
                            savedDoc.getId()
                    );
                    documentRepository.findById(savedDoc.getId()).ifPresent(d -> {
                        d.setAiParseStatus(parsed ? AiParseStatus.READY : AiParseStatus.FAILED);
                        documentRepository.save(d);
                    });
                } catch (Exception e) {
                    log.error("Failed to parse document async for approved version {}: {}", savedDoc.getId(), e.getMessage());
                    documentRepository.findById(savedDoc.getId()).ifPresent(d -> {
                        d.setAiParseStatus(AiParseStatus.FAILED);
                        documentRepository.save(d);
                    });
                }
            });
        }

        // Notify version uploader
        if (version.getUploadedBy() != null && !version.getUploadedBy().getId().equals(currentUser.getId())) {
            try {
                notificationService.createNotification(
                        version.getUploadedBy(),
                        currentUser,
                        com.example.keeper.systems.notification.enums.NotificationType.DOCUMENT_VERSION_APPROVED,
                        "Version Approved",
                        "Your version " + version.getVersionNumber() + " for document '" + document.getTitle() + "' has been approved!",
                        document.getId(),
                        com.example.keeper.systems.notification.enums.ReferenceType.DOCUMENT
                );
            } catch (Exception e) {
                log.error("Failed to notify uploader about approved version", e);
            }
        }

        return DocumentVersionResponse.builder()
                .id(savedVersion.getId())
                .documentId(savedVersion.getDocument().getId())
                .versionNumber(savedVersion.getVersionNumber())
                .fileUrl(savedVersion.getFileUrl())
                .originalFileName(savedVersion.getOriginalFileName())
                .fileSize(savedVersion.getFileSize())
                .mimeType(savedVersion.getMimeType())
                .changelog(savedVersion.getChangelog())
                .status(savedVersion.getStatus())
                .rejectionReason(savedVersion.getRejectionReason())
                .uploaderId(savedVersion.getUploadedBy() != null ? savedVersion.getUploadedBy().getId() : null)
                .uploaderName(savedVersion.getUploadedBy() != null ? (savedVersion.getUploadedBy().getUsername() != null ? savedVersion.getUploadedBy().getUsername() : savedVersion.getUploadedBy().getEmail()) : "N/A")
                .createdAt(savedVersion.getCreatedAt())
                .build();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public DocumentVersionResponse rejectVersion(UUID documentId, UUID versionId, String reason, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Document document = getById(documentId);

        boolean isOwner = document.getUploadedBy() != null && document.getUploadedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() != null && "ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
        boolean isPublic = document.getVisibility() == com.example.keeper.systems.document.enums.Visibility.PUBLIC;

        if (isPublic && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Public document version updates require System Admin approval.");
        } else if (!isPublic && !isOwner && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Only the document owner can reject version updates.");
        }

        DocumentVersion version = documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));

        if (!version.getDocument().getId().equals(documentId)) {
            throw new IllegalArgumentException("Version does not belong to specified document");
        }

        version.setStatus(com.example.keeper.systems.document.enums.VersionStatus.REJECTED);
        version.setRejectionReason(reason != null ? reason.trim() : null);
        DocumentVersion savedVersion = documentVersionRepository.save(version);

        // Notify version uploader
        if (version.getUploadedBy() != null && !version.getUploadedBy().getId().equals(currentUser.getId())) {
            try {
                String msg = "Your version " + version.getVersionNumber() + " for document '" + document.getTitle() + "' was rejected";
                if (reason != null && !reason.isBlank()) {
                    msg += ": " + reason.trim();
                }
                notificationService.createNotification(
                        version.getUploadedBy(),
                        currentUser,
                        com.example.keeper.systems.notification.enums.NotificationType.DOCUMENT_VERSION_REJECTED,
                        "Version Rejected",
                        msg,
                        document.getId(),
                        com.example.keeper.systems.notification.enums.ReferenceType.DOCUMENT
                );
            } catch (Exception e) {
                log.error("Failed to notify uploader about rejected version", e);
            }
        }

        return DocumentVersionResponse.builder()
                .id(savedVersion.getId())
                .documentId(savedVersion.getDocument().getId())
                .versionNumber(savedVersion.getVersionNumber())
                .fileUrl(savedVersion.getFileUrl())
                .originalFileName(savedVersion.getOriginalFileName())
                .fileSize(savedVersion.getFileSize())
                .mimeType(savedVersion.getMimeType())
                .changelog(savedVersion.getChangelog())
                .status(savedVersion.getStatus())
                .rejectionReason(savedVersion.getRejectionReason())
                .uploaderId(savedVersion.getUploadedBy() != null ? savedVersion.getUploadedBy().getId() : null)
                .uploaderName(savedVersion.getUploadedBy() != null ? (savedVersion.getUploadedBy().getUsername() != null ? savedVersion.getUploadedBy().getUsername() : savedVersion.getUploadedBy().getEmail()) : "N/A")
                .createdAt(savedVersion.getCreatedAt())
                .build();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteVersion(UUID documentId, UUID versionId, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Document document = getById(documentId);

        boolean isOwner = document.getUploadedBy() != null && document.getUploadedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() != null && "ADMIN".equalsIgnoreCase(currentUser.getRole().getName());

        if (!isOwner && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to delete this document version.");
        }

        DocumentVersion version = documentVersionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Document version not found."));

        if (!version.getDocument().getId().equals(documentId)) {
            throw new IllegalArgumentException("Version does not belong to this document.");
        }

        // Prevent deleting active version
        boolean isActiveVersion = false;
        if (document.getCurrentVersionNumber() != null && document.getCurrentVersionNumber().equalsIgnoreCase(version.getVersionNumber())) {
            isActiveVersion = true;
        } else if (document.getCloudinaryPublicId() != null && document.getCloudinaryPublicId().equals(version.getCloudinaryPublicId())) {
            isActiveVersion = true;
        }

        if (isActiveVersion) {
            throw new IllegalArgumentException("Cannot delete the Active Version.");
        }

        // Delete from Cloudinary
        if (version.getCloudinaryPublicId() != null && !version.getCloudinaryPublicId().isBlank()) {
            try {
                fileStorageService.deleteFile(version.getCloudinaryPublicId(), version.getResourceType());
            } catch (Exception e) {
                log.error("Failed to delete file on Cloudinary for version {}", versionId, e);
            }
        }

        documentVersionRepository.delete(version);
    }

    private void validateSupportedFileFormat(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty.");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("Supported file formats: .pdf, .doc, .docx, .ppt, .pptx");
        }
        String lower = originalFilename.toLowerCase();
        boolean isSupported = lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx")
                || lower.endsWith(".ppt") || lower.endsWith(".pptx");
        if (!isSupported) {
            throw new IllegalArgumentException("Supported file formats: .pdf, .doc, .docx, .ppt, .pptx");
        }

        // Validate actual binary Magic Bytes to prevent extension spoofing (e.g. renaming .txt to .pdf or .docx)
        try {
            byte[] header = new byte[8];
            try (java.io.InputStream is = file.getInputStream()) {
                int bytesRead = is.read(header, 0, header.length);
                if (bytesRead < 4) {
                    throw new IllegalArgumentException("Invalid or empty file content.");
                }
            }

            boolean isPdf = lower.endsWith(".pdf") && isPdfHeader(header);
            boolean isDocxOrPptx = (lower.endsWith(".docx") || lower.endsWith(".pptx")) && isZipHeader(header);
            boolean isDocOrPpt = (lower.endsWith(".doc") || lower.endsWith(".ppt")) && isOle2Header(header);

            if (!isPdf && !isDocxOrPptx && !isDocOrPpt) {
                throw new IllegalArgumentException("File content does not match extension (" 
                        + originalFilename + "). Please upload a genuine PDF, Word, or PowerPoint file!");
            }
        } catch (java.io.IOException e) {
            log.error("Failed to read magic bytes for file validation", e);
            throw new IllegalArgumentException("Failed to read file content for format validation.");
        }
    }

    private boolean isPdfHeader(byte[] header) {
        return header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46; // %PDF
    }

    private boolean isZipHeader(byte[] header) {
        return header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04; // PK\x03\x04
    }

    private boolean isOle2Header(byte[] header) {
        return (header[0] & 0xFF) == 0xD0 && (header[1] & 0xFF) == 0xCF
                && (header[2] & 0xFF) == 0x11 && (header[3] & 0xFF) == 0xE0;
    }

    private String getUserFolderName(User u) {
        if (u == null || u.getId() == null) {
            return "swp391/documents";
        }
        String displayName = u.getUsername();
        if (displayName == null || displayName.isBlank()) {
            displayName = u.getEmail() != null ? u.getEmail().split("@")[0] : "user";
        }
        String cleanName = Normalizer.normalize(displayName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9_-]", "_")
                .toLowerCase();
        if (cleanName.isBlank()) {
            cleanName = "user";
        }
        return "swp391/users/" + cleanName + "_" + u.getId() + "/documents";
    }
}
