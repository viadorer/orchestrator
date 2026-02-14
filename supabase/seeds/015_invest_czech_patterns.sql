-- ===========================================
-- SEED: Invest Czech – Content Patterns
-- Šablony struktury postů
-- ===========================================

INSERT INTO content_patterns (name, description, structure_template, example, is_active) VALUES

('IC: Číslo-Kontext-Řešení', 'Edukační post: číslo jako hook, kontext, řešení Invest Czech, CTA',
E'Hook: [ČÍSLO/FAKT] – konkrétní, z KB\nKontext: 2-3 věty proč je to důležité\nŘešení: Jak to Invest Czech řeší\nCTA: Otázka nebo odkaz',
E'Průměrný hrubý výnos z nájmu v Brně: 4,5 %.\n\nAle kolik je ČISTÝ výnos po odečtení všech nákladů?\n\nSpráva, údržba, pojištění, daně, neobsazenost – to vše snižuje reálný výnos.\n\nReálný čistý výnos: 2,5–3,5 %. K tomu růst hodnoty: historicky 8–10 % ročně.\n\nKlíč? Profesionální správa, která minimalizuje náklady.\n\nJak počítáte výnos vy?\n\n#InvestCzech #investičnínemovitost', true),

('IC: Problém-Řešení', 'Soft-sell post: běžný problém vlastníka, jak ho Invest Czech řeší',
E'Hook: Problém/bolest vlastníka\nBody: Proč je to problém (2-3 věty)\nŘešení: Jak to řeší Invest Czech\nCTA: Odkaz nebo otázka',
E'🏠 Neplatící nájemce. Noční můra každého vlastníka.\n\nCo děláte, když nájemce přestane platit? Upomínky, právník, soud, vyklizení. Měsíce bez příjmu.\n\nS garancí nájmu od Invest Czech dostáváte dohodnutý nájem i při neobsazenosti. A právní řešení? To je součástí správy.\n\nZajímá vás, jak garance funguje?\n\n#InvestCzech #garancenájmu', true),

('IC: Case Study', 'Hard-sell post: modelový příklad investice s konkrétními čísly',
E'Hook: Město + typ bytu + cena\nBody: Čísla (vlastní zdroje, hypotéka, splátka, nájem)\nZávěr: Výhled za 25 let\nCTA: Konzultace',
E'Byt 2+kk v Brně-Králově Poli.\n\nCena: 3 800 000 Kč\nVlastní zdroje (20 %): 760 000 Kč\nHypotéka: 3 040 000 Kč na 25 let\nSplátka: 19 200 Kč/měsíc\nNájem: 17 500 Kč/měsíc\n\nNájem pokrývá 91 % splátky. Po 25 letech: splacený byt v hodnotě 7–9 mil. Kč + čistý měsíční příjem.\n\nChcete spočítat svůj model? investczech.cz\n\n#InvestCzech #investičnínemovitost', true),

('IC: Srovnání A vs B', 'Edukační post: srovnání dvou přístupů/scénářů s čísly',
E'Hook: Dva scénáře\nBody A: Čísla scénáře A\nBody B: Čísla scénáře B\nZávěr: Faktické srovnání\nCTA: Otázka',
E'Správa nemovitosti: sám vs profesionálně.\n\nSám:\n→ 5+ hodin měsíčně (komunikace, údržba, vyúčtování)\n→ Riziko špatného nájemce\n→ Žádná garance příjmu\n→ Stres při problémech\n\nS Invest Czech:\n→ 0 hodin měsíčně\n→ Profesionální screening nájemců\n→ Garance nájmu\n→ Online dashboard s přehledem\n\nCo je pro vás cennější – čas, nebo pár procent z nájmu?\n\n#InvestCzech #správanemovitostí', true);
