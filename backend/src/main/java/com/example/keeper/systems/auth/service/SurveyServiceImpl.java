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
import com.example.keeper.systems.auth.entity.UserProfile;
import com.example.keeper.systems.auth.repository.LanguageRepository;
import com.example.keeper.systems.auth.repository.UserProfileRepository;
import com.example.keeper.systems.auth.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SurveyServiceImpl implements SurveyService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final LanguageRepository languageRepository;

    @Override
    public SurveyResponse completeSurvey(
            UUID userId,
            SurveyRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository
                .findByUserId(userId)
                .orElse(new UserProfile());

        profile.setUser(user);
        profile.setSchoolName(request.getSchoolName());
        profile.setStartYear(request.getStartYear());

        userProfileRepository.save(profile);

        Set<Language> languages = new HashSet<>(
                languageRepository.findAllById(request.getLanguageIds())
        );

        user.setLanguages(languages);

        user.setSurveyCompleted(true);

        userRepository.save(user);

        return SurveyResponse.builder()
                .schoolName(profile.getSchoolName())
                .startYear(profile.getStartYear())
                .languages(
                        languages.stream()
                                .map(Language::getName)
                                .collect(Collectors.toSet())
                )
                .build();
    }
}
