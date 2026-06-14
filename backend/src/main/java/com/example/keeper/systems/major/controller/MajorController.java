package com.example.keeper.systems.major.controller;

import com.example.keeper.systems.major.dto.request.CreateMajorRequest;
import com.example.keeper.systems.major.dto.response.MajorResponse;
import com.example.keeper.systems.major.service.MajorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/majors")
@RequiredArgsConstructor
public class MajorController {

    private final MajorService majorService;

    @PostMapping
    public MajorResponse create(@RequestBody CreateMajorRequest request) {
        return majorService.create(request);
    }

    @GetMapping
    public List<MajorResponse> getAll(@RequestParam(required = false) UUID schoolId) {
        if (schoolId != null) {
            return majorService.getMajorsBySchool(schoolId);
        }
        return majorService.getAll();
    }

    @GetMapping("/{id}")
    public MajorResponse getById(@PathVariable UUID id) {
        return majorService.getById(id);
    }

    @PutMapping("/{id}")
    public MajorResponse update(
            @PathVariable UUID id,
            @RequestBody CreateMajorRequest request) {
        return majorService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        majorService.delete(id);
    }
}
