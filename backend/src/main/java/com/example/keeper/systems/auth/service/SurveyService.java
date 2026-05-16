package com.example.keeper.systems.auth.service;

import java.util.UUID;

import com.example.keeper.systems.auth.dto.SurveyRequest;
import com.example.keeper.systems.auth.dto.SurveyResponse;

public interface SurveyService {

    SurveyResponse completeSurvey(
            UUID userId,
            SurveyRequest request
    );
}
