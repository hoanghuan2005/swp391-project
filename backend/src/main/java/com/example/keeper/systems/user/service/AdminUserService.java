package com.example.keeper.systems.user.service;

import com.example.keeper.systems.user.dto.AdminUserDetailResponse;
import com.example.keeper.systems.user.dto.AdminUserListItemResponse;

import java.util.List;
import java.util.UUID;

public interface AdminUserService {

    List<AdminUserListItemResponse> getAllUsers();

    AdminUserDetailResponse getUserDetail(UUID id);
}
