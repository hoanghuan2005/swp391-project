package com.example.keeper.systems.auth.repository;

import com.example.keeper.systems.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    Optional<User> findById(UUID id);
}