package com.example.keeper.systems.course.controller;

import com.example.keeper.systems.course.dto.request.CreateCourseRequest;
import com.example.keeper.systems.course.entity.Course;
import com.example.keeper.systems.course.service.CourseService;
import com.example.keeper.systems.document.entity.Document;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    public Course create(@RequestBody CreateCourseRequest request) {
        return courseService.create(request);
    }

    @GetMapping
    public Page<Course> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        return courseService.search(search, pageable);
    }

    @GetMapping("/all")
    public List<Course> getAllList() {
        return courseService.getAll();
    }

    @GetMapping("/{id}")
    public Course getById(@PathVariable UUID id) {
        return courseService.getById(id);
    }

    @DeleteMapping("/{id}")
    public Course delete(@PathVariable UUID id) {
        return courseService.delete(id);
    }

    @GetMapping("/{id}/documents")
    public Page<Document> getDocumentsByCourse(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1));

        return courseService.getDocumentsByCourse(id, pageable);
    }
}
