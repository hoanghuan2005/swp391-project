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
        documentQuotaService.validateUpload(getCurrentUserEmail(), file.getSize());

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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user đăng nhập!"));

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
    @org.springframework.transaction.annotation.Transactional
    public Document delete(UUID id, String email) {

        Document document = getById(id);

        if (email != null) {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
            if (!document.getUploadedBy().getId().equals(user.getId()) && !isAdmin) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to delete this document.");
            }
        }

        fileStorageService.deleteFile(document.getCloudinaryPublicId(), resolveResourceType(document));

        documentViewRepository.deleteByDocumentId(document.getId());

        documentChunkRepository.deleteByDocumentId(document.getId());

        flashcardSetRepository.clearDocumentReference(document.getId());

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
                        .build())
                .tags(document.getTags() == null
                        ? List.of()
                        : document.getTags().stream()
                                .map(Tag::getName)
                                .sorted(String::compareToIgnoreCase)
                                .toList())
                .averageRating(avgRating)
                .reviewCount(revCount)
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
        if (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".pptx")) {
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

    @Override
    public List<DocumentResponse> getMyFavorites(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Trả về danh sách tài liệu mà user đã yêu thích
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

        // Kiểm tra nếu đã thích thì xóa, chưa thích thì thêm vào
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
            UUID creatorId = document.getUploadedBy().getId();
            String creatorName = document.getUploadedBy().getUsername() != null
                    ? document.getUploadedBy().getUsername()
                    : document.getUploadedBy().getEmail();

            List<com.example.keeper.systems.follow.entity.UserFollow> followers = userFollowRepository
                    .findByFollowingId(creatorId);

            for (com.example.keeper.systems.follow.entity.UserFollow follow : followers) {
                notificationService.createNotification(
                        follow.getFollower(),
                        document.getUploadedBy(),
                        com.example.keeper.systems.notification.enums.NotificationType.NEW_DOCUMENT,
                        "New Document Uploaded",
                        creatorName + " uploaded a new document: " + document.getTitle(),
                        document.getId(),
                        com.example.keeper.systems.notification.enums.ReferenceType.DOCUMENT);
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user đăng nhập!"));

        boolean isAdmin = user.getRole() != null &&
                (user.getRole().getName().equalsIgnoreCase("ADMIN") ||
                        user.getRole().getName().equalsIgnoreCase("ROLE_ADMIN"));

        boolean isOwner = document.getUploadedBy() != null &&
                document.getUploadedBy().getId().equals(user.getId());

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa tài liệu này!");
        }

        // Update properties
        document.setDescription(request.getDescription());
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
}
