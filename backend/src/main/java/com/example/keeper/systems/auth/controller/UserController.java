package com.example.keeper.systems.auth.controller;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.entity.UserProfile;
import com.example.keeper.systems.auth.entity.Language;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.repository.UserProfileRepository;
import com.example.keeper.systems.auth.service.CloudinaryService;
// 🔥 THÊM IMPORT NÀY
import com.example.keeper.systems.document.repository.DocumentRepository;

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
    private final UserProfileRepository userProfileRepository;
    private final CloudinaryService cloudinaryService;
    // 🔥 INJECT REPOSITORY ĐỂ ĐẾM FILE
    private final DocumentRepository documentRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Lấy thông tin học vấn từ bảng user_profiles dựa trên userId
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElse(null);

        Map<String, Object> response = new HashMap<>();

        String defaultName = email.contains("@") ? email.split("@")[0] : "Student User";
        response.put("fullName", defaultName);
        response.put("email", user.getEmail() != null ? user.getEmail() : email);
        response.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");

        if (profile != null) {
            response.put("schoolName", profile.getSchoolName() != null ? profile.getSchoolName() : "");
            response.put("startYear", profile.getStartYear());
        } else {
            response.put("schoolName", "");
            response.put("startYear", null);
        }

        List<String> userLanguages = (user.getLanguages() != null) ?
                user.getLanguages().stream().map(Language::getName).collect(Collectors.toList()) :
                List.of();
        response.put("languages", userLanguages);

        // 🔥 THÊM LOGIC ĐẾM SỐ LƯỢNG FILE UPLOAD Ở ĐÂY
        long uploadCount = documentRepository.countByUploadedById(user.getId());
        response.put("uploads", uploadCount);

        // Thêm luôn followers và upvotes mặc định để Frontend hiển thị cho đồng bộ
        response.put("followers", 0);
        response.put("upvotes", 0);

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