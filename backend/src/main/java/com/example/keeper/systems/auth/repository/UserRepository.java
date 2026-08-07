package com.example.keeper.systems.auth.repository;

import com.example.keeper.systems.auth.entity.User;
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

    long countBySubscriptionTier(String subscriptionTier);

    java.util.List<User> findBySubscriptionTier(String subscriptionTier);

    @Query("SELECT u FROM User u JOIN u.followedCourses c WHERE c.id = :courseId")
    java.util.List<User> findUsersByFollowedCourseId(@Param("courseId") UUID courseId);

    java.util.List<User> findByRole_Name(String roleName);

    @Query("SELECT u FROM User u WHERE UPPER(u.role.name) = 'ADMIN' OR UPPER(u.role.name) = 'ROLE_ADMIN'")
    java.util.List<User> findAllAdmins();
}
