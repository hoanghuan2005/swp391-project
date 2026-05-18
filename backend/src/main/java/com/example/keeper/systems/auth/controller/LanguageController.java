package com.example.keeper.systems.auth.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.keeper.systems.auth.dto.LanguageRequest;
import com.example.keeper.systems.auth.dto.LanguageResponse;
import com.example.keeper.systems.auth.entity.Language;
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
                .map(this::mapToResponse)
                .toList();

        return ResponseEntity.ok(languages);
    }

    @PostMapping
    public ResponseEntity<LanguageResponse> createLanguage(
            @RequestBody LanguageRequest request) {
        String code = request.getCode() == null ? null : request.getCode().trim();
        String name = request.getName() == null ? null : request.getName().trim();

        if (code == null || code.isEmpty()) {
            throw new IllegalArgumentException("Language code is required");
        }

        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Language name is required");
        }

        if (languageRepository.existsByCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Language code already exists");
        }

        if (languageRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Language name already exists");
        }

        Language language = Language.builder()
                .code(code.toUpperCase())
                .name(name)
                .build();

        return ResponseEntity.ok(mapToResponse(languageRepository.save(language)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLanguage(@PathVariable UUID id) {
        languageRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private LanguageResponse mapToResponse(Language language) {
        return LanguageResponse.builder()
                .id(language.getId())
                .code(language.getCode())
                .name(language.getName())
                .build();
    }
}
