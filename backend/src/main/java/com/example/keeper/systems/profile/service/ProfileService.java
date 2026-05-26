package com.example.keeper.systems.profile.service;

import com.example.keeper.systems.profile.dto.request.ProfileUpdateRequest;
import com.example.keeper.systems.profile.dto.response.ProfileResponse;
import java.util.UUID;

public interface ProfileService {

    ProfileResponse getProfile(UUID userId);

    ProfileResponse updateProfile(UUID userId, ProfileUpdateRequest request);
}
