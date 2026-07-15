package com.example.keeper.systems.ai_quiz.service.impl;

import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.ai_quiz.dto.request.QuizRequest;
import com.example.keeper.systems.ai_quiz.dto.request.QuestionUpdateRequest;
import com.example.keeper.systems.ai_quiz.dto.request.QuizUpdateRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuestionDTO;
import com.example.keeper.systems.ai_quiz.dto.response.QuizResponse;
import com.example.keeper.systems.ai_quiz.entity.Quiz;
import com.example.keeper.systems.ai_quiz.entity.Question;
import com.example.keeper.systems.ai_quiz.repository.QuizRepository;
import com.example.keeper.systems.ai_quiz.service.QuizService;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.document.enums.Visibility;
import com.example.keeper.systems.document.repository.DocumentRepository;
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.project.repository.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Override
    @Transactional
    public QuizResponse createQuiz(QuizRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setDocumentId(request.getDocumentId());
        quiz.setProjectId(request.getProjectId());
        quiz.setOwner(user);

        Quiz savedQuiz = quizRepository.save(quiz);
        return mapToResponse(savedQuiz);
    }

    @Override
    @Transactional(readOnly = true)
    public QuizResponse getQuizById(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        boolean isOwner = quiz.getOwner().getId().equals(user.getId());
        boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());

        if (!isOwner && !isAdmin) {
            boolean hasAccess = false;
            if (quiz.getDocumentId() != null) {
                Document doc = documentRepository.findById(quiz.getDocumentId()).orElse(null);
                if (doc != null) {
                    if (doc.getVisibility() == Visibility.PUBLIC || doc.getUploadedBy().getId().equals(user.getId())) {
                        hasAccess = true;
                    } else {
                        hasAccess = projectRepository.hasUserAccessToDocumentThroughProjects(doc.getId(), user.getId());
                    }
                }
            } else if (quiz.getProjectId() != null) {
                boolean isProjectOwner = projectRepository.findById(quiz.getProjectId())
                        .map(p -> p.getOwner().getId().equals(user.getId())).orElse(false);
                boolean isProjectMember = projectMemberRepository.existsByProjectIdAndUserId(quiz.getProjectId(), user.getId());
                if (isProjectOwner || isProjectMember) {
                    hasAccess = true;
                }
            }
            if (!hasAccess) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this quiz.");
            }
        }
        return mapToResponse(quiz);
    }

    @Override
    @Transactional
    public QuizResponse updateQuiz(UUID id, QuizUpdateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        if (!quiz.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have permission to edit this quiz");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            throw new IllegalArgumentException("At least one question is required");
        }

        quiz.setTitle(request.getTitle().trim());
        if (request.getSavedToLibrary() != null) {
            quiz.setSavedToLibrary(request.getSavedToLibrary());
        }
        quiz.getQuestions().clear();
        for (QuestionUpdateRequest item : request.getQuestions()) {
            validateQuestion(item);
            Question question = new Question();
            question.setQuiz(quiz);
            question.setContent(item.getContent().trim());
            question.setOptions(item.getOptions().stream().map(String::trim).collect(Collectors.toList()));
            question.setCorrectAnswer(item.getCorrectAnswer().trim());
            question.setExplanation(item.getExplanation() != null ? item.getExplanation().trim() : "");
            quiz.getQuestions().add(question);
        }

        return mapToResponse(quizRepository.save(quiz));
    }

    private void validateQuestion(QuestionUpdateRequest question) {
        if (question == null || question.getContent() == null || question.getContent().isBlank()) {
            throw new IllegalArgumentException("Every question must have content");
        }
        if (question.getOptions() == null || question.getOptions().size() < 2
                || question.getOptions().stream().anyMatch(option -> option == null || option.isBlank())) {
            throw new IllegalArgumentException("Every question must have at least two non-empty options");
        }
        if (question.getCorrectAnswer() == null
                || !question.getOptions().contains(question.getCorrectAnswer())) {
            throw new IllegalArgumentException("Every correct answer must match one of its question options");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizResponse> getUserQuizzes(String userEmail, Boolean savedToLibrary) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Quiz> quizzes = quizRepository.findByOwnerId(user.getId());
        if (savedToLibrary != null) {
            quizzes = quizzes.stream()
                    .filter(q -> q.isSavedToLibrary() == savedToLibrary)
                    .collect(Collectors.toList());
        }

        return quizzes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteQuiz(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        if (!quiz.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to delete this quiz");
        }

        quizRepository.delete(quiz);
    }

    @Override
    @Transactional
    public QuizResponse renameQuiz(UUID id, String newTitle, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        if (!quiz.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You do not have permission to rename this quiz");
        }
        if (newTitle == null || newTitle.isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }

        quiz.setTitle(newTitle.trim());
        return mapToResponse(quizRepository.save(quiz));
    }

    @Override
    @Transactional
    public void publishQuiz(UUID id, UUID courseId, String visibility, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        if (!quiz.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to publish this quiz");
        }

        quiz.setCourseId(courseId);
        quiz.setVisibility(visibility != null ? visibility : "PRIVATE");
        quiz.setStatus("PUBLISHED");
        quiz.setSavedToLibrary(true);
        
        quizRepository.save(quiz);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizResponse> getCourseQuizzes(UUID courseId) {
        return quizRepository.findByCourseIdAndStatus(courseId, "PUBLISHED")
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private QuizResponse mapToResponse(Quiz quiz) {
        List<QuestionDTO> questionDTOs = quiz.getQuestions().stream()
                .map(q -> QuestionDTO.builder()
                        .id(q.getId())
                        .content(q.getContent())
                        .options(q.getOptions())
                        .correctAnswer(q.getCorrectAnswer())
                        .explanation(q.getExplanation())
                        .build())
                .collect(Collectors.toList());

        // Extract source document's course info for smart publish
        UUID documentCourseId = null;
        String documentCourseName = null;
        String documentCourseCode = null;
        if (quiz.getDocumentId() != null) {
            Document doc = documentRepository.findById(quiz.getDocumentId()).orElse(null);
            if (doc != null && doc.getCourse() != null) {
                documentCourseId = doc.getCourse().getId();
                documentCourseName = doc.getCourse().getName();
                documentCourseCode = doc.getCourse().getCode();
            }
        }

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .documentId(quiz.getDocumentId())
                .projectId(quiz.getProjectId())
                .ownerId(quiz.getOwner().getId())
                .courseId(quiz.getCourseId())
                .documentCourseId(documentCourseId)
                .documentCourseName(documentCourseName)
                .documentCourseCode(documentCourseCode)
                .createdAt(quiz.getCreatedAt())
                .questions(questionDTOs)
                .build();
    }
}
