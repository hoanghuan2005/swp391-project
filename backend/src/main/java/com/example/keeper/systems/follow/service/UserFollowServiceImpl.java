package com.example.keeper.systems.follow.service;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.follow.dto.FollowerFollowingResponse;
import com.example.keeper.systems.follow.dto.UserProfileSummaryResponse;
import com.example.keeper.systems.follow.entity.UserFollow;
import com.example.keeper.systems.follow.repository.UserFollowRepository;
import com.example.keeper.systems.notification.enums.NotificationType;
import com.example.keeper.systems.notification.enums.ReferenceType;
import com.example.keeper.systems.notification.service.NotificationService;
import com.example.keeper.systems.tag.entity.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserFollowServiceImpl implements UserFollowService {

    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void follow(UUID targetUserId, String currentEmail) {
        User follower = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        User following = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (follower.getId().equals(following.getId())) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        if (userFollowRepository.existsByFollowerIdAndFollowingId(follower.getId(), following.getId())) {
            throw new IllegalArgumentException("You are already following this user");
        }

        UserFollow userFollow = UserFollow.builder()
                .follower(follower)
                .following(following)
                .build();

        userFollowRepository.save(userFollow);

        // Send Notification
        String callerName = follower.getUsername() != null ? follower.getUsername() : follower.getEmail();
        notificationService.createNotification(
                following,
                follower,
                NotificationType.FOLLOW,
                "New Follower",
                callerName + " has started following you.",
                follower.getId(),
                ReferenceType.USER
        );
    }

    @Override
    @Transactional
    public void unfollow(UUID targetUserId, String currentEmail) {
        User follower = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        UserFollow userFollow = userFollowRepository.findByFollowerIdAndFollowingId(follower.getId(), targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("You are not following this user"));

        userFollowRepository.delete(userFollow);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FollowerFollowingResponse> getFollowers(UUID userId, Pageable pageable, String currentEmail) {
        Page<UserFollow> follows = userFollowRepository.findByFollowingId(userId, pageable);
        
        UUID currentUserId = getCurrentUserId(currentEmail);

        List<FollowerFollowingResponse> dtoList = follows.getContent().stream()
                .map(uf -> {
                    User follower = uf.getFollower();
                    return mapToFollowerFollowingResponse(follower, currentUserId);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, follows.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FollowerFollowingResponse> getFollowing(UUID userId, Pageable pageable, String currentEmail) {
        Page<UserFollow> follows = userFollowRepository.findByFollowerId(userId, pageable);

        UUID currentUserId = getCurrentUserId(currentEmail);

        List<FollowerFollowingResponse> dtoList = follows.getContent().stream()
                .map(uf -> {
                    User following = uf.getFollowing();
                    return mapToFollowerFollowingResponse(following, currentUserId);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, follows.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFollowing(UUID targetUserId, String currentEmail) {
        if (currentEmail == null || "anonymousUser".equals(currentEmail)) {
            return false;
        }
        User follower = userRepository.findByEmail(currentEmail).orElse(null);
        if (follower == null) {
            return false;
        }
        return userFollowRepository.existsByFollowerIdAndFollowingId(follower.getId(), targetUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileSummaryResponse getUserProfileSummary(UUID userId, String currentEmail) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        long totalDocuments = documentRepository.countByUploadedById(userId);
        long followersCount = userFollowRepository.countByFollowingId(userId);
        long followingCount = userFollowRepository.countByFollowerId(userId);
        boolean isFollowedByCurrentUser = isFollowing(userId, currentEmail);

        String fullName = targetUser.getUsername() != null ? targetUser.getUsername() : targetUser.getEmail();

        return UserProfileSummaryResponse.builder()
                .id(targetUser.getId())
                .fullName(fullName)
                .avatarUrl(targetUser.getAvatarUrl())
                .totalDocuments(totalDocuments)
                .followersCount(followersCount)
                .followingCount(followingCount)
                .isFollowedByCurrentUser(isFollowedByCurrentUser)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowerFollowingResponse> getSuggestions(int limit, String currentEmail) {
        // Query users with most followers (fetch extra to allow for filtering)
        List<Object[]> topUsersData = userFollowRepository.findTopFollowingIds(PageRequest.of(0, limit + 25));
        
        UUID currentUserId = getCurrentUserId(currentEmail);

        List<FollowerFollowingResponse> suggestions = new ArrayList<>();
        
        for (Object[] row : topUsersData) {
            UUID userId = (UUID) row[0];
            if (currentUserId != null && currentUserId.equals(userId)) {
                continue; // skip self
            }
            userRepository.findById(userId).ifPresent(user -> {
                if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName())) {
                    return; // skip admin
                }
                if (currentUserId != null) {
                    boolean isFollowed = userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, user.getId());
                    if (isFollowed) {
                        return; // skip already followed
                    }
                }
                suggestions.add(mapToFollowerFollowingResponse(user, currentUserId));
            });
            if (suggestions.size() >= limit) {
                break;
            }
        }

        // Fallback: if list is empty or small, get any active users
        if (suggestions.size() < limit) {
            List<User> allUsers = userRepository.findAll();
            for (User user : allUsers) {
                if (currentUserId != null && currentUserId.equals(user.getId())) {
                    continue; // skip self
                }
                if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName())) {
                    continue; // skip admin
                }
                if (currentUserId != null) {
                    boolean isFollowed = userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, user.getId());
                    if (isFollowed) {
                        continue; // skip already followed
                    }
                }
                boolean alreadyInList = suggestions.stream().anyMatch(s -> s.getId().equals(user.getId()));
                if (!alreadyInList) {
                    suggestions.add(mapToFollowerFollowingResponse(user, currentUserId));
                }
                if (suggestions.size() >= limit) {
                    break;
                }
            }
        }

        return suggestions;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getUserDocuments(UUID userId) {
        return documentRepository.findByUploadedById(userId).stream()
                .filter(doc -> doc.getVisibility() == com.example.keeper.systems.document.enums.Visibility.PUBLIC)
                .map(this::mapToDocumentResponse)
                .collect(Collectors.toList());
    }

    private UUID getCurrentUserId(String email) {
        if (email == null || "anonymousUser".equals(email)) {
            return null;
        }
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }

    private FollowerFollowingResponse mapToFollowerFollowingResponse(User user, UUID currentUserId) {
        long docCount = documentRepository.countByUploadedById(user.getId());
        long followersCount = userFollowRepository.countByFollowingId(user.getId());
        boolean isFollowed = false;
        if (currentUserId != null) {
            isFollowed = userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, user.getId());
        }

        String fullName = user.getUsername() != null ? user.getUsername() : user.getEmail();

        return FollowerFollowingResponse.builder()
                .id(user.getId())
                .fullName(fullName)
                .avatarUrl(user.getAvatarUrl())
                .documentCount(docCount)
                .followersCount(followersCount)
                .isFollowedByCurrentUser(isFollowed)
                .build();
    }

    private DocumentResponse mapToDocumentResponse(Document document) {
        String originalFileName = document.getOriginalFileName();
        String fileType = "";
        if (originalFileName != null) {
            int extIdx = originalFileName.lastIndexOf('.');
            if (extIdx > 0 && extIdx < originalFileName.length() - 1) {
                fileType = originalFileName.substring(extIdx + 1).toLowerCase();
            }
        }

        return DocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .fileType(fileType)
                .resourceType(document.getResourceType())
                .previewUrl(document.getPreviewUrl())
                .downloadUrl(document.getDownloadUrl())
                .mimeType(document.getMimeType())
                .visibility(document.getVisibility() == null ? null : document.getVisibility().name())
                .aiParseStatus(document.getAiParseStatus() == null ? null : document.getAiParseStatus().name())
                .downloadCount(document.getDownloadCount())
                .viewCount(document.getViewCount() != null ? document.getViewCount() : 0)
                .createdAt(document.getCreatedAt())
                .course(document.getCourse() == null ? null : DocumentResponse.CourseInfo.builder()
                        .id(document.getCourse().getId())
                        .code(document.getCourse().getCode())
                        .name(document.getCourse().getName())
                        .major(document.getCourse().getMajor() == null ? null : DocumentResponse.MajorInfo.builder()
                                .id(document.getCourse().getMajor().getId())
                                .code(document.getCourse().getMajor().getCode())
                                .name(document.getCourse().getMajor().getName())
                                .school(document.getCourse().getMajor().getSchool() == null ? null : DocumentResponse.SchoolInfo.builder()
                                        .id(document.getCourse().getMajor().getSchool().getId())
                                        .code(document.getCourse().getMajor().getSchool().getCode())
                                        .name(document.getCourse().getMajor().getSchool().getName())
                                        .build())
                                .build())
                        .build())
                .tags(document.getTags() == null ? List.of() : document.getTags().stream()
                        .map(Tag::getName)
                        .sorted(String::compareToIgnoreCase)
                        .toList())
                .build();
    }
}
