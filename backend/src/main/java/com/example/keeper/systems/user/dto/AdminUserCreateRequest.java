package com.example.keeper.systems.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminUserCreateRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    private String fullName;

    @NotBlank(message = "Role is required")
    private String role; // "STUDENT" or "ADMIN"

    private String subscriptionTier; // "FREE" or "PRO"
}
