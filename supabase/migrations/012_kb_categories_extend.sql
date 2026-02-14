-- ============================================
-- Rozšíření KB kategorií o: data, market, legal, process
-- ============================================
-- Původní CHECK povoloval jen: product, audience, usp, faq, case_study, general
-- Nové kategorie umožňují granulární třídění faktů v Knowledge Base

ALTER TABLE knowledge_base DROP CONSTRAINT IF EXISTS knowledge_base_category_check;
ALTER TABLE knowledge_base ADD CONSTRAINT knowledge_base_category_check
  CHECK (category IN (
    'product',     -- Produkt & Služba
    'audience',    -- Cílová skupina
    'usp',         -- Konkurenční výhoda
    'faq',         -- Otázky & Odpovědi
    'case_study',  -- Příběhy & Reference
    'data',        -- Čísla & Statistiky
    'market',      -- Trh & Trendy
    'legal',       -- Legislativa
    'process',     -- Jak to funguje
    'general'      -- Ostatní
  ));
