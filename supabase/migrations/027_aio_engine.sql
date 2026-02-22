-- ===========================================
-- 027: AIO Engine (AI Search Optimization)
-- Tabulky pro AI visibility, schema injection, entity management
-- ===========================================

-- Mapování projekt → GitHub repo pro schema injection
CREATE TABLE IF NOT EXISTS aio_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  github_repo TEXT NOT NULL,
  github_branch TEXT NOT NULL DEFAULT 'main',
  html_files TEXT[] NOT NULL DEFAULT '{index.html}',
  schema_types TEXT[] NOT NULL DEFAULT '{FAQ,Organization}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_injected_at TIMESTAMPTZ,
  last_commit_sha TEXT,
  entity_name TEXT,
  entity_description TEXT,
  same_as_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aio_sites_project ON aio_sites(project_id);

COMMENT ON TABLE aio_sites IS 'Mapování projektů na GitHub repozitáře pro AIO schema injection. Orchestrator přes GitHub REST API injektuje JSON-LD do statických HTML.';

-- Entity profily pro konzistentní AI identitu
CREATE TABLE IF NOT EXISTS aio_entity_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  official_name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  category TEXT,
  same_as JSONB DEFAULT '[]',
  keywords TEXT[],
  schema_org_json TEXT,
  consistency_issues JSONB DEFAULT '[]',
  last_audit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE aio_entity_profiles IS 'Entity profily pro AI identity. Konzistentní název, popis, sameAs linky (Wikidata, LinkedIn, Firmy.cz). Používá se při generování Organization schema.';

-- Testovací prompty pro AI visibility audit
CREATE TABLE IF NOT EXISTS aio_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'purchase_intent',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aio_prompts_project ON aio_prompts(project_id);

COMMENT ON TABLE aio_prompts IS 'Testovací prompty pro AI visibility audit. Kategorie: purchase_intent, comparison, how_to, pricing, recommendation.';

-- Výsledky prompt testů
CREATE TABLE IF NOT EXISTS aio_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES aio_prompts(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  platform TEXT NOT NULL,
  response TEXT,
  brand_mentioned BOOLEAN NOT NULL DEFAULT false,
  brand_position INTEGER,
  brand_context TEXT,
  is_source BOOLEAN DEFAULT false,
  citation_url TEXT,
  sentiment TEXT,
  competitors_mentioned JSONB DEFAULT '[]',
  missed_opportunity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aio_audits_project ON aio_audits(project_id);
CREATE INDEX IF NOT EXISTS idx_aio_audits_created ON aio_audits(created_at DESC);

COMMENT ON TABLE aio_audits IS 'Výsledky AI visibility auditů. Každý řádek = jeden prompt testovaný na jedné AI platformě (chatgpt/perplexity/gemini).';

-- Agregované visibility skóre per projekt per den
CREATE TABLE IF NOT EXISTS aio_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  visibility_score NUMERIC NOT NULL DEFAULT 0,
  share_of_voice NUMERIC NOT NULL DEFAULT 0,
  prompts_tested INTEGER NOT NULL DEFAULT 0,
  prompts_with_brand INTEGER NOT NULL DEFAULT 0,
  top_competitors JSONB DEFAULT '[]',
  platforms_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, score_date)
);

CREATE INDEX IF NOT EXISTS idx_aio_scores_project_date ON aio_scores(project_id, score_date DESC);

COMMENT ON TABLE aio_scores IS 'Týdenní/denní agregované AI visibility skóre. visibility_score 0-100, share_of_voice = % promptů kde se značka objeví.';

-- Detekované zmínky značky v médiích
CREATE TABLE IF NOT EXISTS aio_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_name TEXT,
  title TEXT,
  snippet TEXT,
  mention_type TEXT NOT NULL DEFAULT 'direct',
  sentiment TEXT DEFAULT 'neutral',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aio_mentions_project ON aio_mentions(project_id);

COMMENT ON TABLE aio_mentions IS 'Detekované zmínky značky v médiích a AI odpovědích. mention_type: direct/indirect/competitor. sentiment: positive/neutral/negative.';
