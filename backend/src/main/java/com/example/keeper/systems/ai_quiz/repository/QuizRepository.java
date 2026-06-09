package com.example.keeper.systems.ai_quiz.repository;

import com.example.keeper.systems.ai_quiz.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {
    List<Quiz> findByOwnerId(UUID ownerId);
    List<Quiz> findByDocumentId(UUID documentId);
    List<Quiz> findByProjectId(UUID projectId);
    void deleteByProjectId(UUID projectId);
    List<Quiz> findByCourseIdAndStatus(UUID courseId, String status);
}
