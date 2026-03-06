-- Add AIO task types to agent_tasks constraint
ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS agent_tasks_task_type_check;

ALTER TABLE agent_tasks ADD CONSTRAINT agent_tasks_task_type_check CHECK (task_type IN (
  'generate_content',
  'generate_week_plan',
  'analyze_content_mix',
  'suggest_topics',
  'react_to_news',
  'quality_review',
  'sentiment_check',
  'dedup_check',
  'optimize_schedule',
  'kb_gap_analysis',
  'competitor_brief',
  'performance_report',
  'ab_variants',
  'publish',
  'retry',
  'imagen_generate',
  'engagement_learning',
  'visual_consistency_audit',
  'aio_schema_inject',
  'aio_visibility_audit',
  'aio_entity_audit'
));
