package com.example.keeper.systems.course.service;

import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.course.dto.request.CreateCourseRequest;
import com.example.keeper.systems.course.entity.Course;
import com.example.keeper.systems.document.entity.Document;

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

    Page<Document> getDocumentsByCourse(UUID courseId, Pageable pageable);

    void followCourse(UUID courseId, UUID userId);

    void unfollowCourse(UUID courseId, UUID userId);

    boolean isFollowing(UUID courseId, UUID userId);

    List<Course> getMyCourses(UUID userId);
}
