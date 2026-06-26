package com.example.keeper.systems.user.service;

import com.example.keeper.systems.user.dto.AdminUserListItemResponse;

import java.util.List;

public interface AdminUserService {

    List<AdminUserListItemResponse> getAllUsers();
}
