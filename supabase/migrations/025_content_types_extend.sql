-- ===========================================
-- 025: Rozšíření content_type constraint
-- Přidání všech platform-specific content types
-- ===========================================

-- Odstranit starý constraint
ALTER TABLE content_queue DROP CONSTRAINT IF EXISTS content_queue_content_type_check;

-- Přidat nový constraint s kompletním seznamem typů
ALTER TABLE content_queue ADD CONSTRAINT content_queue_content_type_check 
CHECK (content_type IN (
  -- Legacy types (backward compatibility)
  'educational',
  'soft_sell',
  'hard_sell',
  'news',
  'engagement',
  
  -- Platform-specific types
  'story',
  'social_proof',
  'bts',
  'local',
  'promo',
  'quick_tip',
  'insight',
  'data_post',
  'opinion',
  'case_study',
  'career',
  'standalone',
  'thread',
  'quote',
  'myth_vs_truth'
));
