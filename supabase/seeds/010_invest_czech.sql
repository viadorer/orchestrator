-- ===========================================
-- SEED: Invest Czech (investczech.cz)
-- Projekt č. 2 – Kompletní nastavení
-- All-in-one platforma pro investiční nemovitosti
-- ===========================================

-- CLEANUP: Smazat existující projekt a všechna jeho data
DELETE FROM project_prompt_templates WHERE project_id IN (SELECT id FROM projects WHERE slug = 'invest-czech');
DELETE FROM knowledge_base WHERE project_id IN (SELECT id FROM projects WHERE slug = 'invest-czech');
DELETE FROM content_queue WHERE project_id IN (SELECT id FROM projects WHERE slug = 'invest-czech');
DELETE FROM agent_tasks WHERE project_id IN (SELECT id FROM projects WHERE slug = 'invest-czech');
DELETE FROM agent_log WHERE project_id IN (SELECT id FROM projects WHERE slug = 'invest-czech');
DELETE FROM post_history WHERE project_id IN (SELECT id FROM projects WHERE slug = 'invest-czech');
DELETE FROM projects WHERE slug = 'invest-czech';

-- 1. PROJEKT
-- ===========================================

INSERT INTO projects (
  id, name, slug, description,
  platforms, late_social_set_id,
  mood_settings, content_mix, constraints, semantic_anchors, style_rules,
  visual_identity, orchestrator_config,
  is_active
) VALUES (
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Invest Czech',
  'invest-czech',
  'Komplexní all-in-one platforma pro investiční nemovitosti v ČR. Nákup, hypotéka, správa nájemce, garance nájmu, správa pronájmu, tržní hodnota – vše pod jednou střechou. Web: investczech.cz',

  ARRAY['linkedin', 'instagram', 'facebook', 'x'],
  NULL, -- getLate social_set_id doplnit později

  -- Mood: Profesionální, důvěryhodný, expertní, přátelský
  '{"tone": "professional", "energy": "medium", "style": "informative"}'::jsonb,

  -- Content Mix: 60% edukace, 25% soft-sell, 15% hard-sell
  '{"educational": 0.60, "soft_sell": 0.25, "hard_sell": 0.15}'::jsonb,

  -- Constraints
  '{
    "forbidden_topics": [
      "zaručený výnos", "bez rizika", "pasivní příjem", "finanční svoboda",
      "get rich quick", "MLM", "rychlé zbohatnutí", "100% garance",
      "kryptoměny", "forex", "trading", "sázky",
      "konkrétní jména konkurentů", "osobní útoky",
      "politická kritika", "katastrofické scénáře bez řešení"
    ],
    "mandatory_terms": [
      "investiční nemovitost", "správa", "servis", "platforma",
      "hypotéka", "nájemce", "pronájem", "tržní hodnota"
    ],
    "max_hashtags": 5
  }'::jsonb,

  -- Semantic Anchors
  ARRAY[
    'investiční nemovitost', 'kompletní servis', 'správa pronájmu',
    'garance nájmu', 'hypoteční poradenství', 'tržní hodnota',
    'nákup nemovitosti', 'správa nájemce', 'all-in-one platforma',
    'investczech.cz', 'Invest Czech'
  ],

  -- Style Rules
  '{
    "start_with_question": false,
    "max_bullets": 5,
    "no_hashtags_in_text": true,
    "max_length": 2200,
    "start_with_number": false,
    "no_emojis": false,
    "no_exclamation_marks": false,
    "paragraph_max_sentences": 3
  }'::jsonb,

  -- Visual Identity
  '{
    "primary_color": "#0f172a",
    "secondary_color": "#1e293b",
    "accent_color": "#3b82f6",
    "text_color": "#ffffff",
    "font": "Inter",
    "logo_url": null,
    "style": "corporate"
  }'::jsonb,

  -- Orchestrator Config
  '{
    "enabled": false,
    "posting_frequency": "daily",
    "posting_times": ["09:00", "14:00"],
    "max_posts_per_day": 2,
    "content_strategy": "4-1-1",
    "auto_publish": false,
    "auto_publish_threshold": 8.0,
    "timezone": "Europe/Prague",
    "media_strategy": "auto",
    "platforms_priority": ["linkedin", "facebook", "instagram", "x"],
    "pause_weekends": true
  }'::jsonb,

  true
);
