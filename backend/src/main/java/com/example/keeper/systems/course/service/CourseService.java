package com.example.keeper.systems.course.service;

import com.example.keeper.systems.course.dto.request.CreateCourseRequest;
import com.example.keeper.systems.course.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CourseService {

    Course create(CreateCourseRequest request);

    List<Course> getAll();

    Page<Course> search(String query, Pageable pageable);

    Course getById(UUID id);

    Course delete(UUID id);
}
