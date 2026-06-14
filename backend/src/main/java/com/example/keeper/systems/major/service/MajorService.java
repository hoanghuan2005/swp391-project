package com.example.keeper.systems.major.service;

import com.example.keeper.systems.major.dto.request.CreateMajorRequest;
import com.example.keeper.systems.major.dto.response.MajorResponse;

import java.util.List;
import java.util.UUID;

public interface MajorService {
    MajorResponse create(CreateMajorRequest request);
    List<MajorResponse> getAll();
    List<MajorResponse> getMajorsBySchool(UUID schoolId);
    MajorResponse getById(UUID id);
    MajorResponse update(UUID id, CreateMajorRequest request);
    void delete(UUID id);
}
