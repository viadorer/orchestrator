-- ============================================
-- Problémový nájemník - Definice projektu
-- UUID: 1a99f995-7572-44c8-80a1-dec63aca3e22
-- ============================================

-- Vyčistit existující projekt
DELETE FROM project_prompt_templates WHERE project_id = '1a99f995-7572-44c8-80a1-dec63aca3e22';
DELETE FROM knowledge_base WHERE project_id = '1a99f995-7572-44c8-80a1-dec63aca3e22';
DELETE FROM rss_sources WHERE project_id = '1a99f995-7572-44c8-80a1-dec63aca3e22';
DELETE FROM content_queue WHERE project_id = '1a99f995-7572-44c8-80a1-dec63aca3e22';
DELETE FROM agent_tasks WHERE project_id = '1a99f995-7572-44c8-80a1-dec63aca3e22';
DELETE FROM agent_log WHERE project_id = '1a99f995-7572-44c8-80a1-dec63aca3e22';
DELETE FROM post_history WHERE project_id = '1a99f995-7572-44c8-80a1-dec63aca3e22';
DELETE FROM projects WHERE id = '1a99f995-7572-44c8-80a1-dec63aca3e22';

-- ============================================
-- PROJEKT
-- ============================================

INSERT INTO projects (
  id, name, slug, description,
  platforms, late_social_set_id,
  mood_settings, content_mix, constraints, semantic_anchors, style_rules,
  is_active
) VALUES (
  '1a99f995-7572-44c8-80a1-dec63aca3e22',
  'Problémový nájemník',
  'problemovy-najemnik',
  'Průvodce pro majitele bytů, kteří řeší obtížné situace s nájemníky. Empatický, věcný a odvážný obsah založený na faktech a konkrétních číslech. Pomáháme majitelům pochopit jejich práva a přijmout informované rozhodnutí.',

  ARRAY['facebook', 'linkedin', 'instagram'],
  NULL,

  -- Mood: Empatický, věcný, odvážný
  '{"tone": "empathetic", "energy": "medium", "style": "practical"}'::jsonb,

  -- Content Mix: 80% edukace, 20% lead capture
  '{"educational": 0.80, "soft_sell": 0.15, "hard_sell": 0.05}'::jsonb,

  -- Constraints
  '{
    "forbidden_topics": [
      "garantovaný výnos", "bezrizikové", "zbavte se všech starostí navždy",
      "exkluzivní nabídka", "limitovaná nabídka", "neváhejte ani den",
      "kritika nájemníků jako skupiny", "diskriminace", "strašení bez faktů",
      "přímá reklama konkrétní firmy", "MLM", "rychlé řešení",
      "absolutní sliby výsledků", "zaručené vystěhování", "vyhrajete soud"
    ],
    "mandatory_terms": [
      "konzultace s advokátem", "orientační kalkulace", "doporučujeme",
      "podle dat", "zpravidla", "v průměru", "historicky",
      "doporučujeme konzultaci", "každý případ je individuální"
    ],
    "max_hashtags": 5
  }'::jsonb,

  -- Semantic Anchors
  ARRAY[
    'problémový nájemník', 'neplatič', 'vyklizení', 'soudní vystěhování',
    'nájemní smlouva', 'předávací protokol', 'fotodokumentace', 'kauce',
    'výpověď z nájmu', 'prověření nájemníka', 'registr dlužníků',
    'právní poradenství', 'majitel bytu', 'pronajímatel',
    'nájemní právo', 'občanský zákoník', 'garantovaný nájem',
    'správa nemovitosti', 'problemovynajemnik.cz'
  ],

  -- Style Rules
  '{
    "start_with_question": false,
    "max_bullets": 3,
    "no_hashtags_in_text": true,
    "max_length": 1500,
    "start_with_number": false,
    "no_emojis": true,
    "no_exclamation_marks": false,
    "paragraph_max_sentences": 3,
    "use_disclaimers": true
  }'::jsonb,

  true
);
