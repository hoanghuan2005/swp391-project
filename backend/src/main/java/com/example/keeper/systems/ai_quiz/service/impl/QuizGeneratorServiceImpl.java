package com.example.keeper.systems.ai_quiz.service.impl;

import com.example.keeper.systems.ai_ask.entity.DocumentChunk;
import com.example.keeper.systems.ai_ask.repository.DocumentChunkRepository;
import com.example.keeper.systems.auth.entity.User;
import com.example.keeper.systems.auth.repository.UserRepository;
import com.example.keeper.systems.document.entity.Document;
import com.example.keeper.systems.project.entity.Project;
import com.example.keeper.systems.project.repository.ProjectRepository;
import com.example.keeper.systems.ai_quiz.dto.request.QuizRequest;
import com.example.keeper.systems.ai_quiz.dto.response.QuestionDTO;
import com.example.keeper.systems.ai_quiz.dto.response.QuizResponse;
import com.example.keeper.systems.ai_quiz.entity.Question;
import com.example.keeper.systems.ai_quiz.entity.Quiz;
import com.example.keeper.systems.ai_quiz.repository.QuizRepository;
import com.example.keeper.systems.ai_quiz.service.QuizGeneratorService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizGeneratorServiceImpl implements QuizGeneratorService {

    private final QuizRepository quizRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public QuizResponse generateQuiz(QuizRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String context = fetchContext(request);

//        String aiResponse = geminiService.ask(buildPrompt(context));
        String aiResponse = "";
        
        // Clean response if AI wraps it in markdown blocks
//        String jsonContent = aiResponse.replaceAll("(?s)^.*?(\\[.*?\\]).*?$", "$1");
        String jsonContent = "";

        try {
            List<ParsedQuestion> parsedQuestions = objectMapper.readValue(jsonContent, new TypeReference<List<ParsedQuestion>>() {});

            Quiz quiz = new Quiz();
            quiz.setTitle(request.getTitle());
            quiz.setDocumentId(request.getDocumentId());
            quiz.setProjectId(request.getProjectId());
            quiz.setOwner(user);

            List<Question> questions = parsedQuestions.stream().map(pq -> {
                Question q = new Question();
                q.setQuiz(quiz);
                q.setContent(pq.getContent());
                q.setOptions(pq.getOptions());
                q.setCorrectAnswer(pq.getCorrectAnswer());
                q.setExplanation(pq.getExplanation());
                return q;
            }).collect(Collectors.toList());

            quiz.setQuestions(questions);

            Quiz savedQuiz = quizRepository.save(quiz);
            return mapToResponse(savedQuiz);

        } catch (Exception e) {
            log.error("Failed to parse AI generated quiz", e);
            throw new RuntimeException("AI failed to generate a valid quiz structure. Please try again.");
        }
    }

    private String fetchContext(QuizRequest request) {
        List<DocumentChunk> chunks;
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found"));
            List<UUID> docIds = project.getDocuments().stream().map(Document::getId).toList();
            chunks = documentChunkRepository.findByDocumentIdIn(docIds);
        } else {
            chunks = documentChunkRepository.findByDocumentId(request.getDocumentId());
        }

        String combined = chunks.stream()
                .map(DocumentChunk::getContent)
                .collect(Collectors.joining("\n\n"));

        // Limit to 20,000 characters
        return combined.length() > 20000 ? combined.substring(0, 20000) : combined;
    }

    private String buildPrompt(String context) {
        return """
                You are an expert educator. Based on the following DOCUMENT context, create exactly 5 challenging multiple-choice questions.
                
                STRICT OUTPUT FORMAT:
                A JSON array of objects. Do not include markdown code blocks, backticks, or extra text.
                
                JSON SCHEMA:
                [
                  {
                    "content": "Question text here",
                    "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
                    "correctAnswer": "Exact string from options that is correct",
                    "explanation": "Brief pedagogical explanation"
                  }
                ]

                DOCUMENT CONTEXT:
                %s
                """.formatted(context);
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

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .documentId(quiz.getDocumentId())
                .projectId(quiz.getProjectId())
                .ownerId(quiz.getOwner().getId())
                .createdAt(quiz.getCreatedAt())
                .questions(questionDTOs)
                .build();
    }

    // Helper static class for JSON parsing
    @lombok.Data
    private static class ParsedQuestion {
        private String content;
        private List<String> options;
        private String correctAnswer;
        private String explanation;
    }
}
