package com.example.keeper.systems.ai_usage.controller;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.ai_usage.service.AiUsageService;
import com.example.keeper.systems.ai_usage.repository.AiUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/ai-usages")
@RequiredArgsConstructor
public class AdminAiUsageController {

    private final UserRepository userRepository;
    private final AiUsageService aiUsageService;
    private final AiUsageRepository aiUsageRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAiUsages() {
        List<User> users = userRepository.findAll();
        
        List<Map<String, Object>> response = users.stream().map(u -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("userId", u.getId());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("subscriptionTier", u.getSubscriptionTier().name());
            
            // Calculate remaining usage
            long remaining = aiUsageService.getRemainingUsage(u.getEmail());
            map.put("remainingUsage", remaining);
            
            // Fetch total AI requests made by this user
            long totalRequests = aiUsageRepository.countByUserId(u.getId());
            map.put("totalRequests", totalRequests);
            
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
