-- ===========================================
-- 029: AIO Audit Citations — rozšíření pro multi-model visibility
-- Přidává citation_urls, search_results do aio_audits
-- Přidává citation_rate, prompts_with_citation do aio_scores
-- ===========================================

-- aio_audits: citace z Perplexity Sonar API
ALTER TABLE aio_audits ADD COLUMN IF NOT EXISTS citation_urls JSONB DEFAULT '[]';
ALTER TABLE aio_audits ADD COLUMN IF NOT EXISTS search_results JSONB DEFAULT '[]';

COMMENT ON COLUMN aio_audits.citation_urls IS 'URL citací naší domény z AI odpovědi (Perplexity vrací citations[]).';
COMMENT ON COLUMN aio_audits.search_results IS 'Search results z Perplexity kde se objevila naše doména [{title, url, date}].';

-- aio_scores: nové metriky
ALTER TABLE aio_scores ADD COLUMN IF NOT EXISTS citation_rate NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE aio_scores ADD COLUMN IF NOT EXISTS prompts_with_citation INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN aio_scores.citation_rate IS 'Procento testů kde AI citovala naši URL jako zdroj (0-100). Nejdůležitější metrika.';
COMMENT ON COLUMN aio_scores.prompts_with_citation IS 'Počet unikátních promptů kde byla naše URL citována.';

-- Index pro rychlé filtrování auditů s citacemi
CREATE INDEX IF NOT EXISTS idx_aio_audits_platform ON aio_audits(platform);
