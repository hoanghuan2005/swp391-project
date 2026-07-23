package com.example.keeper.systems.follow.service;

import com.example.keeper.systems.follow.dto.FollowerFollowingResponse;
import com.example.keeper.systems.follow.dto.UserProfileSummaryResponse;
import com.example.keeper.systems.document.dto.response.DocumentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

public interface UserFollowService {
    void follow(UUID targetUserId, String currentEmail);
    void unfollow(UUID targetUserId, String currentEmail);
    Page<FollowerFollowingResponse> getFollowers(UUID userId, Pageable pageable, String currentEmail);
    Page<FollowerFollowingResponse> getFollowing(UUID userId, Pageable pageable, String currentEmail);
    boolean isFollowing(UUID targetUserId, String currentEmail);
    UserProfileSummaryResponse getUserProfileSummary(UUID userId, String currentEmail);
    List<FollowerFollowingResponse> getSuggestions(int limit, String currentEmail);
    List<DocumentResponse> getUserDocuments(UUID userId);
    List<com.example.keeper.systems.ai_quiz.dto.response.QuizResponse> getUserQuizzes(UUID userId);
    List<com.example.keeper.systems.ai_flashcard.dto.FlashcardSetResponse> getUserFlashcards(UUID userId);
}
