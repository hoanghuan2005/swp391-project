package com.example.keeper.systems.auth.repository;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.enums.SubscriptionTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByResetToken(String resetToken);

    Optional<User> findById(UUID id);

    @Query("select count(user) from User user where user.isBanned = :banned")
    long countByIsBannedValue(@Param("banned") boolean banned);

    long countBySubscriptionTier(SubscriptionTier subscriptionTier);
}
