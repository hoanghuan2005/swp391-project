package com.example.keeper.systems.tag.service;

import com.example.keeper.systems.tag.dto.request.CreateTagRequest;
import com.example.keeper.systems.tag.entity.Tag;
import com.example.keeper.systems.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

    @Override
    public Tag create(CreateTagRequest request) {
        Tag tag = new Tag();
        tag.setName(request.getName());

        return tagRepository.save(tag);
    }

    @Override
    public List<Tag> getAll() {
        return tagRepository.findAll();
    }

    @Override
    public Tag getById(UUID id) {
        return tagRepository.findById(id).orElseThrow();
    }

    @Override
    public Tag delete(UUID id) {
        Tag tag = getById(id);
        tagRepository.delete(tag);
        return tag;
    }
}
