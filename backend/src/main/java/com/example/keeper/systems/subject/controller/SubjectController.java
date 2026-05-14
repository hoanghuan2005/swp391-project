package com.example.keeper.systems.subject.controller;

import com.example.keeper.systems.subject.dto.request.CreateSubjectRequest;
import com.example.keeper.systems.subject.entity.Subject;
import com.example.keeper.systems.subject.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @PostMapping
    public Subject create(@RequestBody CreateSubjectRequest request) {
        return subjectService.create(request);
    }

    @GetMapping
    public List<Subject> getAll() {
        return subjectService.getAll();
    }

    @GetMapping("/{id}")
    public Subject getById(@PathVariable UUID id) {
        // @PathVariable giúp lấy cái ID từ trên đường dẫn (URL) xuống
        return subjectService.getById(id);
    }

    @DeleteMapping("/{id}")
    public Subject delete(@PathVariable UUID id) {
        return subjectService.delete(id);
    }

}
