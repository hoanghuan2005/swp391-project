package com.example.keeper.systems.course.repository;

import com.example.keeper.systems.course.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {
    Optional<Course> findByCode(String code);

    Optional<Course> findByMajorIdAndCode(UUID majorId, String code);

    Page<Course> findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
            String code,
            String name,
            Pageable pageable);

    Page<Course> findByMajorId(UUID majorId, Pageable pageable);

    @Query("select c from Course c where c.major.id = :majorId and (lower(c.code) like lower(concat('%', :query, '%')) or lower(c.name) like lower(concat('%', :query, '%')))")
    Page<Course> searchByMajorIdAndQuery(@Param("majorId") UUID majorId, @Param("query") String query, Pageable pageable);
}
