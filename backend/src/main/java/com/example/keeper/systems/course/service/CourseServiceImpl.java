package com.example.keeper.systems.course.service;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.course.dto.request.CreateCourseRequest;
import com.example.keeper.systems.course.entity.Course;
import com.example.keeper.systems.course.repository.CourseRepository;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.repository.DocumentRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    @Override
    public Course create(CreateCourseRequest request) {
        Course course = new Course();
        course.setCode(request.getCode());
        course.setName(request.getName());
        course.setDescription(request.getDescription());

        return courseRepository.save(course);
    }

    @Override
    public List<Course> getAll() {
        return courseRepository.findAll();
    }

    @Override
    public Page<Course> search(String query, Pageable pageable) {
        if (query == null || query.trim().isEmpty()) {
            return courseRepository.findAll(pageable);
        }

        String trimmed = query.trim();
        return courseRepository.findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
                trimmed,
                trimmed,
                pageable);
    }

    @Override
    public Course getById(UUID id) {
        return courseRepository.findById(id).orElseThrow();
    }

    @Override
    public Course delete(UUID id) {
        Course course = getById(id);
        courseRepository.delete(course);
        return course;
    }

    @Override
    public Page<Document> getDocumentsByCourse(UUID courseId, Pageable pageable) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        return documentRepository.findByCourseId(course.getId(), pageable);
    }

    @Override
    @Transactional
    public void followCourse(UUID courseId, UUID userId) {

        Course course = getById(courseId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean alreadyFollowed = user.getFollowedCourses()
                .stream()
                .anyMatch(c -> c.getId().equals(courseId));

        if (!alreadyFollowed) {

            user.getFollowedCourses().add(course);

            userRepository.save(user);
        }
    }

    @Override
    public void unfollowCourse(UUID courseId, UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.getFollowedCourses()
                .removeIf(course -> course.getId().equals(courseId));

        userRepository.save(user);
    }

    @Override
    public boolean isFollowing(UUID courseId, UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getFollowedCourses()
                .stream()
                .anyMatch(course -> course.getId().equals(courseId));
    }

    @Override
    public List<Course> getMyCourses(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getFollowedCourses();
    }
}
