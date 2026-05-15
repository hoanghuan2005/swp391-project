package com.example.keeper.systems.tag.controller;

import com.example.keeper.systems.tag.dto.request.CreateTagRequest;
import com.example.keeper.systems.tag.entity.Tag;
import com.example.keeper.systems.tag.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @PostMapping
    public Tag create(@RequestBody CreateTagRequest request) {
        return tagService.create(request);
    }

    @GetMapping
    public List<Tag> getAll() {
        return tagService.getAll();
    }

    @GetMapping("/{id}")
    public Tag getById(@PathVariable UUID id) {
        return tagService.getById(id);
    }

    @DeleteMapping("/{id}")
    public Tag delete(@PathVariable UUID id) {
        return tagService.delete(id);
    }
}
