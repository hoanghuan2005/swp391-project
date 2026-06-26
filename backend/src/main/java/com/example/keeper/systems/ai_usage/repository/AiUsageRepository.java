package com.example.keeper.systems.ai_usage.repository;

import com.example.keeper.systems.ai_usage.entity.AiUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AiUsageRepository extends JpaRepository<AiUsage, UUID> {
    long countByUserIdAndCreatedAtBetween(UUID userId, LocalDateTime start, LocalDateTime end);

    @Query("""
            select usage.feature, count(usage)
            from AiUsage usage
            where usage.user.id = :userId
              and usage.createdAt >= :start
              and usage.createdAt < :end
            group by usage.feature
            """)
    List<Object[]> countByFeatureForUserBetween(
            @Param("userId") UUID userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}
