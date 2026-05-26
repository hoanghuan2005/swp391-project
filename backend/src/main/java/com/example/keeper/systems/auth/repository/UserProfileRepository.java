package com.example.keeper.systems.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.keeper.systems.profile.entity.UserProfile;

@Repository
public interface UserProfileRepository
        extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUserId(UUID userId);
}
