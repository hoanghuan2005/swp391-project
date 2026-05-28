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
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final UserRepository userRepository;

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

    @PostMapping("/{id}/follow")
    public void followCourse(
            @PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        courseService.followCourse(id, user.getId());
    }

    @DeleteMapping("/{id}/follow")
    public void unfollowCourse(@PathVariable UUID id) {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        courseService.unfollowCourse(id, user.getId());
    }

    @GetMapping("/{id}/follow-status")
    public boolean isFollowing(@PathVariable UUID id) {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return courseService.isFollowing(id, user.getId());
    }

    @GetMapping("/followed")
    public List<Course> getMyCourses() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return courseService.getMyCourses(user.getId());
    }
}
