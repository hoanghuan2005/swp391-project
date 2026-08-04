package com.example.keeper.systems.document.service;

import com.example.keeper.systems.auth.entity.SubscriptionPlan;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.SubscriptionPlanRepository;
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

    private static final long UNLIMITED = -1;

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Override
    public void validateUpload(String email, long fileSize) {
        User user = findUser(email);
        if (isAdmin(user)) {
            return;
        }

        SubscriptionPlan plan = getPlanForUser(user);

        long maxFileSize = plan.getMaxFileSizeBytes();
        if (fileSize > maxFileSize) {
            throw new DocumentQuotaExceededException(
                    "Maximum document file size is " + toMegabytes(maxFileSize) + "MB for your subscription tier.");
        }

        long usedStorage = getUsedStorage(user);
        long maxStorage = plan.getTotalStorageBytes();
        if (maxStorage != UNLIMITED && (usedStorage + fileSize > maxStorage)) {
            throw new DocumentQuotaExceededException(
                    "Total storage limit (" + toMegabytes(maxStorage) + "MB) exceeded.");
        }

        validateDocumentCount(user, plan);

        long dailyLimit = plan.getDailyUploadLimit();
        if (dailyLimit != UNLIMITED && getUploadsToday(user) >= dailyLimit) {
            throw new DocumentQuotaExceededException("Daily document upload limit reached.");
        }
    }

    @Override
    public void validateDocumentCreation(String email) {
        User user = findUser(email);
        if (isAdmin(user)) {
            return;
        }
        SubscriptionPlan plan = getPlanForUser(user);
        validateDocumentCount(user, plan);
    }

    @Override
    public DocumentQuotaResponse getQuota(String email) {
        User user = findUser(email);
        boolean admin = isAdmin(user);

        SubscriptionPlan plan = getPlanForUser(user);

        long usedStorage = getUsedStorage(user);

        return DocumentQuotaResponse.builder()
                .subscriptionTier(user.getSubscriptionTier() != null ? user.getSubscriptionTier().name() : "FREE")
                .uploadsToday(getUploadsToday(user))
                .dailyUploadLimit(admin ? UNLIMITED : plan.getDailyUploadLimit())
                .totalDocuments(documentRepository.countByUploadedById(user.getId()))
                .totalDocumentLimit(admin ? UNLIMITED : plan.getTotalDocumentLimit())
                .maxFileSizeBytes(admin ? 10L * 1024 * 1024 : plan.getMaxFileSizeBytes())
                .usedStorageBytes(usedStorage)
                .maxStorageBytes(admin ? UNLIMITED : plan.getTotalStorageBytes())
                .build();
    }

    private void validateDocumentCount(User user, SubscriptionPlan plan) {
        long docLimit = plan.getTotalDocumentLimit();
        if (docLimit != UNLIMITED && documentRepository.countByUploadedById(user.getId()) >= docLimit) {
            throw new DocumentQuotaExceededException("Total document limit reached.");
        }
    }

    private long getUsedStorage(User user) {
        Long sum = documentRepository.sumFileSizeByUploadedById(user.getId());
        return sum != null ? sum : 0L;
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

    private SubscriptionPlan getPlanForUser(User user) {
        String tierCode = user.getSubscriptionTier() != null ? user.getSubscriptionTier().name() : "FREE";
        return subscriptionPlanRepository.findByCodeAndIsActiveTrue(tierCode)
                .orElseGet(() -> subscriptionPlanRepository.findByCode("FREE")
                        .orElse(SubscriptionPlan.builder()
                                .code("FREE")
                                .name("Gói Miễn Phí")
                                .priceVnd(0L)
                                .maxFileSizeBytes(5L * 1024 * 1024)
                                .totalStorageBytes(100L * 1024 * 1024)
                                .dailyUploadLimit(3L)
                                .totalDocumentLimit(20L)
                                .isActive(true)
                                .build()));
    }

    private long toMegabytes(long bytes) {
        return bytes / (1024 * 1024);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equals(user.getRole().getName());
    }
}
