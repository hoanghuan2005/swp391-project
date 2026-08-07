package com.example.keeper.systems.document.service;

import com.example.keeper.systems.auth.entity.SubscriptionPlan;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.SubscriptionPlanRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.dto.response.DocumentQuotaResponse;
import com.example.keeper.systems.document.exception.DocumentQuotaExceededException;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.document.repository.DocumentVersionRepository;
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
    private final DocumentVersionRepository documentVersionRepository;
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
                    "Maximum document file size is " + toMegabytes(maxFileSize) + "MB for your current plan.");
        }

        long usedStorage = getUsedStorage(user);
        long maxStorage = user.getMaxStorageBytes() != null ? user.getMaxStorageBytes() : plan.getTotalStorageBytes();
        if (maxStorage != UNLIMITED && (usedStorage + fileSize > maxStorage)) {
            throw new DocumentQuotaExceededException(getStorageQuotaMessage(user, plan, maxStorage));
        }

        validateDocumentCount(user, plan);

        long dailyLimit = plan.getDailyUploadLimit();
        if (dailyLimit != UNLIMITED && getUploadsToday(user) >= dailyLimit) {
            throw new DocumentQuotaExceededException(getDailyUploadQuotaMessage(user, plan));
        }
    }

    @Override
    public void validateVersionUpload(String email, long fileSize) {
        User user = findUser(email);
        if (isAdmin(user)) {
            return;
        }

        SubscriptionPlan plan = getPlanForUser(user);

        long maxFileSize = plan.getMaxFileSizeBytes();
        if (fileSize > maxFileSize) {
            throw new DocumentQuotaExceededException(
                    "Maximum document file size is " + toMegabytes(maxFileSize) + "MB for your current plan.");
        }

        long usedStorage = getUsedStorage(user);
        long maxStorage = user.getMaxStorageBytes() != null ? user.getMaxStorageBytes() : plan.getTotalStorageBytes();
        if (maxStorage != UNLIMITED && (usedStorage + fileSize > maxStorage)) {
            throw new DocumentQuotaExceededException(getStorageQuotaMessage(user, plan, maxStorage));
        }

        long dailyLimit = plan.getDailyUploadLimit();
        if (dailyLimit != UNLIMITED && getUploadsToday(user) >= dailyLimit) {
            throw new DocumentQuotaExceededException(getDailyUploadQuotaMessage(user, plan));
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

        long maxStorage = user.getMaxStorageBytes() != null ? user.getMaxStorageBytes() : plan.getTotalStorageBytes();

        return DocumentQuotaResponse.builder()
                .subscriptionTier(user.getSubscriptionTier() != null ? user.getSubscriptionTier() : "FREE")
                .uploadsToday(getUploadsToday(user))
                .dailyUploadLimit(admin ? UNLIMITED : plan.getDailyUploadLimit())
                .totalDocuments(documentRepository.countByUploadedById(user.getId()))
                .totalDocumentLimit(admin ? UNLIMITED : plan.getTotalDocumentLimit())
                .maxFileSizeBytes(admin ? 10L * 1024 * 1024 : plan.getMaxFileSizeBytes())
                .usedStorageBytes(usedStorage)
                .maxStorageBytes(admin ? UNLIMITED : maxStorage)
                .build();
    }

    private void validateDocumentCount(User user, SubscriptionPlan plan) {
        long docLimit = plan.getTotalDocumentLimit();
        if (docLimit != UNLIMITED && documentRepository.countByUploadedById(user.getId()) >= docLimit) {
            throw new DocumentQuotaExceededException(getDocumentCountQuotaMessage(user, plan));
        }
    }

    private String getStorageQuotaMessage(User user, SubscriptionPlan currentPlan, long maxStorage) {
        String planName = currentPlan.getName() != null ? currentPlan.getName() : "Current";
        String storageMb = toMegabytes(maxStorage) + "MB";
        SubscriptionPlan higherPlan = getHigherStoragePlan(currentPlan, maxStorage);

        if (higherPlan != null) {
            return "Your " + planName + " account has reached its maximum storage capacity limit (" + storageMb
                    + "). Please upgrade to the " + higherPlan.getName() + " to get more storage capacity.";
        } else {
            return "Your " + planName + " account has reached its maximum storage capacity limit (" + storageMb
                    + "). Please wait for new plan updates from system administrators or manage your existing storage.";
        }
    }

    private String getDailyUploadQuotaMessage(User user, SubscriptionPlan currentPlan) {
        String planName = currentPlan.getName() != null ? currentPlan.getName() : "Current";
        SubscriptionPlan higherPlan = getHigherPlan(currentPlan);

        if (higherPlan != null) {
            return "Your " + planName + " account has reached its daily upload limit. Please upgrade to the "
                    + higherPlan.getName() + " for higher upload limits.";
        } else {
            return "Your " + planName
                    + " account has reached its daily upload limit. Please wait for new plan updates from system administrators.";
        }
    }

    private String getDocumentCountQuotaMessage(User user, SubscriptionPlan currentPlan) {
        String planName = currentPlan.getName() != null ? currentPlan.getName() : "Current";
        SubscriptionPlan higherPlan = getHigherPlan(currentPlan);

        if (higherPlan != null) {
            return "Your " + planName + " account has reached its total document limit. Please upgrade to the "
                    + higherPlan.getName() + " to store more documents.";
        } else {
            return "Your " + planName
                    + " account has reached its total document limit. Please wait for new plan updates from system administrators.";
        }
    }

    private SubscriptionPlan getHigherStoragePlan(SubscriptionPlan currentPlan, long currentMaxStorage) {
        return subscriptionPlanRepository.findAllByOrderByPriceVndAsc().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .filter(p -> !p.getCode().equalsIgnoreCase(currentPlan.getCode()))
                .filter(p -> p.getTotalStorageBytes() != null
                        && (p.getTotalStorageBytes() > currentMaxStorage || p.getTotalStorageBytes() == UNLIMITED))
                .findFirst()
                .orElse(null);
    }

    private SubscriptionPlan getHigherPlan(SubscriptionPlan currentPlan) {
        long currentPrice = currentPlan.getPriceVnd() != null ? currentPlan.getPriceVnd() : 0L;
        return subscriptionPlanRepository.findAllByOrderByPriceVndAsc().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .filter(p -> !p.getCode().equalsIgnoreCase(currentPlan.getCode()))
                .filter(p -> p.getPriceVnd() != null && p.getPriceVnd() > currentPrice)
                .findFirst()
                .orElse(null);
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
        String tierCode = user.getSubscriptionTier() != null ? user.getSubscriptionTier() : "FREE";
        return subscriptionPlanRepository.findByCodeAndIsActiveTrue(tierCode)
                .orElseGet(() -> subscriptionPlanRepository.findTopByPriceVndAndIsActiveTrueOrderByCreatedAtAsc(0L)
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
                                        .build())));
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
