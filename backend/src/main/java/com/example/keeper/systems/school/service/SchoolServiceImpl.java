package com.example.keeper.systems.school.service;

import com.example.keeper.systems.school.dto.request.SchoolRequest;
import com.example.keeper.systems.school.dto.response.SchoolResponse;
import com.example.keeper.systems.school.entity.School;
import com.example.keeper.systems.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SchoolServiceImpl implements SchoolService {

    private final SchoolRepository schoolRepository;

    @Override
    public SchoolResponse createSchool(SchoolRequest request) {

        if (schoolRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("School code already exists");
        }

        School school = School.builder()
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .build();

        schoolRepository.save(school);

        return mapToResponse(school);
    }

    @Override
    public List<SchoolResponse> getAllSchools() {
        return schoolRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public SchoolResponse getSchoolById(UUID id) {

        School school = schoolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("School not found"));

        return mapToResponse(school);
    }

    @Override
    public SchoolResponse updateSchool(UUID id, SchoolRequest request) {

        School school = schoolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("School not found"));

        school.setName(request.getName());
        school.setCode(request.getCode());
        school.setDescription(request.getDescription());

        schoolRepository.save(school);

        return mapToResponse(school);
    }

    @Override
    public void deleteSchool(UUID id) {

        School school = schoolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("School not found"));

        schoolRepository.delete(school);
    }

    private SchoolResponse mapToResponse(School school) {

        return SchoolResponse.builder()
                .id(school.getId())
                .name(school.getName())
                .code(school.getCode())
                .description(school.getDescription())
                .build();
    }
}
