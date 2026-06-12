package com.example.keeper.systems.ai_usage.repository;

import com.example.keeper.systems.ai_usage.entity.AiUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AiUsageRepository extends JpaRepository<AiUsage, UUID> {
    long countByUserIdAndCreatedAtBetween(UUID userId, LocalDateTime start, LocalDateTime end);
}
