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
    private final com.example.keeper.systems.major.repository.MajorRepository majorRepository;
    private final com.example.keeper.systems.ai_flashcard.repository.FlashcardSetRepository flashcardSetRepository;
    private final com.example.keeper.systems.ai_quiz.repository.QuizRepository quizRepository;
    private final com.example.keeper.systems.document.repository.DocumentReviewRepository documentReviewRepository;

    private void populateCounts(Course course) {
        if (course == null) return;
        
        long fcCount = flashcardSetRepository.findByCourseIdAndStatus(course.getId(), "PUBLISHED").size();
        course.setFlashcardCount((int) fcCount);

        long qCount = quizRepository.findByCourseIdAndStatus(course.getId(), "PUBLISHED").size();
        course.setQuizCount((int) qCount);

        Double avgRating = documentReviewRepository.getAverageRatingByCourseId(course.getId());
        course.setAverageRating(avgRating != null ? avgRating : 0.0);

        Long revCount = documentReviewRepository.getReviewCountByCourseId(course.getId());
        course.setReviewCount(revCount != null ? revCount.intValue() : 0);
    }

    @Override
    public Course create(CreateCourseRequest request) {
        Course course = new Course();
        course.setCode(request.getCode());
        course.setName(request.getName());
        course.setDescription(request.getDescription());

        if (request.getMajorId() != null) {
            com.example.keeper.systems.major.entity.Major major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new RuntimeException("Major not found"));
            course.setMajor(major);
        }

        return courseRepository.save(course);
    }

    @Override
    public Course update(UUID id, CreateCourseRequest request) {
        Course course = getById(id);
        course.setCode(request.getCode());
        course.setName(request.getName());
        course.setDescription(request.getDescription());

        if (request.getMajorId() != null) {
            com.example.keeper.systems.major.entity.Major major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new RuntimeException("Major not found"));
            course.setMajor(major);
        } else {
            course.setMajor(null);
        }

        return courseRepository.save(course);
    }

    @Override
    public List<Course> getAll() {
        List<Course> list = courseRepository.findAll();
        list.forEach(this::populateCounts);
        return list;
    }

    @Override
    public Page<Course> search(String query, UUID majorId, Pageable pageable) {
        boolean hasQuery = query != null && !query.trim().isEmpty();
        boolean hasMajor = majorId != null;

        Page<Course> result;
        if (hasMajor) {
            if (hasQuery) {
                result = courseRepository.searchByMajorIdAndQuery(majorId, query.trim(), pageable);
            } else {
                result = courseRepository.findByMajorId(majorId, pageable);
            }
        } else {
            if (hasQuery) {
                String trimmed = query.trim();
                result = courseRepository.findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
                        trimmed,
                        trimmed,
                        pageable);
            } else {
                result = courseRepository.findAll(pageable);
            }
        }
        result.forEach(this::populateCounts);
        return result;
    }

    @Override
    public Course getById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Course not found with id: " + id));
        populateCounts(course);
        return course;
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
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Course not found with id: " + courseId));

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

        List<Course> list = user.getFollowedCourses();
        list.forEach(this::populateCounts);
        return list;
    }
}
