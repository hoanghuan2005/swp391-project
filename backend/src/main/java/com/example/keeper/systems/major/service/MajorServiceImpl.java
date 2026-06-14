package com.example.keeper.systems.major.service;

import com.example.keeper.systems.major.dto.request.CreateMajorRequest;
import com.example.keeper.systems.major.dto.response.MajorResponse;
import com.example.keeper.systems.major.entity.Major;
import com.example.keeper.systems.major.repository.MajorRepository;
import com.example.keeper.systems.school.entity.School;
import com.example.keeper.systems.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MajorServiceImpl implements MajorService {

    private final MajorRepository majorRepository;
    private final SchoolRepository schoolRepository;

    @Override
    public MajorResponse create(CreateMajorRequest request) {
        if (request.getSchoolId() == null) {
            throw new IllegalArgumentException("School ID is required");
        }

        School school = schoolRepository.findById(request.getSchoolId())
                .orElseThrow(() -> new RuntimeException("School not found"));

        if (majorRepository.existsBySchoolIdAndCode(request.getSchoolId(), request.getCode())) {
            throw new RuntimeException("Major code already exists in this school");
        }

        Major major = Major.builder()
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .school(school)
                .build();

        majorRepository.save(major);
        return mapToResponse(major);
    }

    @Override
    public List<MajorResponse> getAll() {
        return majorRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<MajorResponse> getMajorsBySchool(UUID schoolId) {
        return majorRepository.findBySchoolId(schoolId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public MajorResponse getById(UUID id) {
        Major major = majorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Major not found"));
        return mapToResponse(major);
    }

    @Override
    public MajorResponse update(UUID id, CreateMajorRequest request) {
        Major major = majorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Major not found"));

        if (request.getSchoolId() != null && !request.getSchoolId().equals(major.getSchool().getId())) {
            School school = schoolRepository.findById(request.getSchoolId())
                    .orElseThrow(() -> new RuntimeException("School not found"));
            major.setSchool(school);
        }

        UUID schoolId = major.getSchool().getId();
        if (majorRepository.existsBySchoolIdAndCodeAndIdNot(schoolId, request.getCode(), id)) {
            throw new RuntimeException("Major code already exists in this school");
        }

        major.setName(request.getName());
        major.setCode(request.getCode());
        major.setDescription(request.getDescription());

        majorRepository.save(major);
        return mapToResponse(major);
    }

    @Override
    public void delete(UUID id) {
        Major major = majorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Major not found"));
        majorRepository.delete(major);
    }

    private MajorResponse mapToResponse(Major major) {
        return MajorResponse.builder()
                .id(major.getId())
                .name(major.getName())
                .code(major.getCode())
                .description(major.getDescription())
                .schoolId(major.getSchool().getId())
                .schoolName(major.getSchool().getName())
                .schoolCode(major.getSchool().getCode())
                .createdAt(major.getCreatedAt())
                .updatedAt(major.getUpdatedAt())
                .build();
    }
}
