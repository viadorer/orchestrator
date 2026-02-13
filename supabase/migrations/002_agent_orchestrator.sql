-- ===========================================
-- Agent Orchestrator - Autonomní správa projektů
-- ===========================================

-- ===========================================
-- AGENT TASKS (úkoly pro Huga per projekt)
-- ===========================================
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- Task definition
  task_type TEXT NOT NULL CHECK (task_type IN (
    'generate_content',     -- Vygeneruj post
    'generate_week_plan',   -- Naplánuj celý týden
    'analyze_content_mix',  -- Analyzuj co chybí v content mixu
    'suggest_topics',       -- Navrhni témata z KB
    'react_to_news',        -- Reaguj na novinku
    'quality_review',       -- Zkontroluj kvalitu draftu
    'sentiment_check',      -- Sentiment analysis před odesláním
    'dedup_check',          -- Kontrola duplicity napříč projekty
    'optimize_schedule',    -- Optimalizuj časy publikace
    'kb_gap_analysis',      -- Najdi mezery v Knowledge Base
    'competitor_brief',     -- Shrnutí co dělá konkurence
    'performance_report'    -- Report o výkonu obsahu
  )),
  -- Task parameters
  params JSONB DEFAULT '{}',
  -- Execution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5, -- 1 = highest
  -- Result
  result JSONB,
  error_message TEXT,
  -- Timing
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Recurrence (pro automatické úkoly)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- 'daily', 'weekly_mon', 'weekly_mon_wed_fri', 'monthly'
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_at_project ON agent_tasks(project_id);
CREATE INDEX idx_at_status ON agent_tasks(status) WHERE status IN ('pending', 'running');
CREATE INDEX idx_at_scheduled ON agent_tasks(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_at_recurring ON agent_tasks(next_run_at) WHERE is_recurring = true;

-- ===========================================
-- AGENT LOG (historie akcí agenta)
-- ===========================================
CREATE TABLE agent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  -- Log entry
  action TEXT NOT NULL, -- 'generated_post', 'approved_auto', 'detected_trend', 'flagged_quality'
  details JSONB DEFAULT '{}',
  -- AI interaction
  prompt_used TEXT,
  tokens_used INTEGER,
  model_used TEXT DEFAULT 'gemini-2.0-flash',
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_al_project ON agent_log(project_id, created_at DESC);

-- ===========================================
-- PROJECT SCHEDULES (publikační plán per projekt)
-- ===========================================
CREATE TABLE project_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- Schedule definition
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Monday
  time_slot TIME NOT NULL DEFAULT '09:00',
  platform TEXT NOT NULL,
  content_type TEXT DEFAULT 'educational',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ps_project ON project_schedules(project_id);

-- ===========================================
-- Rozšíření projects o agent settings
-- ===========================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS agent_settings JSONB DEFAULT '{
  "auto_generate": true,
  "auto_approve_threshold": 9,
  "posts_per_week": 5,
  "preferred_times": ["09:00", "12:00", "17:00"],
  "active_platforms": ["linkedin"],
  "news_monitoring": false,
  "rss_feeds": []
}';

ALTER TABLE projects ADD COLUMN IF NOT EXISTS agent_status JSONB DEFAULT '{
  "last_generation": null,
  "posts_this_week": 0,
  "avg_quality_score": null,
  "kb_entries_count": 0,
  "health": "idle"
}';

-- ===========================================
-- Rozšíření prompt_templates o agent prompty
-- ===========================================
ALTER TABLE prompt_templates DROP CONSTRAINT IF EXISTS prompt_templates_category_check;
ALTER TABLE prompt_templates ADD CONSTRAINT prompt_templates_category_check 
  CHECK (category IN ('system', 'role', 'tone', 'pattern', 'context', 'quality', 'agent'));

INSERT INTO prompt_templates (slug, name, content, category) VALUES
  ('agent_orchestrator', 'Agent Orchestrator', E'Jsi Hugo – autonomní AI agent pro správu marketingového obsahu.\n\nTvoje role:\n1. ANALYZUJEŠ stav každého projektu (co bylo publikováno, co chybí)\n2. PLÁNUJEŠ obsah podle 4-1-1 pravidla a content mixu\n3. GENERUJEŠ kvalitní příspěvky z Knowledge Base\n4. KONTROLUJEŠ kvalitu a unikátnost\n5. DOPORUČUJEŠ vylepšení strategie\n\nPři každém úkolu:\n- Pracuj POUZE s fakty z Knowledge Base\n- Dodržuj constraints (forbidden topics, mandatory terms)\n- Respektuj style sheet a tone of voice\n- Vrať strukturovaný JSON výstup', 'agent'),
  
  ('agent_week_planner', 'Week Planner', E'Vytvoř plán obsahu na příští týden pro tento projekt.\n\nPRAVIDLA:\n- Dodržuj content_mix poměr (educational/soft_sell/hard_sell)\n- Každý den max 1 post per platforma\n- Střídej content patterns (nepoužívej stejný vzor 2x za sebou)\n- Vyber témata z KB, která nebyla nedávno použita\n- Navrhni optimální časy publikace\n\nVrať JSON pole s objekty:\n[{"day": "monday", "platform": "linkedin", "content_type": "educational", "pattern": "The Step-by-Step", "topic_from_kb": "...", "brief": "Krátký popis co napsat"}]', 'agent'),
  
  ('agent_topic_suggester', 'Topic Suggester', E'Navrhni 5 témat pro příspěvky na základě Knowledge Base tohoto projektu.\n\nPRAVIDLA:\n- Vyber témata, která NEBYLA nedávno použita\n- Každé téma musí vycházet z konkrétního KB záznamu\n- Navrhni vhodný content pattern pro každé téma\n- Zohledni aktuální content mix (co chybí)\n\nVrať JSON pole:\n[{"topic": "...", "kb_entry_id": "...", "suggested_pattern": "...", "content_type": "...", "reasoning": "Proč toto téma teď"}]', 'agent'),
  
  ('agent_kb_analyzer', 'KB Gap Analyzer', E'Analyzuj Knowledge Base tohoto projektu a najdi mezery.\n\nZKONTROLUJ:\n- Má projekt dostatek faktů pro všechny content typy?\n- Chybí kategorie? (product, audience, usp, faq, case_study)\n- Jsou záznamy dostatečně detailní pro generování obsahu?\n- Jaká témata by měla být přidána?\n\nVrať JSON:\n{"completeness_score": 1-10, "missing_categories": [...], "suggestions": [...], "weak_entries": [...]}', 'agent'),
  
  ('agent_performance', 'Performance Reporter', E'Vytvoř report o výkonu obsahu pro tento projekt.\n\nANALYZUJ:\n- Kolik postů bylo publikováno za poslední týden/měsíc\n- Průměrné AI quality skóre\n- Rozložení content typů vs cílový mix\n- Které patterns fungují nejlépe (nejvyšší skóre)\n- Doporučení pro zlepšení\n\nVrať JSON:\n{"period": "...", "posts_count": N, "avg_score": N, "content_mix_actual": {...}, "top_patterns": [...], "recommendations": [...]}', 'agent');

-- ===========================================
-- RLS pro nové tabulky
-- ===========================================
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_full_access" ON agent_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON agent_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON project_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===========================================
-- Trigger pro updated_at
-- ===========================================
CREATE TRIGGER trg_agent_tasks_updated_at BEFORE UPDATE ON agent_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
