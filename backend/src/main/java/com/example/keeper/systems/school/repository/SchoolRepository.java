package com.example.keeper.systems.school.repository;

import com.example.keeper.systems.school.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SchoolRepository extends JpaRepository<School, UUID> {

    Optional<School> findByCode(String code);

    Optional<School> findByNameIgnoreCase(String name);

    boolean existsByCode(String code);
}
