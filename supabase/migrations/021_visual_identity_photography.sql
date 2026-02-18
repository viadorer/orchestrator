-- ===========================================
-- 021: Enhanced Visual Identity for Photography
--
-- Adds documentation for the extended visual_identity
-- JSONB schema on projects table. No schema change needed
-- since visual_identity is already JSONB — we just document
-- the new photography-related keys.
-- ===========================================

-- Document the extended visual_identity JSONB structure
COMMENT ON COLUMN projects.visual_identity IS '
Visual identity JSONB. Keys:
  -- Core brand colors & assets --
  primary_color      TEXT    e.g. "#1a1a2e"
  secondary_color    TEXT    e.g. "#16213e"
  accent_color       TEXT    e.g. "#e94560"
  text_color         TEXT    e.g. "#ffffff"
  font               TEXT    e.g. "Inter"
  logo_url           TEXT    URL to project logo
  style              TEXT    e.g. "minimal", "bold", "elegant"

  -- Photography & AI image generation (NEW) --
  photography_style       TEXT  e.g. "documentary", "editorial", "lifestyle", "minimal", "corporate"
  photography_mood        TEXT  e.g. "warm and authentic", "cool and professional", "energetic"
  photography_subjects    TEXT  e.g. "real Czech people, families, urban settings, home interiors"
  photography_avoid       TEXT  e.g. "no stock photo poses, no fake smiles, no clipart, no text overlays"
  photography_lighting    TEXT  e.g. "natural daylight", "golden hour", "studio soft light"
  photography_color_grade TEXT  e.g. "warm tones, slight film grain", "desaturated, muted palette"
  photography_reference   TEXT  e.g. "Similar to Apple product photography", "Czech street photography"
  brand_visual_keywords   TEXT  e.g. "trust, stability, modern Czech family, home ownership"
';

-- Add project_prompt_templates category for visual style
-- (no schema change needed, just a new category value)
COMMENT ON TABLE project_prompt_templates IS '
Per-project prompt templates. Categories:
  identity, communication, guardrail, business_rules,
  content_strategy, topic_boundaries, cta_rules,
  quality_criteria, personalization, examples,
  seasonal, competitor, legal, platform_rules,
  visual_style (NEW - photography/image generation instructions)
';
