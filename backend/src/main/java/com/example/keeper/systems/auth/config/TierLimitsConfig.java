package com.example.keeper.systems.auth.config;

import com.example.keeper.systems.auth.enums.SubscriptionTier;

/**
 * Centralized configuration for subscription tier limits.
 * All tier-based limits should be defined here to avoid scattered hard-coded values.
 * A value of -1 means unlimited.
 */
public final class TierLimitsConfig {

    private TierLimitsConfig() {
        // Utility class — no instantiation
    }

    // ─── AI Usage ───────────────────────────────────────────
    public static final long FREE_DAILY_AI_LIMIT = 5;

    // ─── Flashcard Generation ───────────────────────────────
    public static final int FREE_MAX_FLASHCARDS_PER_GENERATION = 15;
    public static final int PRO_MAX_FLASHCARDS_PER_GENERATION = -1; // unlimited

    // ─── Quiz Generation ────────────────────────────────────
    public static final int FREE_MAX_QUIZ_QUESTIONS = 20;
    public static final int PRO_MAX_QUIZ_QUESTIONS = 50;

    // ─── Document Quota ─────────────────────────────────────
    public static final long FREE_DAILY_UPLOAD_LIMIT = 3;
    public static final long FREE_TOTAL_DOCUMENT_LIMIT = 20;
    public static final long FREE_MAX_FILE_SIZE = 10L * 1024 * 1024;   // 10 MB
    public static final long PRO_MAX_FILE_SIZE = 50L * 1024 * 1024;    // 50 MB

    // ─── Project / Workspace ────────────────────────────────
    public static final int FREE_MAX_OWNED_PROJECTS = 3;
    public static final int PRO_MAX_OWNED_PROJECTS = -1; // unlimited

    public static final int FREE_MAX_JOINED_PROJECTS = 5;
    public static final int PRO_MAX_JOINED_PROJECTS = -1; // unlimited

    // ─── Helper methods ─────────────────────────────────────

    public static int getMaxFlashcardsPerGeneration(SubscriptionTier tier) {
        return tier == SubscriptionTier.PRO
                ? PRO_MAX_FLASHCARDS_PER_GENERATION
                : FREE_MAX_FLASHCARDS_PER_GENERATION;
    }

    public static int getMaxQuizQuestions(SubscriptionTier tier) {
        return tier == SubscriptionTier.PRO
                ? PRO_MAX_QUIZ_QUESTIONS
                : FREE_MAX_QUIZ_QUESTIONS;
    }

    public static int getMaxOwnedProjects(SubscriptionTier tier) {
        return tier == SubscriptionTier.PRO
                ? PRO_MAX_OWNED_PROJECTS
                : FREE_MAX_OWNED_PROJECTS;
    }

    public static int getMaxJoinedProjects(SubscriptionTier tier) {
        return tier == SubscriptionTier.PRO
                ? PRO_MAX_JOINED_PROJECTS
                : FREE_MAX_JOINED_PROJECTS;
    }

    public static long getMaxFileSize(SubscriptionTier tier) {
        return tier == SubscriptionTier.PRO ? PRO_MAX_FILE_SIZE : FREE_MAX_FILE_SIZE;
    }

    public static long getDailyUploadLimit(SubscriptionTier tier) {
        return tier == SubscriptionTier.PRO ? -1 : FREE_DAILY_UPLOAD_LIMIT;
    }

    public static long getTotalDocumentLimit(SubscriptionTier tier) {
        return tier == SubscriptionTier.PRO ? -1 : FREE_TOTAL_DOCUMENT_LIMIT;
    }

    public static long getDailyAiLimit(SubscriptionTier tier) {
        return tier == SubscriptionTier.PRO ? -1 : FREE_DAILY_AI_LIMIT;
    }

    /**
     * Check if a limit value means "unlimited".
     */
    public static boolean isUnlimited(long limit) {
        return limit < 0;
    }
}
