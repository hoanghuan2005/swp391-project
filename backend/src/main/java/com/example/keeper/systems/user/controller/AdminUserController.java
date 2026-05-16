package com.example.keeper.systems.user.controller;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/ban")
    public ResponseEntity<String> toggleBanUser(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(!user.isBanned());
        userRepository.save(user);
        return ResponseEntity.ok(user.isBanned() ? "Banned successfully" : "Unbanned successfully");
    }
}
