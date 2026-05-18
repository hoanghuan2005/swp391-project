package com.example.keeper.systems.school.controller;

import com.example.keeper.systems.school.dto.request.SchoolRequest;
import com.example.keeper.systems.school.dto.response.SchoolResponse;
import com.example.keeper.systems.school.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/schools")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @PostMapping
    public SchoolResponse createSchool(@RequestBody SchoolRequest request) {
        return schoolService.createSchool(request);
    }

    @GetMapping
    public List<SchoolResponse> getAllSchools() {
        return schoolService.getAllSchools();
    }

    @GetMapping("/{id}")
    public SchoolResponse getSchoolById(@PathVariable UUID id) {
        return schoolService.getSchoolById(id);
    }

    @PutMapping("/{id}")
    public SchoolResponse updateSchool(
            @PathVariable UUID id,
            @RequestBody SchoolRequest request) {
        return schoolService.updateSchool(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteSchool(@PathVariable UUID id) {
        schoolService.deleteSchool(id);
    }
}
