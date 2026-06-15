package com.example.keeper.systems.follow.controller;

import com.example.keeper.systems.follow.dto.FollowerFollowingResponse;
import com.example.keeper.systems.follow.dto.UserProfileSummaryResponse;
import com.example.keeper.systems.follow.service.UserFollowService;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class UserFollowController {

    private final UserFollowService userFollowService;

    @PostMapping("/{userId}")
    public ResponseEntity<?> follow(@PathVariable UUID userId) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        if ("anonymousUser".equals(currentEmail)) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để sử dụng tính năng này!"));
        }
        userFollowService.follow(userId, currentEmail);
        return ResponseEntity.ok(Map.of("message", "Followed successfully"));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> unfollow(@PathVariable UUID userId) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        if ("anonymousUser".equals(currentEmail)) {
            return ResponseEntity.status(401).body(Map.of("message", "Vui lòng đăng nhập để sử dụng tính năng này!"));
        }
        userFollowService.unfollow(userId, currentEmail);
        return ResponseEntity.ok(Map.of("message", "Unfollowed successfully"));
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<Page<FollowerFollowingResponse>> getFollowers(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        Page<FollowerFollowingResponse> result = userFollowService.getFollowers(userId, PageRequest.of(page, size), currentEmail);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<Page<FollowerFollowingResponse>> getFollowing(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        Page<FollowerFollowingResponse> result = userFollowService.getFollowing(userId, PageRequest.of(page, size), currentEmail);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<Map<String, Boolean>> getFollowStatus(@PathVariable UUID userId) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isFollowing = userFollowService.isFollowing(userId, currentEmail);
        return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserProfileSummaryResponse> getUserProfile(@PathVariable UUID userId) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        UserProfileSummaryResponse profile = userFollowService.getUserProfileSummary(userId, currentEmail);
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/profile/{userId}/documents")
    public ResponseEntity<List<DocumentResponse>> getUserDocuments(@PathVariable UUID userId) {
        List<DocumentResponse> documents = userFollowService.getUserDocuments(userId);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<FollowerFollowingResponse>> getSuggestions(@RequestParam(defaultValue = "5") int limit) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<FollowerFollowingResponse> suggestions = userFollowService.getSuggestions(limit, currentEmail);
        return ResponseEntity.ok(suggestions);
    }
}
