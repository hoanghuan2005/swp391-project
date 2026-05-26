package com.example.keeper.systems.ai_quiz.repository;

import com.example.keeper.systems.ai_quiz.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findByQuizId(UUID quizId);
}
