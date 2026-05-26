package com.example.keeper.systems.auth.service;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import com.example.keeper.systems.auth.dto.SurveyRequest;
import com.example.keeper.systems.auth.dto.SurveyResponse;
import com.example.keeper.systems.auth.entity.Language;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.profile.entity.UserProfile;
import com.example.keeper.systems.auth.repository.LanguageRepository;
import com.example.keeper.systems.auth.repository.UserProfileRepository;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.school.entity.School;
import com.example.keeper.systems.school.repository.SchoolRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SurveyServiceImpl implements SurveyService {
        private final UserRepository userRepository;
        private final UserProfileRepository userProfileRepository;
        private final LanguageRepository languageRepository;
        private final SchoolRepository schoolRepository;

        @Override
        public SurveyResponse completeSurvey(
                        UUID userId,
                        SurveyRequest request) {
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
                Set<Language> languages = request.getLanguageIds() != null
                                ? new HashSet<>(languageRepository.findAllById(request.getLanguageIds()))
                                : new HashSet<>();
                user.setLanguages(languages);
                user.setSurveyCompleted(true);
                user.setProfile(profile);
                userRepository.save(user);
                return SurveyResponse.builder()
                                .schoolCode(profile.getSchoolCode())
                                .schoolName(profile.getSchoolName())
                                .startYear(profile.getStartYear())
                                .languages(
                                                languages.stream()
                                                                .map(Language::getName)
                                                                .collect(Collectors.toSet()))
                                .build();
        }
}
