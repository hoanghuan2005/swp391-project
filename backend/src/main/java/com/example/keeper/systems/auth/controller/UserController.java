package com.example.keeper.systems.auth.controller;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.user.dto.UserPreferenceRequest;
import com.example.keeper.systems.user.dto.UserPreferenceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(user);
    }

    @GetMapping("/preferences")
    public ResponseEntity<UserPreferenceResponse> getPreferences() {
        User user = getCurrentUser();
        if (!user.isSurveyCompleted()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(new UserPreferenceResponse(
                user.getSchool(),
                user.getStudyStartYear(),
                user.getPreferredLanguages(),
                user.isSurveyCompleted()));
    }

    @PutMapping("/preferences")
    public ResponseEntity<UserPreferenceResponse> updatePreferences(
            @org.springframework.web.bind.annotation.RequestBody UserPreferenceRequest request) {
        User user = getCurrentUser();
        user.setSchool(request.getSchool());
        user.setStudyStartYear(request.getStudyStartYear());
        user.setPreferredLanguages(request.getPreferredLanguages());
        user.setSurveyCompleted(true);
        userRepository.save(user);

        return ResponseEntity.ok(new UserPreferenceResponse(
                user.getSchool(),
                user.getStudyStartYear(),
                user.getPreferredLanguages(),
                user.isSurveyCompleted()));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}