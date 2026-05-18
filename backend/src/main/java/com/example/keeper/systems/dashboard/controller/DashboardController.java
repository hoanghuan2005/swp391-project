package com.example.keeper.systems.dashboard.controller;

import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.dashboard.dto.DashboardStatsResponse;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.auth.repository.LanguageRepository;
import com.example.keeper.systems.school.repository.SchoolRepository;
import com.example.keeper.systems.course.repository.CourseRepository;
import com.example.keeper.systems.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    // Tiêm (Inject) 3 Repository vào để đếm số lượng
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final DocumentRepository documentRepository;
    private final SchoolRepository schoolRepository;
    private final TagRepository tagRepository;
    private final LanguageRepository languageRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        // Gọi hàm .count() của Spring Data JPA để lấy tổng số lượng
        DashboardStatsResponse stats = DashboardStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalCourses(courseRepository.count())
                .totalDocuments(documentRepository.count())
                .totalSchools(schoolRepository.count())
                .totalTags(tagRepository.count())
                .totalLanguages(languageRepository.count())
                .build();

        return ResponseEntity.ok(stats);
    }
}
