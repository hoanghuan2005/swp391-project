package com.example.keeper.systems.course.controller;

import com.example.keeper.systems.course.entity.CourseChatMessage;
import com.example.keeper.systems.course.repository.CourseChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseChatController {

    private final CourseChatMessageRepository chatMessageRepository;

    @GetMapping("/{id}/messages")
    public List<CourseChatMessage> getChatHistory(@PathVariable UUID id) {
        return chatMessageRepository.findByCourseIdOrderByCreatedAtAsc(id);
    }
}
