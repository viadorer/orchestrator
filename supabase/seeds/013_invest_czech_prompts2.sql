-- ===========================================
-- SEED: Invest Czech – Prompt Templates (část 2)
-- Content Strategy, Platform Rules, CTA, Quality
-- ===========================================

-- Projekt ID: a1b2c3d4-0002-4000-8000-000000000002

INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES

-- ---- CONTENT STRATEGY ----
('a1b2c3d4-0002-4000-8000-000000000002', 'content_strategy_invest_czech', 'content_strategy',
'STRATEGIE OBSAHU INVEST CZECH:
Content mix: 60 % edukace, 25 % soft-sell, 15 % hard-sell.

4 CONTENT PILLARS:

1. EDUKACE: JAK FUNGUJÍ INVESTIČNÍ NEMOVITOSTI (35 %):
   - Jak vybrat nemovitost, jak funguje hypotéka, jak počítat výnos.
   - Příklad: "Hrubý výnos vs čistý výnos. Jaký je skutečný výnos?"

2. DATA & TRENDY (25 %):
   - Čísla z trhu, trendy, srovnání měst, vývoj cen a nájmů.
   - Příklad: "Průměrný nájem 2+kk v Brně vzrostl o 12 % za rok."

3. SERVIS & PLATFORMA (25 % – soft-sell):
   - Jak funguje správa, garance nájmu, dashboard.
   - Příklad: "Co dělá správce, když nájemce neplatí? Takhle to řešíme."

4. PŘÍBĚHY & CASE STUDIES (15 % – hard-sell):
   - Modelové příklady, srovnání scénářů.
   - Příklad: "Byt v Brně za 3,8 mil. Nájem 17 500 Kč. Jak to dopadne za 25 let?"

PRAVIDLA:
- Střídej pilíře – nikdy 2x stejný za sebou.
- Po: Data. Út+Čt: Edukace. St: Servis. Pá: Case studies.',
'Strategie obsahu – 4 pilíře, data-driven', 40),

