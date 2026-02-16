-- Migration 020: Prompt Observability
-- Reasoning steps logging for Hugo's decision-making process

-- 1. Add reasoning_steps column to agent_log
ALTER TABLE agent_log ADD COLUMN IF NOT EXISTS reasoning_steps JSONB;

-- 2. Add prompt_performance column for metrics
ALTER TABLE agent_log ADD COLUMN IF NOT EXISTS prompt_performance JSONB;

-- 3. Index for fast filtering by action + reasoning analysis
CREATE INDEX IF NOT EXISTS idx_agent_log_action_created ON agent_log (action, created_at DESC);

-- 4. Add comments for documentation
COMMENT ON COLUMN agent_log.reasoning_steps IS 'Intermediate reasoning steps: KB facts used, guardrails applied, hook selection, content type decision';
COMMENT ON COLUMN agent_log.prompt_performance IS 'Prompt metrics: tokens, latency, retry count, score breakdown';

-- Example reasoning_steps structure:
-- {
--   "kb_facts_used": ["fact_id_1", "fact_id_2"],
--   "kb_facts_available": 45,
--   "guardrails_applied": ["no_politics", "no_investment_advice"],
--   "guardrails_triggered": [],
--   "content_type_decision": {
--     "chosen": "educational",
--     "reason": "4-1-1 rule: educational underrepresented (20% vs 66% target)",
--     "alternatives": ["soft_sell", "hard_sell"]
--   },
--   "hook_selection": {
--     "type": "statistic",
--     "text": "1,37 milionu Čechů...",
--     "alternatives_considered": ["question", "contrast"]
--   },
--   "prompts_used": {
--     "identity": 1,
--     "communication": 2,
--     "guardrail": 3,
--     "business_rules": 1
--   },
--   "editor_review": {
--     "triggered": true,
--     "changes_made": 2,
--     "score_improvement": 0.5
--   },
--   "visual_decision": {
--     "type": "generated_image",
--     "reason": "forcePhoto=true",
--     "imagen_prompt": "..."
--   }
-- }

-- Example prompt_performance structure:
-- {
--   "total_tokens": 4500,
--   "prompt_tokens": 3200,
--   "completion_tokens": 1300,
--   "latency_ms": 3400,
--   "retry_count": 0,
--   "model": "gemini-2.0-flash",
--   "temperature": 0.8,
--   "scores": {
--     "creativity": 8,
--     "tone_match": 9,
--     "hallucination_risk": 2,
--     "value_score": 8,
--     "overall": 8
--   }
-- }
