package com.example.keeper.systems.auth.controller;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();

        String defaultName = email.contains("@") ? email.split("@")[0] : "Student User";
        response.put("fullName", defaultName);
        response.put("email", user.getEmail() != null ? user.getEmail() : email);
        response.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");

      
        response.put("schoolName", "");
        response.put("languages", java.util.List.of());

        return ResponseEntity.ok(response);
    }
    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String secureUrl = cloudinaryService.uploadFile(file, "avatars");

        user.setAvatarUrl(secureUrl);
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("fileUrl", secureUrl);

        return ResponseEntity.ok(response);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}