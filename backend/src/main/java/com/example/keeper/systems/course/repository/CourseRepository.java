package com.example.keeper.systems.course.repository;

import com.example.keeper.systems.course.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {
    Optional<Course> findByCode(String code);

    Page<Course> findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
            String code,
            String name,
            Pageable pageable);
}
