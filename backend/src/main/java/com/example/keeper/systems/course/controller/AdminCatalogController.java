package com.example.keeper.systems.course.controller;

import com.example.keeper.systems.course.dto.request.CreateCourseRequest;
import com.example.keeper.systems.course.service.CourseService;
import com.example.keeper.systems.school.entity.School;
import com.example.keeper.systems.school.repository.SchoolRepository;
import com.example.keeper.systems.major.entity.Major;
import com.example.keeper.systems.major.repository.MajorRepository;
import com.example.keeper.systems.tag.entity.Tag;
import com.example.keeper.systems.tag.repository.TagRepository;
import com.example.keeper.systems.auth.entity.Language;
import com.example.keeper.systems.auth.repository.LanguageRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/catalog")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final CourseService courseService;
    private final SchoolRepository schoolRepository;
    private final MajorRepository majorRepository;
    private final TagRepository tagRepository;
    private final LanguageRepository languageRepository;

    @PostMapping("/courses/import")
    public ResponseEntity<?> importCourses(@RequestBody List<CreateCourseRequest> requests) {
        try {
            courseService.importCourses(requests);
            return ResponseEntity.ok(Map.of("success", true, "message", "Courses imported successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/schools/import")
    public ResponseEntity<?> importSchools(@RequestBody List<Map<String, String>> requests) {
        try {
            for (Map<String, String> req : requests) {
                String code = req.get("code");
                String name = req.get("name");
                if (code == null || code.isBlank() || name == null || name.isBlank()) continue;
                code = code.trim().toUpperCase();

                if (schoolRepository.findByCode(code).isPresent()) continue;

                School s = new School();
                s.setCode(code);
                s.setName(name.trim());
                s.setDescription(req.getOrDefault("description", "").trim());
                schoolRepository.save(s);
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Schools imported successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/majors/import")
    public ResponseEntity<?> importMajors(@RequestBody List<Map<String, String>> requests) {
        try {
            for (Map<String, String> req : requests) {
                String code = req.get("code");
                String name = req.get("name");
                String schoolIdStr = req.get("schoolId");

                if (code == null || code.isBlank() || name == null || name.isBlank() || schoolIdStr == null || schoolIdStr.isBlank()) {
                    continue;
                }
                code = code.trim().toUpperCase();

                UUID schoolId = UUID.fromString(schoolIdStr.trim());
                School school = schoolRepository.findById(schoolId)
                        .orElseThrow(() -> new RuntimeException("School not found: " + schoolId));

                if (majorRepository.findBySchoolIdAndCode(schoolId, code).isPresent()) continue;

                Major m = new Major();
                m.setCode(code);
                m.setName(name.trim());
                m.setDescription(req.getOrDefault("description", "").trim());
                m.setSchool(school);
                majorRepository.save(m);
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Majors imported successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/tags/import")
    public ResponseEntity<?> importTags(@RequestBody List<Map<String, String>> requests) {
        try {
            for (Map<String, String> req : requests) {
                String name = req.get("name");
                if (name == null || name.isBlank()) continue;
                name = name.trim();

                if (tagRepository.findByNameIgnoreCase(name).isPresent()) continue;

                Tag t = new Tag();
                t.setName(name);
                tagRepository.save(t);
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Tags imported successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/languages/import")
    public ResponseEntity<?> importLanguages(@RequestBody List<Map<String, String>> requests) {
        try {
            for (Map<String, String> req : requests) {
                String code = req.get("code");
                String name = req.get("name");
                if (code == null || code.isBlank() || name == null || name.isBlank()) continue;
                code = code.trim().toUpperCase();

                if (languageRepository.existsByCodeIgnoreCase(code)) continue;

                Language l = new Language();
                l.setCode(code);
                l.setName(name.trim());
                languageRepository.save(l);
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Languages imported successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
