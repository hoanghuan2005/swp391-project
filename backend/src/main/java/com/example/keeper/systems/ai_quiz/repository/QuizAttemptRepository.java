package com.example.keeper.systems.ai_quiz.repository;

import com.example.keeper.systems.ai_quiz.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {
    List<QuizAttempt> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<QuizAttempt> findByQuizIdAndUserIdOrderByCreatedAtDesc(UUID quizId, UUID userId);
}
