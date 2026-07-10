package com.example.keeper.systems.user.controller;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.repository.RoleRepository;
import com.example.keeper.systems.auth.entity.Role;
import com.example.keeper.systems.user.dto.AdminUserCreateRequest;
import com.example.keeper.systems.user.dto.AdminUserDetailResponse;
import com.example.keeper.systems.user.dto.AdminUserListItemResponse;
import com.example.keeper.systems.user.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final AdminUserService adminUserService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<AdminUserListItemResponse>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDetailResponse> getUserDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminUserService.getUserDetail(id));
    }

    @PutMapping("/{id}/ban")
    public ResponseEntity<String> toggleBanUser(@PathVariable UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        String currentAdminEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new IllegalArgumentException("Admins cannot ban or unban their own account");
        }

        if (isAdmin(user)) {
            throw new IllegalArgumentException("Admin accounts cannot be banned or unbanned");
        }

        user.setBanned(!user.isBanned());
        userRepository.save(user);
        return ResponseEntity.ok(user.isBanned() ? "Banned successfully" : "Unbanned successfully");
    }

    @PostMapping
    public ResponseEntity<AdminUserDetailResponse> createUser(@Valid @RequestBody AdminUserCreateRequest request) {
        return ResponseEntity.ok(adminUserService.createUser(request));
    }

    @PostMapping("/import")
    public ResponseEntity<?> importUsers(@RequestBody List<Map<String, String>> requests) {
        Role userRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new RuntimeException("Default STUDENT role not found"));
        String defaultPassword = passwordEncoder.encode("123456");

        for (Map<String, String> req : requests) {
            String email = req.get("email");
            if (email == null || email.isBlank()) continue;
            email = email.trim();

            if (userRepository.findByEmail(email).isPresent()) {
                continue; // Skip duplicates
            }

            User user = new User();
            user.setEmail(email);
            user.setUsername(req.getOrDefault("username", email.split("@")[0]).trim());
            user.setPassword(defaultPassword);
            user.setRole(userRole);
            user.setEmailVerified(true);
            user.setBanned(false);

            String tierStr = req.getOrDefault("subscriptionTier", "FREE");
            try {
                user.setSubscriptionTier(com.example.keeper.systems.auth.enums.SubscriptionTier.valueOf(tierStr.toUpperCase()));
            } catch (Exception e) {
                user.setSubscriptionTier(com.example.keeper.systems.auth.enums.SubscriptionTier.FREE);
            }

            userRepository.save(user);
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Users imported successfully"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
    }
}
