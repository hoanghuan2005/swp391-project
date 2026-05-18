package com.example.keeper.systems.document.service.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final Cloudinary cloudinary;

    public FileUploadResult uploadFile(MultipartFile file, String folder) {
        String mimeType = file.getContentType();
        String resourceType = detectResourceType(mimeType);
        String originalFileName = file.getOriginalFilename();
        String safeFileName = sanitizeFileName(originalFileName);
        String extension = extractExtension(originalFileName);
        String publicId = safeFileName + "-" + UUID.randomUUID();
        if (!extension.isBlank()) {
            publicId = publicId + "." + extension;
        }

        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "public_id", publicId,
                            "resource_type", resourceType,
                            "use_filename", true,
                            "unique_filename", false,
                            "overwrite", false));

            return FileUploadResult.builder()
                    .publicId(uploadResult.get("public_id").toString())
                    .secureUrl(uploadResult.get("secure_url").toString())
                    .resourceType(uploadResult.get("resource_type") == null
                            ? resourceType
                            : uploadResult.get("resource_type").toString())
                    .originalFileName(originalFileName)
                    .mimeType(mimeType)
                    .build();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to upload document to Cloudinary", exception);
        }
    }

    public void deleteFile(String publicId, String resourceType) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap(
                            "resource_type", resourceType == null || resourceType.isBlank() ? "raw" : resourceType,
                            "invalidate", true));
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to delete file from Cloudinary", exception);
        }
    }

    public String generatePreviewUrl(
            String publicId,
            String resourceType,
            String extension) {

        if (publicId == null || publicId.isBlank()) {
            return null;
        }

        String source = publicId;
        if (extension != null && !extension.isBlank() && !publicId.endsWith("." + extension)) {
            source += "." + extension;
        }

        return cloudinary.url()
                .resourceType(
                        resourceType == null || resourceType.isBlank()
                                ? "raw"
                                : resourceType)
                .secure(true)
                .generate(source);
    }

    public String generateDownloadUrl(
            String publicId,
            String resourceType,
            String extension) {

        if (publicId == null || publicId.isBlank()) {
            return null;
        }

        String source = publicId;
        if (extension != null && !extension.isBlank() && !publicId.endsWith("." + extension)) {
            source += "." + extension;
        }

        return cloudinary.url()
                .resourceType(
                        resourceType == null || resourceType.isBlank()
                                ? "raw"
                                : resourceType)
                .secure(true)
                .generate(source);
    }

    public String detectResourceType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "raw";
        }

        if (contentType.startsWith("image/")) {
            return "image";
        }

        if (contentType.startsWith("video/")) {
            return "video";
        }

        return "raw";
    }

    public String sanitizeFileName(String fileName) {
        String safeName = fileName == null || fileName.isBlank() ? "file" : fileName;
        int extensionIndex = safeName.lastIndexOf('.');
        if (extensionIndex > 0) {
            safeName = safeName.substring(0, extensionIndex);
        }

        safeName = safeName
                .trim()
                .toLowerCase()
                .replaceAll("[^a-zA-Z0-9\\s-_]", "")
                .replaceAll("\\s+", "-");

        return safeName.isBlank() ? "file" : safeName;
    }

    private String extractExtension(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "";
        }

        int extensionIndex = fileName.lastIndexOf('.');
        if (extensionIndex < 0 || extensionIndex == fileName.length() - 1) {
            return "";
        }

        String extension = fileName.substring(extensionIndex + 1).trim().toLowerCase();
        extension = extension.replaceAll("[^a-z0-9]", "");
        return extension;
    }
}
