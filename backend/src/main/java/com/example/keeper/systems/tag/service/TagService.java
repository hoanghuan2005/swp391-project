package com.example.keeper.systems.tag.service;

import com.example.keeper.systems.tag.dto.request.CreateTagRequest;
import com.example.keeper.systems.tag.entity.Tag;

import java.util.List;
import java.util.UUID;

public interface TagService {

    Tag create(CreateTagRequest request);

    List<Tag> getAll();

    Tag getById(UUID id);

    Tag delete(UUID id);
}
