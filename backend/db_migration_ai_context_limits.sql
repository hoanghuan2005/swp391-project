-- Migration script to add max_selected_docs and AI context limit columns to subscription_plans
ALTER TABLE subscription_plans ADD COLUMN max_selected_docs INT NOT NULL DEFAULT 2;
ALTER TABLE subscription_plans ADD COLUMN max_ai_context_chunks INT NOT NULL DEFAULT 4;
ALTER TABLE subscription_plans ADD COLUMN max_chunk_chars INT NOT NULL DEFAULT 400;

-- Explicitly update PRO plan limits
UPDATE subscription_plans 
SET max_selected_docs = 4, 
    max_ai_context_chunks = 8, 
    max_chunk_chars = 600 
WHERE code = 'PRO';
