-- ===========================================
-- Orchestrator - Master Schema
-- ===========================================

-- Vector extension pro kontrolu unikátnosti obsahu
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PROJECTS (59 projektů)
-- ===========================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  -- getLate.dev integration
  late_social_set_id TEXT,
  platforms TEXT[] DEFAULT '{linkedin}',
  -- AI & Content settings
  mood_settings JSONB DEFAULT '{"tone": "professional", "energy": "medium", "style": "informative"}',
  content_mix JSONB DEFAULT '{"educational": 0.66, "soft_sell": 0.17, "hard_sell": 0.17}',
  -- Constraints (Safe/Ban list)
  constraints JSONB DEFAULT '{"forbidden_topics": [], "mandatory_terms": [], "max_hashtags": 5}',
  -- Semantic Anchors
  semantic_anchors TEXT[] DEFAULT '{}',
  -- Style Sheet
  style_rules JSONB DEFAULT '{"start_with_question": false, "max_bullets": 3, "no_hashtags_in_text": false, "max_length": 2200}',
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- KNOWLEDGE BASE (fakta pro každý projekt)
-- ===========================================
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('product', 'audience', 'usp', 'faq', 'case_study', 'general')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_project ON knowledge_base(project_id);
CREATE INDEX idx_kb_category ON knowledge_base(project_id, category);

-- ===========================================
-- CONTENT PATTERNS (copywriting vzory)
-- ===========================================
CREATE TABLE content_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  structure_template TEXT NOT NULL,
  example TEXT,
  platforms TEXT[] DEFAULT '{linkedin,instagram,facebook,x,tiktok}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default patterns
INSERT INTO content_patterns (name, description, structure_template, platforms) VALUES
  ('The Contrarian', 'Zpochybni běžný názor v oboru', E'Hook: Kontroverzní tvrzení (1 věta)\nBody: 3 argumenty proč je běžný názor špatný\nCTA: Otázka na publikum', '{linkedin,x}'),
  ('The Step-by-Step', 'Návod krok za krokem', E'Hook: Problém, který řešíme\nBody: 3-5 očíslovaných kroků\nCTA: "Uložte si to na později"', '{linkedin,instagram,facebook}'),
  ('The Story', 'Osobní příběh s poučením', E'Hook: Dramatický začátek\nBody: Příběh (situace → problém → řešení)\nCTA: Poučení + otázka', '{linkedin,instagram,facebook}'),
  ('The Data Drop', 'Sdílení zajímavé statistiky', E'Hook: Šokující číslo/statistika\nBody: Kontext a co to znamená\nCTA: "Co si o tom myslíte?"', '{linkedin,x}'),
  ('The Hot Take', 'Rychlý názor na aktuální téma', E'Hook: Aktuální událost (1 věta)\nBody: Váš unikátní pohled (2-3 věty)\nCTA: Výzva k diskuzi', '{x,linkedin}'),
  ('The Listicle', 'Seznam tipů/nástrojů/zdrojů', E'Hook: "X věcí, které..."\nBody: Očíslovaný seznam s krátkým popisem\nCTA: "Kterou byste přidali?"', '{linkedin,instagram,facebook}'),
  ('The Case Study', 'Případová studie / úspěch', E'Hook: Výsledek (číslo)\nBody: Výchozí stav → Co jsme udělali → Výsledek\nCTA: Nabídka podobného řešení', '{linkedin,facebook}'),
  ('The Question', 'Engagement post – otázka', E'Hook: Provokativní otázka\nBody: Kontext proč se ptáme (1-2 věty)\nCTA: "Napište do komentářů"', '{linkedin,instagram,facebook,x}');

-- ===========================================
-- CONTENT QUEUE (fronta příspěvků)
-- ===========================================
CREATE TABLE content_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- Content
  text_content TEXT NOT NULL,
  image_prompt TEXT,
  image_url TEXT,
  alt_text TEXT,
  -- Metadata
  pattern_id UUID REFERENCES content_patterns(id),
  content_type TEXT DEFAULT 'educational' CHECK (content_type IN ('educational', 'soft_sell', 'hard_sell', 'news', 'engagement')),
  platforms TEXT[] DEFAULT '{linkedin}',
  -- AI Quality Score (self-rating)
  ai_scores JSONB DEFAULT '{}',
  -- {"creativity": 8, "tone_match": 10, "hallucination_risk": 1, "overall": 9}
  -- Status workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'sent', 'failed')),
  source TEXT DEFAULT 'ai_generated' CHECK (source IN ('ai_generated', 'manual', 'ai_news')),
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  late_post_id TEXT,
  -- Vector for dedup
  embedding vector(768),
  -- Priority (1 = highest)
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cq_project ON content_queue(project_id);
CREATE INDEX idx_cq_status ON content_queue(status);
CREATE INDEX idx_cq_scheduled ON content_queue(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_cq_review ON content_queue(status, project_id) WHERE status = 'review';

-- ===========================================
-- GLOBAL TRENDS (Contextual Pulse)
-- ===========================================
CREATE TABLE global_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  source_name TEXT,
  category TEXT,
  relevance_tags TEXT[] DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  trend_id UUID REFERENCES global_trends(id),
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  is_used BOOLEAN DEFAULT false,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- POST HISTORY (pro 4-1-1 tracking)
-- ===========================================
CREATE TABLE post_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  pattern_id UUID REFERENCES content_patterns(id),
  kb_entry_id UUID REFERENCES knowledge_base(id),
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ph_project ON post_history(project_id, posted_at DESC);

-- ===========================================
-- PROMPT TEMPLATES (modulární Lego systém)
-- ===========================================
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'system' CHECK (category IN ('system', 'role', 'tone', 'pattern', 'context', 'quality')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed core prompt templates
INSERT INTO prompt_templates (slug, name, content, category) VALUES
  ('system_role', 'System Role', E'Jsi Hugo – AI content orchestrátor. Tvým úkolem je vytvářet autentický, hodnotný obsah pro sociální sítě.\n\nPRAVIDLA:\n- Piš VÝHRADNĚ česky s háčky a čárkami\n- Nikdy nepoužívej generické fráze ("v dnešním dynamickém světě...")\n- Každý post musí přinést konkrétní hodnotu čtenáři\n- Dodržuj style sheet projektu\n- Respektuj forbidden topics', 'system'),
  ('quality_check', 'Quality Self-Rating', E'Po vygenerování obsahu ohodnoť svůj výstup:\n- creativity (1-10): Jak originální je obsah?\n- tone_match (1-10): Jak dobře odpovídá tone of voice projektu?\n- hallucination_risk (1-10): 1=čistá fakta z KB, 10=vymyšlené\n- value_score (1-10): Kolik hodnoty přináší čtenáři?\n- overall (1-10): Celkové hodnocení\n\nVrať jako JSON objekt.', 'quality'),
  ('dedup_instruction', 'Dedup Instruction', E'UNIKÁTNOST: Tento obsah NESMÍ být podobný nedávným postům. Vyhni se:\n- Stejným úvodním větám\n- Stejné struktuře jako poslední 3 posty\n- Opakování stejných faktů bez nového úhlu pohledu', 'context');

-- ===========================================
-- Updated_at trigger
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_kb_updated_at BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cq_updated_at BEFORE UPDATE ON content_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pt_updated_at BEFORE UPDATE ON prompt_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- RLS Policies (basic - admin has full access)
-- ===========================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (single admin)
CREATE POLICY "auth_full_access" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON knowledge_base FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON content_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON content_patterns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON global_trends FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON project_news FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON post_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON prompt_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
