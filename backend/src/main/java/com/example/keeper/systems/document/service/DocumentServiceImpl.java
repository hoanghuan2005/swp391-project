package com.example.keeper.systems.document.service;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.dto.request.CreateDocumentRequest;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.entity.DocumentView;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.document.repository.DocumentViewRepository;
import com.example.keeper.systems.subject.entity.Subject;
import com.example.keeper.systems.subject.repository.SubjectRepository;
import com.example.keeper.systems.tag.entity.Tag;
import com.example.keeper.systems.tag.repository.TagRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
    private final Cloudinary cloudinary;

    @Override
    public Document create(CreateDocumentRequest request) {
        Document document = buildDocument(request);
        document.setFileUrl(request.getFileUrl());
        return documentRepository.save(document);
    }

    @Override
    public Document uploadAndCreate(MultipartFile file, CreateDocumentRequest request) {
        Map<String, Object> uploadResult = uploadToCloudinary(file);
        String fileUrl = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");

        Document document = buildDocument(request);

        document.setFileUrl(fileUrl);
        document.setFilePublicId(publicId);
        document.setFileType(file.getContentType());
        document.setFileSize(file.getSize());

        if (document.getTitle() == null || document.getTitle().trim().isEmpty()) {
            document.setTitle(resolveTitle(file));
        }

        return documentRepository.save(document);
    }

    private Document buildDocument(CreateDocumentRequest request) {
        User user = userRepository.findById(request.getUploadedById())
                .orElseThrow();

        Subject subject = resolveSubject(request);

        Document document = new Document();

        document.setTitle(request.getTitle());
        document.setDescription(request.getDescription());
        document.setThumbnailUrl(request.getThumbnailUrl());
        document.setFileType(request.getFileType());
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

    private Map<String, Object> uploadToCloudinary(MultipartFile file) {
        try {

            String originalFilename = file.getOriginalFilename();

            // tách tên file và extension
            String fileName = originalFilename != null
                    ? originalFilename.substring(0, originalFilename.lastIndexOf("."))
                    : "file";

            // sanitize tên file
            String cleanFileName = fileName
                    .trim()
                    .toLowerCase()
                    .replaceAll("[^a-zA-Z0-9\\s-_]", "") // xóa ký tự đặc biệt
                    .replaceAll("\\s+", "-"); // space -> -

            // thêm timestamp tránh trùng tên
            String publicId = System.currentTimeMillis() + "-" + cleanFileName;

            return cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "documents",
                            "public_id", publicId,
                            "resource_type", "auto",
                            "use_filename", true,
                            "unique_filename", false,
                            "overwrite", false));

        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Failed to upload document to Cloudinary",
                    exception);
        }
    }

    private String resolveTitle(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            return "Untitled document";
        }

        int extensionIndex = originalName.lastIndexOf('.');
        return extensionIndex > 0 ? originalName.substring(0, extensionIndex) : originalName;
    }

    @Override
    public List<Document> getAll() {
        return documentRepository.findAll();
    }

    @Override
    public List<Document> getMyUploads(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return documentRepository.findByUploadedById(user.getId());
    }

    @Override
    public Document getById(UUID id) {
        return documentRepository.findById(id)
                .orElseThrow();
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

//    @Override
//    public List<Document> getRecommended(String email, int limit) {
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//        List<String> preferredLanguages = user.getPreferredLanguages()
//                .stream()
//                .map(value -> value == null ? "" : value.trim().toLowerCase())
//                .filter(value -> !value.isEmpty())
//                .collect(Collectors.toList());
//
//        if (user.isSurveyCompleted() && !preferredLanguages.isEmpty()) {
//            List<Document> matches = documentRepository.findByTagNames(preferredLanguages, PageRequest.of(0, limit));
//            if (!matches.isEmpty()) {
//                return matches;
//            }
//        }
//
//        return documentRepository.findTopByDownloadCount(PageRequest.of(0, limit));
//    }

    @Override
    public Document delete(UUID id) {

        Document document = getById(id);

        documentRepository.delete(document);

        return document;
    }
}
