-- ============================================
-- Přidání kategorie 'editor_rules' do project_prompt_templates
-- ============================================

ALTER TABLE project_prompt_templates DROP CONSTRAINT IF EXISTS project_prompt_templates_category_check;
ALTER TABLE project_prompt_templates ADD CONSTRAINT project_prompt_templates_category_check
  CHECK (category IN (
    'identity',
    'communication',
    'guardrail',
    'business_rules',
    'content_strategy',
    'platform_rules',
    'cta_rules',
    'topic_boundaries',
    'personalization',
    'quality_criteria',
    'examples',
    'seasonal',
    'competitor',
    'legal',
    'editor_rules'
  ));
