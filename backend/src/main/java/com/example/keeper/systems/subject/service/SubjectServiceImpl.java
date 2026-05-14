package com.example.keeper.systems.subject.service;

import com.example.keeper.systems.subject.dto.request.CreateSubjectRequest;
import com.example.keeper.systems.subject.entity.Subject;
import com.example.keeper.systems.subject.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;

    @Override
    public Subject create(CreateSubjectRequest request) {
        // Chặn việc tạo trùng mã môn học (code)
        /*
        if (subjectRepository.findByCode(request.getCode()).isPresent()) {
            throw new RuntimeException("Mã môn học này đã tồn tại trong hệ thống!");
        }
        */

        Subject subject = new Subject();
        subject.setCode(request.getCode());
        subject.setName(request.getName());
        subject.setDescription(request.getDescription());

        return subjectRepository.save(subject);
    }

    @Override
    public List<Subject> getAll() {
        return subjectRepository.findAll();
    }

    @Override
    public Subject getById(UUID id) {
        return subjectRepository.findById(id).orElseThrow();
    }

    @Override
    public Subject delete(UUID id) {
        Subject subject = getById(id);

        subjectRepository.delete(subject);

        return subject;
    }
}
