package com.example.keeper.systems.profile.service;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.example.keeper.systems.profile.dto.request.ProfileUpdateRequest;
import com.example.keeper.systems.profile.dto.response.ProfileResponse;
import org.springframework.stereotype.Service;

import com.example.keeper.systems.auth.entity.Language;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.profile.entity.UserProfile;
import com.example.keeper.systems.auth.repository.LanguageRepository;
import com.example.keeper.systems.auth.repository.UserProfileRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.school.entity.School;
import com.example.keeper.systems.school.repository.SchoolRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final LanguageRepository languageRepository;
    private final SchoolRepository schoolRepository;
    private final DocumentRepository documentRepository;

    @Override
    public ProfileResponse getProfile(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository
                .findByUserId(userId)
                .orElse(null);

        return buildProfileResponse(user, profile);
    }

    @Override
    public ProfileResponse updateProfile(UUID userId, ProfileUpdateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository
                .findByUserId(userId)
                .orElse(new UserProfile());

        profile.setUser(user);

        String resolvedSchoolCode = null;
        String resolvedSchoolName = null;

        if (request.getSchoolCode() != null
                && !request.getSchoolCode().isBlank()) {

            School school = schoolRepository
                    .findByCode(request.getSchoolCode().trim())
                    .orElse(null);

            if (school != null) {
                resolvedSchoolCode = school.getCode();
                resolvedSchoolName = school.getName();
            }
        }

        if (resolvedSchoolCode == null
                && request.getSchoolName() != null
                && !request.getSchoolName().isBlank()) {

            School school = schoolRepository
                    .findByNameIgnoreCase(request.getSchoolName().trim())
                    .orElse(null);

            if (school != null) {
                resolvedSchoolCode = school.getCode();
                resolvedSchoolName = school.getName();
            } else {
                resolvedSchoolName = request.getSchoolName().trim();
            }
        }

        profile.setSchoolCode(resolvedSchoolCode);
        profile.setSchoolName(resolvedSchoolName);
        profile.setStartYear(request.getStartYear());

        userProfileRepository.save(profile);

        if (request.getLanguageIds() != null) {
            List<Language> languages = languageRepository
                    .findAllById(request.getLanguageIds());

            user.setLanguages(new HashSet<>(languages));
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setUsername(request.getFullName().trim());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        user.setProfile(profile);

        userRepository.save(user);

        return buildProfileResponse(user, profile);
    }

    private ProfileResponse buildProfileResponse(
            User user,
            UserProfile profile) {

        long uploads = documentRepository.countByUploadedById(user.getId());

        return ProfileResponse.builder()
                .fullName(user.getUsername() != null
                        ? user.getUsername()
                        : user.getEmail().split("@")[0])
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl() != null
                        ? user.getAvatarUrl()
                        : "")
                .schoolCode(profile != null
                        ? profile.getSchoolCode()
                        : "")
                .schoolName(profile != null
                        ? profile.getSchoolName()
                        : "")
                .startYear(profile != null
                        ? profile.getStartYear()
                        : null)
                .languages(user.getLanguages() != null
                        ? user.getLanguages()
                        .stream()
                        .map(Language::getName)
                        .collect(Collectors.toList())
                        : List.of())
                .uploads(uploads)
                .followers(0)
                .upvotes(0)
                .build();
    }
}
