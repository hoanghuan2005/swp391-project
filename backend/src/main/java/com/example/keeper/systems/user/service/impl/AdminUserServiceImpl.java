package com.example.keeper.systems.user.service.impl;

import com.example.keeper.systems.ai_usage.repository.AiUsageRepository;
import com.example.keeper.systems.ai_flashcard.repository.FlashcardSetRepository;
import com.example.keeper.systems.ai_mindmap.repository.MindMapRepository;
import com.example.keeper.systems.ai_quiz.repository.QuizRepository;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.enums.SubscriptionTier;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.payment.entity.PaymentTransaction;
import com.example.keeper.systems.payment.repository.PaymentTransactionRepository;
import com.example.keeper.systems.project.repository.ProjectMemberRepository;
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.auth.repository.RoleRepository;
import com.example.keeper.systems.auth.entity.Role;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.example.keeper.systems.user.dto.AdminUserCreateRequest;
import com.example.keeper.systems.user.dto.AdminUserDetailResponse;
import com.example.keeper.systems.user.dto.AdminUserListItemResponse;
import com.example.keeper.systems.user.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private static final long FREE_AI_DAILY_LIMIT = 5;
    private static final long UNLIMITED = -1;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DocumentRepository documentRepository;
    private final AiUsageRepository aiUsageRepository;
    private final QuizRepository quizRepository;
    private final FlashcardSetRepository flashcardSetRepository;
    private final MindMapRepository mindMapRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Override
    public List<AdminUserListItemResponse> getAllUsers() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        return userRepository.findAll().stream()
                .map(user -> buildResponse(user, start, end))
                .toList();
    }

    @Override
    public AdminUserDetailResponse getUserDetail(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        AdminUserListItemResponse summary = buildResponse(user, start, end);
        PaymentTransaction latestPayment = paymentTransactionRepository
                .findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .orElse(null);

        return AdminUserDetailResponse.builder()
                .id(summary.getId())
                .username(summary.getUsername())
                .email(summary.getEmail())
                .roleName(summary.getRoleName())
                .subscriptionTier(summary.getSubscriptionTier())
                .emailVerified(summary.isEmailVerified())
                .banned(summary.isBanned())
                .createdAt(summary.getCreatedAt())
                .updatedAt(summary.getUpdatedAt())
                .avatarUrl(user.getAvatarUrl())
                .surveyCompleted(user.isSurveyCompleted())
                .schoolCode(user.getProfile() != null ? user.getProfile().getSchoolCode() : null)
                .schoolName(user.getProfile() != null ? user.getProfile().getSchoolName() : null)
                .startYear(user.getProfile() != null ? user.getProfile().getStartYear() : null)
                .major(user.getProfile() != null ? user.getProfile().getMajor() : null)
                .languages(buildLanguageSummaries(user))
                .totalDocuments(summary.getTotalDocuments())
                .publicDocuments(summary.getPublicDocuments())
                .privateDocuments(summary.getPrivateDocuments())
                .storageUsedBytes(summary.getStorageUsedBytes())
                .recentDocuments(buildRecentDocuments(user.getId()))
                .aiUsageToday(summary.getAiUsageToday())
                .aiDailyLimit(summary.getAiDailyLimit())
                .aiRemainingToday(summary.getAiRemainingToday())
                .aiUsageByFeature(buildAiUsageByFeature(user.getId(), start, end))
                .quizCount(quizRepository.countByOwnerId(user.getId()))
                .flashcardSetCount(flashcardSetRepository.countByUserId(user.getId()))
                .mindmapCount(mindMapRepository.countByDocumentOwnerId(user.getId()))
                .projectOwnedCount(projectRepository.countByOwnerId(user.getId()))
                .projectJoinedCount(projectMemberRepository.countByUserId(user.getId()))
                .latestPaymentStatus(latestPayment != null ? latestPayment.getStatus().name() : null)
                .latestPaymentDate(latestPayment != null
                        ? latestPayment.getProcessedAt() != null
                            ? latestPayment.getProcessedAt()
                            : latestPayment.getCreatedAt()
                        : null)
                .build();
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

    private List<AdminUserDetailResponse.LanguageSummary> buildLanguageSummaries(User user) {
        return user.getLanguages().stream()
                .map(language -> AdminUserDetailResponse.LanguageSummary.builder()
                        .id(language.getId())
                        .code(language.getCode())
                        .name(language.getName())
                        .build())
                .toList();
    }

    private List<AdminUserDetailResponse.RecentDocumentSummary> buildRecentDocuments(UUID userId) {
        return documentRepository
                .findByUploadedByIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 5))
                .stream()
                .map(this::buildRecentDocument)
                .toList();
    }

    private AdminUserDetailResponse.RecentDocumentSummary buildRecentDocument(Document document) {
        return AdminUserDetailResponse.RecentDocumentSummary.builder()
                .id(document.getId())
                .title(document.getTitle())
                .visibility(document.getVisibility() != null ? document.getVisibility().name() : null)
                .fileSize(document.getFileSize())
                .createdAt(document.getCreatedAt())
                .aiParseStatus(document.getAiParseStatus() != null ? document.getAiParseStatus().name() : null)
                .build();
    }

    private Map<String, Long> buildAiUsageByFeature(UUID userId, LocalDateTime start, LocalDateTime end) {
        Map<String, Long> usageByFeature = new LinkedHashMap<>();
        aiUsageRepository.countByFeatureForUserBetween(userId, start, end)
                .forEach(row -> usageByFeature.put(String.valueOf(row[0]), ((Number) row[1]).longValue()));
        return usageByFeature;
    }

    @Override
    public AdminUserDetailResponse createUser(AdminUserCreateRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        Role role = roleRepository.findByName(request.getRole().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + request.getRole()));

        User user = new User();
        user.setEmail(request.getEmail().trim());
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setEmailVerified(true);
        user.setBanned(false);

        String tierStr = request.getSubscriptionTier() != null ? request.getSubscriptionTier() : "FREE";
        try {
            user.setSubscriptionTier(SubscriptionTier.valueOf(tierStr.toUpperCase()));
        } catch (Exception e) {
            user.setSubscriptionTier(SubscriptionTier.FREE);
        }

        User savedUser = userRepository.save(user);
        return getUserDetail(savedUser.getId());
    }
}
