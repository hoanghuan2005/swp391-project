package com.example.keeper.systems.school.service;

import com.example.keeper.systems.school.dto.request.SchoolRequest;
import com.example.keeper.systems.school.dto.response.SchoolResponse;

import java.util.List;

public interface SchoolService {

    SchoolResponse createSchool(SchoolRequest request);

    List<SchoolResponse> getAllSchools();

    SchoolResponse getSchoolById(Long id);

    SchoolResponse updateSchool(Long id, SchoolRequest request);

    void deleteSchool(Long id);
}
