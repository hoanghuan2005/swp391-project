package com.example.keeper.systems.auth.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.keeper.systems.auth.entity.Language;

@Repository
public interface LanguageRepository
                extends JpaRepository<Language, UUID> {

        boolean existsByCodeIgnoreCase(String code);

        boolean existsByNameIgnoreCase(String name);
}
