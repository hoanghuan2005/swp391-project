package com.example.keeper.systems.school.service;

import com.example.keeper.systems.school.dto.request.SchoolRequest;
import com.example.keeper.systems.school.dto.response.SchoolResponse;

import java.util.List;
import java.util.UUID;

public interface SchoolService {

    SchoolResponse createSchool(SchoolRequest request);

    List<SchoolResponse> getAllSchools();

    SchoolResponse getSchoolById(UUID id);

    SchoolResponse updateSchool(UUID id, SchoolRequest request);

    void deleteSchool(UUID id);
}
