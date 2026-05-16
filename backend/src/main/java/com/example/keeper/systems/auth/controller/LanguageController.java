package com.example.keeper.systems.auth.controller;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.keeper.systems.auth.dto.LanguageResponse;
import com.example.keeper.systems.auth.repository.LanguageRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/languages")
@RequiredArgsConstructor
public class LanguageController {

    private final LanguageRepository languageRepository;

    @GetMapping
    public ResponseEntity<List<LanguageResponse>> getLanguages() {
        List<LanguageResponse> languages = languageRepository
                .findAll(Sort.by("name").ascending())
                .stream()
                .map(language -> LanguageResponse.builder()
                        .id(language.getId())
                        .code(language.getCode())
                        .name(language.getName())
                        .build())
                .toList();

        return ResponseEntity.ok(languages);
    }
}
