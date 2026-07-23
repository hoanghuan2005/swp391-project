package com.example.keeper.systems.profile.controller;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.profile.dto.request.ProfileUpdateRequest;
import com.example.keeper.systems.profile.dto.response.ProfileResponse;
import com.example.keeper.systems.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {

        String email = (String) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(profileService.getProfile(user.getId()));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @RequestBody ProfileUpdateRequest request) {

        String email = (String) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(profileService.updateProfile(user.getId(), request));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody com.example.keeper.systems.profile.dto.request.ChangePasswordRequest request) {

        String email = (String) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            profileService.changePassword(user.getId(), request);
            return ResponseEntity.ok(java.util.Map.of("message", "Password changed successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}