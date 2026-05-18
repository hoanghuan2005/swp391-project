package com.example.keeper.systems.course.service;

import com.example.keeper.systems.course.dto.request.CreateCourseRequest;
import com.example.keeper.systems.course.entity.Course;
import com.example.keeper.systems.course.repository.CourseRepository;
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
}