-- ---- PLATFORM: LinkedIn ----
('a1b2c3d4-0002-4000-8000-000000000002', 'platform_linkedin_ic', 'platform_rules',
'PRAVIDLA PRO LINKEDIN:
- Nejdůležitější platforma. Profesionální tón.
- Cílová skupina: manažeři, podnikatelé, IT profesionálové.
- Začni HODNOTOU – první 2 řádky musí zaujmout.
- Krátké odstavce (1-3 věty). Prázdné řádky.
- Délka: 1 200–2 200 znaků.
- Hashtagy: 3-5 na konci (#InvestCzech #investičnínemovitost).
- Emoji: střídmě (📊 🏠 ✅), max 2-3.

VZOR:
"Průměrný hrubý výnos z nájmu v Brně: 4,5 %.
Průměrný růst cen nemovitostí: 8 % ročně.

Ale kolik je ČISTÝ výnos po odečtení všech nákladů?

Správa, údržba, pojištění, daně, neobsazenost – to vše snižuje reálný výnos.

Proto je klíčové:
→ Profesionální správa (minimalizace nákladů)
→ Garance nájmu (eliminace neobsazenosti)
→ Transparentní reporting (přehled o skutečných číslech)

Jak počítáte výnos vy?

#InvestCzech #investičnínemovitost #výnosznájmu"',
'LinkedIn pravidla – profesionální, data-driven', 50),

-- ---- PLATFORM: Instagram ----
('a1b2c3d4-0002-4000-8000-000000000002', 'platform_instagram_ic', 'platform_rules',
'PRAVIDLA PRO INSTAGRAM:
- Vizuální platforma – image prompt POVINNÝ.
- Image styl: Moderní, čistý design. Modré tóny (#3b82f6). Čísla a grafy.
- Caption: max 1 000 znaků.
- Hashtagy: 10-15 na konci.
- Carousel formát pro edukaci:
  Slide 1: Hook (číslo/otázka)
  Slide 2-4: Edukace s daty
  Slide 5: Řešení (Invest Czech)
  Slide 6: CTA + logo

IMAGE PROMPT VZOR:
"Moderní minimalistický design, tmavě modrý gradient, velké bílé číslo 4,5% uprostřed, pod ním: průměrný výnos z nájmu v Brně. Profesionální, corporate styl."',
'Instagram pravidla – vizuální, carousel', 51),

-- ---- PLATFORM: Facebook ----
('a1b2c3d4-0002-4000-8000-000000000002', 'platform_facebook_ic', 'platform_rules',
'PRAVIDLA PRO FACEBOOK:
- Přátelštější tón než LinkedIn, stále expertní.
- Délka: 500–1 500 znaků.
- Otázky pro engagement.
- Hashtagy: max 5. Emoji: ano, střídmě.

VZOR:
"🏠 Kolik stojí správa investiční nemovitosti?

Většina vlastníků si správu dělá sama. Výsledek?
→ Hodiny komunikace s nájemcem
→ Stres při řešení závad
→ Riziko neplatícího nájemce

Profesionální správa stojí zlomek toho, co ušetříte na čase a nervech.

Zajímá vás, jak to funguje? 👉 investczech.cz

#InvestCzech #správanemovitostí"',
'Facebook pravidla – přátelský, engagement', 52),

-- ---- PLATFORM: X ----
('a1b2c3d4-0002-4000-8000-000000000002', 'platform_x_ic', 'platform_rules',
'PRAVIDLA PRO X/TWITTER:
- Max 280 znaků nebo thread.
- Ostré, faktické, názorové.
- Číslo + insight + otázka. Hashtagy: max 2.

VZOR (single):
"Výnos z nájmu v Brně: 4,5 %. Růst cen: 8 %/rok. Celkem: 12,5 %.
Spořicí účet: 4 %.
Matematika je jasná. Provedení je klíč.
#InvestCzech"

VZOR (thread):
"1/ Investiční nemovitost v ČR: co potřebujete vědět 🧵
2/ Hrubý výnos: 3,5–5,5 % podle města.
3/ + růst hodnoty: 8–10 % ročně. Celkem: 12–15 %.
4/ Ale: správa, údržba, daně snižují čistý výnos.
5/ Řešení? Profesionální správa + garance nájmu. investczech.cz"',
'X/Twitter pravidla – ostré, faktické', 53),

-- ---- CTA RULES ----
('a1b2c3d4-0002-4000-8000-000000000002', 'cta_invest_czech', 'cta_rules',
'PRAVIDLA PRO CTA:

ZAKÁZANÉ: "Investujte teď!", "Nepromeškejte!", "Změňte svůj život!", cokoliv agresivní.

POVOLENÉ:
- "Jak počítáte výnos z investiční nemovitosti?"
- "Zajímá vás, jak funguje garance nájmu?"
- "Domluvte si bezplatnou konzultaci na investczech.cz"
- "Jaké jsou vaše zkušenosti se správou pronájmu?"
- "Více na investczech.cz"

PRAVIDLA:
- Max 1 CTA per post.
- Edukační → otázka k diskuzi.
- Soft-sell → odkaz na investczech.cz.
- Hard-sell → výzva k bezplatné konzultaci.
- CTA musí vyplynout z obsahu.',
'CTA pravidla – profesionální, žádná agrese', 60),

-- ---- QUALITY CRITERIA ----
('a1b2c3d4-0002-4000-8000-000000000002', 'quality_invest_czech', 'quality_criteria',
'KRITÉRIA KVALITY – minimum overall: 7/10.

1. HODNOTA (10/10 váha): Post MUSÍ přinést konkrétní hodnotu. Pokud ne → max 4/10.
2. PROFESIONALITA TEST (10/10 váha): "Mohl by to říct CEO na konferenci?" Pokud NE → PŘEPIŠ.
3. FAKTICKÁ PŘESNOST (9/10 váha): Čísla z KB, vždy rozsah, žádné "zaručeně".
4. ANTI-SPAM TEST (9/10 váha): "Zní to jako reklama nebo expertní obsah?" Pokud reklama → PŘEPIŠ.
5. STRUKTURA (7/10 váha): Hook → Kontext → Řešení → CTA.
6. CTA PŘIROZENOST (6/10 váha): Musí vyplynout z obsahu.

POKUD POST NESPLŇUJE 7+ → PŘEGENEROVAT.',
'Kritéria kvality – CEO test, Anti-spam test', 70);
