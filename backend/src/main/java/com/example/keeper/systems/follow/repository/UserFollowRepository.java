package com.example.keeper.systems.follow.repository;

import com.example.keeper.systems.follow.entity.UserFollow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserFollowRepository extends JpaRepository<UserFollow, UUID> {

    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    Optional<UserFollow> findByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    Page<UserFollow> findByFollowingId(UUID followingId, Pageable pageable);

    List<UserFollow> findByFollowingId(UUID followingId);

    Page<UserFollow> findByFollowerId(UUID followerId, Pageable pageable);

    long countByFollowingId(UUID followingId);

    long countByFollowerId(UUID followerId);

    @Query("SELECT uf.following.id, COUNT(uf.id) as fcount FROM UserFollow uf GROUP BY uf.following.id ORDER BY fcount DESC")
    List<Object[]> findTopFollowingIds(Pageable pageable);
}
