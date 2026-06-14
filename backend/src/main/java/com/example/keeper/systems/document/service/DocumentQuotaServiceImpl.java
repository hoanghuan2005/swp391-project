package com.example.keeper.systems.document.service;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.enums.SubscriptionTier;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.dto.response.DocumentQuotaResponse;
import com.example.keeper.systems.document.exception.DocumentQuotaExceededException;
import com.example.keeper.systems.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DocumentQuotaServiceImpl implements DocumentQuotaService {

    private static final long FREE_DAILY_UPLOAD_LIMIT = 3;
    private static final long FREE_TOTAL_DOCUMENT_LIMIT = 20;
    private static final long FREE_MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final long PRO_MAX_FILE_SIZE = 50L * 1024 * 1024;
    private static final long UNLIMITED = -1;

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;

    @Override
    public void validateUpload(String email, long fileSize) {
        User user = findUser(email);
        long maxFileSize = getMaxFileSize(user);

        if (fileSize > maxFileSize) {
            throw new DocumentQuotaExceededException(
                    "Maximum document file size is " + toMegabytes(maxFileSize) + "MB for your subscription tier.");
        }

        validateDocumentCount(user);

        if (user.getSubscriptionTier() == SubscriptionTier.FREE
                && getUploadsToday(user) >= FREE_DAILY_UPLOAD_LIMIT) {
            throw new DocumentQuotaExceededException("Daily document upload limit reached.");
        }
    }

    @Override
    public void validateDocumentCreation(String email) {
        validateDocumentCount(findUser(email));
    }

    @Override
    public DocumentQuotaResponse getQuota(String email) {
        User user = findUser(email);
        boolean pro = user.getSubscriptionTier() == SubscriptionTier.PRO;

        return DocumentQuotaResponse.builder()
                .subscriptionTier(user.getSubscriptionTier().name())
                .uploadsToday(getUploadsToday(user))
                .dailyUploadLimit(pro ? UNLIMITED : FREE_DAILY_UPLOAD_LIMIT)
                .totalDocuments(documentRepository.countByUploadedById(user.getId()))
                .totalDocumentLimit(pro ? UNLIMITED : FREE_TOTAL_DOCUMENT_LIMIT)
                .maxFileSizeBytes(getMaxFileSize(user))
                .build();
    }

    private void validateDocumentCount(User user) {
        if (user.getSubscriptionTier() == SubscriptionTier.FREE
                && documentRepository.countByUploadedById(user.getId()) >= FREE_TOTAL_DOCUMENT_LIMIT) {
            throw new DocumentQuotaExceededException("Total document limit reached.");
        }
    }

    private long getUploadsToday(User user) {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        return documentRepository.countByUploadedByIdAndCloudinaryPublicIdIsNotNullAndCreatedAtBetween(
                user.getId(),
                start,
                end);
    }

    private long getMaxFileSize(User user) {
        return user.getSubscriptionTier() == SubscriptionTier.PRO
                ? PRO_MAX_FILE_SIZE
                : FREE_MAX_FILE_SIZE;
    }

    private long toMegabytes(long bytes) {
        return bytes / (1024 * 1024);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
