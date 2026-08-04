package com.example.keeper.systems.auth.repository;

import com.example.keeper.systems.auth.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    Optional<SubscriptionPlan> findByCode(String code);

    Optional<SubscriptionPlan> findByCodeAndIsActiveTrue(String code);

    List<SubscriptionPlan> findByIsActiveTrue();
}
