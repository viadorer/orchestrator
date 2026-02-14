-- ===========================================
-- 011: Generation Context – Debug trace pro review
-- Ukládá proč Hugo vygeneroval daný post
-- ===========================================

-- Sloupec pro uložení kontextu generování
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS generation_context JSONB DEFAULT NULL;

-- Struktura generation_context:
-- {
--   "task_id": "uuid",
--   "content_type": "educational",
--   "content_type_reason": "4-1-1 rule: educational underrepresented",
--   "platform": "facebook",
--   "kb_entries_used": 12,
--   "kb_categories": ["product", "faq", "audience"],
--   "news_injected": 2,
--   "news_titles": ["ČSÚ: Inflace klesla", "..."],
--   "memory_types_loaded": ["kb_gaps", "mix_correction"],
--   "dedup_posts_checked": 50,
--   "pattern_used": "hook-context-cta",
--   "attempts": 1,
--   "editor_used": true,
--   "editor_changes": ["Zkrácen hook", "Přidán CTA"],
--   "media_matched": true,
--   "media_id": "uuid",
--   "media_similarity": 0.82,
--   "prompt_tokens_estimate": 3500,
--   "model": "gemini-2.0-flash",
--   "temperature": 0.8,
--   "auto_scheduled": true,
--   "human_topic": null,
--   "timestamp": "2026-02-14T12:00:00Z"
-- }

COMMENT ON COLUMN content_queue.generation_context IS 'Debug trace: proč a jak Hugo vygeneroval tento post (task_id, content_type_reason, kb_entries, news, attempts, editor, media match)';
