package com.example.keeper.systems.user.service.impl;

import com.example.keeper.systems.ai_usage.repository.AiUsageRepository;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.enums.SubscriptionTier;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.user.dto.AdminUserListItemResponse;
import com.example.keeper.systems.user.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private static final long FREE_AI_DAILY_LIMIT = 5;
    private static final long UNLIMITED = -1;

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final AiUsageRepository aiUsageRepository;

    @Override
    public List<AdminUserListItemResponse> getAllUsers() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        return userRepository.findAll().stream()
                .map(user -> buildResponse(user, start, end))
                .toList();
    }

    private AdminUserListItemResponse buildResponse(User user, LocalDateTime start, LocalDateTime end) {
        long aiUsageToday = aiUsageRepository.countByUserIdAndCreatedAtBetween(user.getId(), start, end);
        boolean unlimitedAi = isAdmin(user) || user.getSubscriptionTier() == SubscriptionTier.PRO;
        long aiDailyLimit = unlimitedAi ? UNLIMITED : FREE_AI_DAILY_LIMIT;
        long aiRemainingToday = unlimitedAi ? UNLIMITED : Math.max(0, FREE_AI_DAILY_LIMIT - aiUsageToday);
        Long storageUsedBytes = documentRepository.sumFileSizeByUploadedById(user.getId());

        return AdminUserListItemResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .subscriptionTier(user.getSubscriptionTier() != null ? user.getSubscriptionTier().name() : null)
                .emailVerified(user.isEmailVerified())
                .banned(user.isBanned())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .totalDocuments(documentRepository.countByUploadedById(user.getId()))
                .publicDocuments(documentRepository.countByUploadedByIdAndVisibility(user.getId(), Visibility.PUBLIC))
                .privateDocuments(documentRepository.countByUploadedByIdAndVisibility(user.getId(), Visibility.PRIVATE))
                .storageUsedBytes(storageUsedBytes != null ? storageUsedBytes : 0)
                .aiUsageToday(aiUsageToday)
                .aiDailyLimit(aiDailyLimit)
                .aiRemainingToday(aiRemainingToday)
                .build();
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
    }
}
