package com.example.keeper.systems.profile.controller;

import com.example.keeper.systems.profile.dto.request.ProfileUpdateRequest;
import com.example.keeper.systems.profile.dto.response.ProfileResponse;
import com.example.keeper.systems.profile.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(
            @AuthenticationPrincipal String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(
                profileService.getProfile(user.getId()));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal String email,
            @RequestBody ProfileUpdateRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(
                profileService.updateProfile(
                        user.getId(),
                        request));
    }
}
