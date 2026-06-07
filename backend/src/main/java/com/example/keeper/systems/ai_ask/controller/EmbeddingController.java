package com.example.keeper.systems.ai_ask.controller;

import com.example.keeper.systems.ai_ask.service.EmbeddingService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/embedding")
public class EmbeddingController {

    private final EmbeddingService service;

    public EmbeddingController(EmbeddingService service) {
        this.service = service;
    }

    @PostMapping("/embed")
    public float[] embed(@RequestBody String text) throws IOException {
        return service.embed(text);
    }

    @PostMapping("/save")
    public String save(@RequestBody String text) throws IOException {
        service.saveChunk(text);
        return "saved";
    }
}
