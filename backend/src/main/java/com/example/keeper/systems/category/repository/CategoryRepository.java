package com.example.keeper.systems.category.repository;

import com.example.keeper.systems.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    Optional<Category> findByCode(String code);

    Optional<Category> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    List<Category> findByActiveTrue();
}
