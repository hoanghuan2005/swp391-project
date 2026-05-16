package com.example.keeper.systems.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.keeper.systems.auth.dto.SurveyRequest;
import com.example.keeper.systems.auth.dto.SurveyResponse;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.auth.service.SurveyService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/survey")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<SurveyResponse> completeSurvey(
            @AuthenticationPrincipal String email,
            @RequestBody SurveyRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SurveyResponse response = surveyService.completeSurvey(
                user.getId(),
                request);

        return ResponseEntity.ok(response);
    }
}
