package com.example.keeper.systems.subject.service;

import com.example.keeper.systems.subject.dto.request.CreateSubjectRequest;
import com.example.keeper.systems.subject.entity.Subject;

import java.util.List;
import java.util.UUID;

public interface SubjectService {

    Subject create(CreateSubjectRequest request);

    List<Subject> getAll();

    Subject getById(UUID id);

    Subject delete(UUID id);
}