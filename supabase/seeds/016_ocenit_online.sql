-- ============================================
-- SEED: Ocenit.online
-- Projekt č. 5 – Kompletní nastavení + RSS
-- Tradiční online odhad nemovitostí (formulář)
-- ============================================

-- CLEANUP
DELETE FROM project_prompt_templates WHERE project_id = '28fb42a2-01f0-471d-a365-cf0440e9810e';
DELETE FROM knowledge_base WHERE project_id = '28fb42a2-01f0-471d-a365-cf0440e9810e';
DELETE FROM content_queue WHERE project_id = '28fb42a2-01f0-471d-a365-cf0440e9810e';
DELETE FROM agent_tasks WHERE project_id = '28fb42a2-01f0-471d-a365-cf0440e9810e';
DELETE FROM agent_log WHERE project_id = '28fb42a2-01f0-471d-a365-cf0440e9810e';
DELETE FROM post_history WHERE project_id = '28fb42a2-01f0-471d-a365-cf0440e9810e';
DELETE FROM rss_sources WHERE project_id = '28fb42a2-01f0-471d-a365-cf0440e9810e';
DELETE FROM projects WHERE id = '28fb42a2-01f0-471d-a365-cf0440e9810e';

-- ===========================================
-- 1. PROJEKT
-- ===========================================

INSERT INTO projects (
  id, name, slug, description,
  platforms, late_social_set_id,
  mood_settings, content_mix, constraints, semantic_anchors, style_rules,
  visual_identity, orchestrator_config,
  is_active
) VALUES (
  '28fb42a2-01f0-471d-a365-cf0440e9810e',
  'Ocenit.online',
  'ocenit-online',
  'Tradiční online odhad tržní ceny nemovitosti. Vyplňte formulář, získejte orientační ocenění zdarma. Bez AI chatbota - klasický přístup s profesionálním výstupem. Data z reálných transakcí v okolí. Lead generation pro realitní a hypoteční služby. Web: ocenit.online',

  ARRAY['facebook', 'instagram', 'linkedin', 'x'],
  NULL,

  '{"tone": "trustworthy", "energy": "calm", "style": "factual"}'::jsonb,

  '{"educational": 0.65, "soft_sell": 0.25, "hard_sell": 0.10}'::jsonb,

  '{
    "forbidden_topics": [
      "zaručená přesnost", "100% přesnost", "lepší než znalec",
      "nahrazuje znalecký posudek", "právně závazný odhad",
      "konkrétní jména konkurentů", "kritika realitních kanceláří",
      "spekulace s nemovitostmi", "rychlé zbohatnutí",
      "kryptoměny", "forex", "trading",
      "politická kritika", "osobní útoky",
      "AI asistent", "chatbot", "umělá inteligence"
    ],
    "mandatory_terms": [
      "orientační odhad", "tržní cena", "reálné prodeje",
      "zdarma", "nezávazně", "formulář", "report"
    ],
    "max_hashtags": 5
  }'::jsonb,

  ARRAY[
    'odhad nemovitosti', 'tržní cena', 'orientační ocenění',
    'reálné prodeje', 'data z katastru', 'zdarma nezávazně',
    'online formulář', 'znalecký posudek', 'hypotéka',
    'prodej nemovitosti', 'pronájem', 'ocenit.online'
  ],

  '{
    "start_with_question": true,
    "max_bullets": 4,
    "no_hashtags_in_text": true,
    "max_length": 2000,
    "start_with_number": true,
    "no_emojis": false,
    "no_exclamation_marks": false,
    "paragraph_max_sentences": 3,
    "conversational_tone": false
  }'::jsonb,

  '{
    "primary_color": "#1a365d",
    "secondary_color": "#2d3748",
    "accent_color": "#38a169",
    "text_color": "#ffffff",
    "font": "Inter",
    "logo_url": null,
    "style": "professional",
    "photography": {
      "style": "clean_real_estate",
      "subjects": ["modern_buildings", "city_panoramas", "house_exteriors", "neighborhood_views", "professional_documents"],
      "mood": "trustworthy_and_clean",
      "avoid": ["stock_photos_obvious", "overly_staged", "selfies"]
    }
  }'::jsonb,

  '{
    "enabled": false,
    "posting_frequency": "daily",
    "posting_times": ["08:30", "14:30"],
    "max_posts_per_day": 2,
    "content_strategy": "4-1-1",
    "auto_publish": false,
    "auto_publish_threshold": 8.5,
    "timezone": "Europe/Prague",
    "media_strategy": "auto",
    "platforms_priority": ["facebook", "linkedin", "instagram", "x"],
    "pause_weekends": false
  }'::jsonb,

  true
);

-- ===========================================
-- 2. KNOWLEDGE BASE
-- ===========================================

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

-- PRODUKT
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'product', 'Co je Ocenit.online',
'Ocenit.online je online služba pro orientační odhad tržní ceny nemovitosti. Uživatel vyplní jednoduchý formulář (typ, adresa, plocha, stav, dispozice), zadá email a během pár minut obdrží detailní report s odhadem ceny. Žádný chatbot, žádné čekání na operátora. Klasický, přehledný formulář a profesionální výstup. Odhad je zdarma a nezávazný.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'product', 'Jak funguje odhad',
'Proces ocenění na ocenit.online:
1. Uživatel vyplní formulář - typ nemovitosti, adresa, plocha, stav, dispozice
2. Systém ověří adresu a najde srovnatelné prodeje v okolí
3. Algoritmus vypočítá orientační tržní cenu na základě reálných transakcí
4. Uživatel zadá email pro doručení reportu
5. Report s odhadem, analýzou lokality a srovnáním cen přijde na email
Celý proces trvá 2-3 minuty. Bez registrace, bez závazků.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'product', 'Co obsahuje report',
'Detailní report z ocenit.online obsahuje:
- Orientační tržní cenu (rozmezí min-max)
- Cenu za m² v dané lokalitě
- Srovnání s podobnými nemovitostmi v okolí
- Průměrnou dobu prodeje v lokalitě
- Analýzu lokality (občanská vybavenost, doprava)
- Vývoj cen v dané oblasti za posledních 12 měsíců
- Doporučení dalšího postupu (prodej, koupě, refinancování)
Report je přehledný, profesionální a vhodný jako podklad pro rozhodování.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'product', 'Rozdíl oproti znaleckému posudku',
'Orientační odhad (ocenit.online): Rychlý (2-3 min), zdarma, online formulář, založený na statistickém srovnání, vhodný pro první orientaci a rozhodování. Není právně závazný.
Znalecký posudek: Zpracovává certifikovaný soudní znalec, právně závazný, potřebný pro banku (hypotéka), soud, dědictví, rozvod. Cena 3 000-8 000 Kč, trvá několik dní.
Ocenit.online je ideální první krok. Pro závazné ocenění doporučujeme certifikovaného odhadce.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'product', 'Proč formulář a ne chatbot',
'Ocenit.online používá tradiční formulářový přístup. Důvody:
- Přehlednost: Uživatel vidí všechna pole najednou, nic mu neunikne
- Rychlost: Vyplnění trvá 60 sekund, ne 5 minut konverzace
- Spolehlivost: Žádné nedorozumění, přesně strukturovaná data
- Soukromí: Žádná konverzace, žádné ukládání chatové historie
- Jednoduchost: Funguje na každém zařízení, žádné čekání na odpověď
Profesionální nástroj pro profesionální výsledek.', true),

-- FAKTORY CENY
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'data', 'Co ovlivňuje cenu nemovitosti',
'Hlavní faktory ovlivňující tržní cenu:
1. Lokalita (město, čtvrť, ulice, občanská vybavenost, doprava) - až 40 % vlivu
2. Velikost (užitná plocha, plocha pozemku) - až 25 % vlivu
3. Stav (novostavba, po rekonstrukci, původní, špatný) - až 15 % vlivu
4. Typ nemovitosti (byt, rodinný dům, pozemek)
5. Dispozice, patro, výtah, orientace (u bytů)
6. Konstrukce (cihla vs panel)
7. Energetická náročnost
8. Aktuální tržní podmínky (úrokové sazby, poptávka)
Rozdíl mezi lokalitami ve stejném městě může být 20-40 %.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'data', 'Průměrné ceny nemovitostí v ČR 2026',
'Orientační průměrné ceny bytů (únor 2026):
- Praha: 120-140 tis. Kč/m²
- Brno: 80-100 tis. Kč/m²
- Plzeň: 60-75 tis. Kč/m²
- Ostrava: 35-50 tis. Kč/m²
- Olomouc: 55-70 tis. Kč/m²
- České Budějovice: 55-65 tis. Kč/m²
- Liberec: 45-60 tis. Kč/m²
Ceny se liší podle lokality, stavu a dispozice. Novostavby jsou o 15-30 % dražší než starší byty.', true),

-- CÍLOVÁ SKUPINA
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'audience', 'Cílová skupina',
'Primární cílové skupiny ocenit.online:

1. PRODÁVAJÍCÍ (35-40 %): Vlastníci nemovitostí zvažující prodej. Potřebují znát reálnou tržní cenu. Věk 35-65 let. Chtějí rychlou odpověď bez závazků.

2. KUPUJÍCÍ (35-40 %): Lidé hledající nemovitost. Chtějí ověřit, jestli je nabídková cena férová. Věk 25-45 let. Často řeší i hypotéku.

3. INVESTOŘI (10-15 %): Hledají investiční nemovitost. Zajímá je poměr cena/nájem. Věk 30-55 let.

4. OSTATNÍ (5-10 %): Dědictví, rozvod, majetkové vyrovnání. Potřebují orientační hodnotu pro jednání.

Společný znak: Preferují rychlý, jednoduchý nástroj bez nutnosti telefonovat nebo chatovat.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'audience', 'Bolesti a motivace',
'PRODÁVAJÍCÍ: Neví za kolik nabídnout. Obava z podhodnocení nebo předražení. Nechce volat realitce. Chce nezávislý pohled.
KUPUJÍCÍ: Nejistota jestli je cena férová. Strach z přeplacení. Potřebuje podklad pro vyjednávání.
INVESTOŘI: Potřebují rychle porovnat více nemovitostí. Zajímá je ROI a výnosnost.
OBECNÉ: Nedůvěra k realitním kancelářím. Potřeba nezávislého odhadu. Preference online řešení bez osobního kontaktu. Chtějí mít kontrolu nad procesem.', true),

-- TRH
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'market', 'Trh nemovitostí ČR 2026',
'Aktuální situace:
- Stabilizace cen po poklesu v 2023-2024
- Hypoteční sazby: 4,5-5,5 % (únor 2026)
- Rostoucí poptávka díky postupnému snižování sazeb
- Nedostatek nabídky v atraktivních lokalitách
- Průměrná doba prodeje: Praha 60-90 dní, kraje 90-150 dní
- LTV limit: 80 % (90 % pro mladé do 36 let)
- DSTI limit: 45 %
Trh se oživuje, ale opatrně. Správné nacenění je klíčové pro úspěšný prodej.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'market', 'Konkurence v online odhadech',
'Hlavní konkurenti:
1. Realitní kanceláře - odhad zdarma jako lead magnet, ale subjektivní a vyžaduje schůzku
2. Znalci a odhadci - placené (3-8 tis. Kč), právně závazné, trvá dny
3. Online kalkulačky (Sreality, Bezrealitky) - zjednodušené, nepřesné, bez reportu
4. AI chatboti (odhad.online) - konverzační přístup, ale ne každý chce chatovat

Výhoda ocenit.online: Rychlý formulář, profesionální report, žádné čekání, žádný chatbot, žádné závazky. Pro lidi, kteří chtějí výsledek, ne konverzaci.', true),

-- PRÁVNÍ
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'legal', 'Právní status odhadu',
'Orientační odhad na ocenit.online je informativní služba založená na statistickém zpracování dat o transakcích s nemovitostmi. Není znaleckým posudkem ve smyslu zákona č. 36/1967 Sb. Pro právní účely (hypotéka, soud, dědictví) je nutný posudek certifikovaného soudního znalce. Odhad je orientační, nezávazný a zdarma.', true),

-- USP
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'usp', 'Proč ocenit.online',
'Hlavní výhody:
1. RYCHLOST: Formulář za 60 sekund, report za 2 minuty
2. JEDNODUCHOST: Žádný chatbot, žádná registrace, žádné volání
3. NEZÁVISLOST: Nejsme realitní kancelář, nemáme zájem na ceně
4. DATA: Odhad z reálných prodejů, ne z inzerátů
5. ZDARMA: Orientační odhad bez poplatků a závazků
6. PROFESIONÁLNÍ REPORT: Detailní analýza na email, ne jen číslo
7. SOUKROMÍ: Minimální sběr dat, žádná chatová historie', true),

-- CONTENT PATTERNS
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'general', 'Edukační posty - Cena nemovitosti',
'Formát: Praktický návod s konkrétními čísly
Struktura: Hook (číslo nebo otázka) → Kontext → 3-5 faktů → Příklad → CTA
Témata: Jak zjistit tržní cenu, co ovlivňuje cenu, jak poznat férovou cenu, rozdíl odhad vs posudek, jak připravit nemovitost k prodeji, kdy je nejlepší doba na prodej', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'general', 'Statistiky a trendy',
'Formát: Data-driven post s konkrétními čísly
Struktura: Překvapivé číslo → Data → Analýza → Co to znamená pro čtenáře → CTA
Témata: Vývoj cen v ČR, průměrná doba prodeje, vliv sazeb na ceny, nejžádanější lokality, poměr cena/nájem, novostavby vs starší byty', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'general', 'Mýty a fakta',
'Formát: Debunking s daty
Struktura: Mýtus → Realita → Důkaz (čísla) → Doporučení → CTA
Témata: "Cena na inzerátu = tržní cena" (ne), "Rekonstrukce vždy zvýší cenu" (ne nutně), "Realitka odhadne nejlépe" (ne vždy nezávisle), "Online odhad je nepřesný" (záleží na datech)', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'general', 'Praktické tipy',
'Formát: Rychlé rady s čísly
Struktura: "X věcí které..." → Tip + vysvětlení → Bonus → CTA
Témata: Jak zvýšit cenu před prodejem, chyby při nacenění, co zkontrolovat před koupí, jak vyjednat slevu, jak připravit byt na prohlídky, kdy refinancovat hypotéku', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'case_study', 'Příběhy z praxe',
'Formát: Krátký příběh s čísly (anonymizovaný)
Struktura: Situace → Problém → Řešení (správná cena) → Výsledek → Poučení → CTA
Témata: Prodej za správnou cenu vs předražení, jak investor našel výnosnou nemovitost, prvokupující a férová cena, dědictví a orientační ocenění', true),

-- FAQ
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'faq', 'Je odhad přesný?',
'Orientační odhad na ocenit.online je založen na reálných transakcích v okolí. Přesnost závisí na dostupnosti dat. V Praze a krajských městech je přesnost vysoká (±5-10 %). V menších obcích může být rozmezí širší (±10-20 %). Odhad je orientační – pro právní účely je nutný znalecký posudek. Pro rozhodování o prodeji nebo koupi je odhad dostatečně přesný.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'faq', 'Kolik to stojí?',
'Orientační odhad na ocenit.online je zcela zdarma. Žádné poplatky, žádné skryté náklady. Vyplníte formulář, zadáte email a report dostanete zdarma. Pokud budete potřebovat znalecký posudek (pro banku, soud), ten stojí 3 000-8 000 Kč a zpracovává ho certifikovaný soudní znalec.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'faq', 'Jak dlouho trvá odhad?',
'Vyplnění formuláře: 60-90 sekund. Zpracování a zaslání reportu na email: 2-3 minuty. Celkem do 5 minut od začátku do konce. Žádné čekání, žádné telefonáty, žádné schůzky. Rychlý a jednoduchý proces.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'faq', 'Potřebuji znalecký posudek?',
'Záleží na účelu:
- Pro rozhodování o prodeji/koupi: NE, stačí orientační odhad z ocenit.online
- Pro hypotéku: ANO, banka vyžaduje znalecký posudek
- Pro soud (rozvod, dědictví): ANO, nutný znalecký posudek
- Pro pojištění: Většinou stačí odhad, ale záleží na pojišťovně
- Pro vyjednávání s kupcem: NE, stačí orientační odhad jako podklad
Orientační odhad je ideální první krok. Znalecký posudek až když je nutný.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'faq', 'Co když nesouhlasím s odhadem?',
'Odhad je orientační a založený na statistických datech. Pokud nesouhlasíte:
1. Zkontrolujte zadané údaje (plocha, stav, dispozice) – chyba v zadání = chyba v odhadu
2. Porovnejte s aktuálními inzeráty v okolí – ale pozor, inzertní cena ≠ prodejní cena
3. Zvažte specifika vaší nemovitosti (výjimečná poloha, rekonstrukce, výhled)
4. Nechte si zpracovat znalecký posudek pro přesnější ocenění
Odhad je průměr z dat. Vaše nemovitost může být výjimka. Ale statistika je dobrý základ.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'faq', 'Budete mě kontaktovat?',
'NE. Ocenit.online je plně automatizovaná služba. Po zadání emailu dostanete report a to je vše. Žádné telefonáty, žádné nabídky služeb, žádný spam. Váš email používáme pouze pro doručení reportu. Pokud chcete další služby (realitka, hypotéka), můžete nás kontaktovat vy. Ale my vás nekontaktujeme.', true),

-- PROCESS
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'process', 'Jak připravit nemovitost k ocenění',
'Pro přesný odhad potřebujete:
1. ADRESA: Přesná adresa včetně čísla popisného
2. PLOCHA: Užitná plocha v m² (ne podlahová, ne zastavěná)
3. DISPOZICE: 1+kk, 2+1, 3+1, atd.
4. STAV: Novostavba / Po rekonstrukci / Dobrý / Původní / Špatný
5. TYP: Byt / Rodinný dům / Pozemek
6. PATRO (u bytů): Přízemí / 1-10 / 10+
7. VÝTAH (u bytů): Ano / Ne
Čím přesnější údaje, tím přesnější odhad. Pokud si nejste jisti plochou, změřte nebo najděte v katastru nemovitostí.', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'process', 'Co dělat po obdržení odhadu',
'Máte report z ocenit.online. Co dál?

PRODÁVAJÍCÍ:
1. Porovnejte odhad s vašimi očekáváními
2. Zkontrolujte aktuální inzeráty v okolí
3. Rozhodněte o prodejní ceně (odhad + 5-10 % pro vyjednávání)
4. Připravte nemovitost k prodeji (úklid, drobné opravy)
5. Zvažte realitní kancelář nebo prodej sami

KUPUJÍCÍ:
1. Porovnejte odhad s nabídkovou cenou
2. Pokud je nabídka výrazně nad odhadem, vyjednávejte
3. Nechte si zpracovat znalecký posudek před podpisem smlouvy
4. Ověřte stav nemovitosti osobní prohlídkou
5. Zajistěte financování (hypotéka, vlastní zdroje)', true),

('28fb42a2-01f0-471d-a365-cf0440e9810e', 'process', 'Kdy je nejlepší doba na prodej',
'Faktory ovlivňující prodej:
1. SEZÓNA: Jaro (březen-květen) a podzim (září-říjen) = nejvyšší poptávka. Léto a zima = nižší aktivita.
2. ÚROKOVÉ SAZBY: Nízké sazby = vyšší poptávka. Vysoké sazby = nižší poptávka.
3. LOKÁLNÍ TRH: Sledujte dobu prodeje v okolí. Pokud se byty prodávají rychle, je dobrá doba.
4. OSOBNÍ SITUACE: Někdy je nutné prodat rychle (stěhování, finance). Pak je nejlepší doba = teď.
Ideální: Jaro/podzim + klesající sazby + dobře nacenění. Ale nečekejte na dokonalý moment – ten neexistuje.', true);

-- ===========================================
-- 3. PROMPT TEMPLATES
-- ===========================================

INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES

-- IDENTITY
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'identity_ocenit', 'identity',
'KDO JSEM:
- Jsem Hugo – content specialista projektu ocenit.online.
- Tvořím obsah o nemovitostech, cenách a trhu s bydlením.
- Komunikuji věcně, profesionálně, s konkrétními čísly.
- Vždy mluvím česky s háčky a čárkami.

OSOBNOST:
- Důvěryhodný a klidný. Žádné hype, žádné vykřičníky.
- Data-driven – vždy čísla, fakta, srovnání.
- Praktický – rady které čtenář může hned použít.
- Nezávislý – nejsme realitka, nemáme zájem na ceně.

MISE:
Pomáháme lidem zjistit reálnou tržní cenu jejich nemovitosti.
Rychle, jednoduše, zdarma. Formulář, ne chatbot.
Profesionální report, ne konverzace.',
'Identita Hugo pro Ocenit.online', 10),

-- COMMUNICATION
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'communication_ocenit', 'communication',
'PRAVIDLA KOMUNIKACE:
- Piš VÝHRADNĚ česky s háčky a čárkami
- Tón: Věcný, klidný, profesionální. Žádný hype.
- Vždy konkrétní čísla – "ceny bytů v Brně vzrostly o 8 %", ne "ceny rostou"
- Krátké odstavce, max 2-3 věty
- Čísla formátuj česky: 1 000 000 Kč, 85 m²

STRUKTURA POSTU:
1. HOOK: Konkrétní číslo nebo překvapivý fakt (ne otázka typu "Věděli jste?")
2. KONTEXT: Proč je to důležité pro čtenáře
3. DATA: 2-3 konkrétní fakta nebo statistiky
4. AKCE: Co s tím může čtenář udělat
5. CTA: Odkaz na ocenit.online nebo otázka pro engagement

TÓNOVÉ ROZDÍLY OD ODHAD.ONLINE:
- Ocenit.online = věcný, faktický, klidný, profesionální
- Žádné "přátelské povídání", žádné emotikony v textu
- Spíš noviny než kamarád. Spíš Hospodářky než Instagram.
- Důraz na jednoduchost procesu: "Vyplňte formulář, získejte report"

ZAKÁZANÉ FRÁZE:
- "V dnešní době...", "Není žádným tajemstvím..."
- "Skvělé!", "Super!", "Výborně!"
- "AI asistent", "chatbot", "umělá inteligence"
- "Zázračný", "revoluční", "unikátní"',
'Komunikační pravidla Ocenit.online', 20),

-- BUSINESS RULES
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'business_rules_ocenit', 'business_rules',
'OBCHODNÍ PRAVIDLA:

PRIMÁRNÍ CÍL: Přivést uživatele na ocenit.online k vyplnění formuláře.
SEKUNDÁRNÍ CÍL: Získat email pro report → lead pro realitní/hypoteční služby.

CTA STRATEGIE:
- Edukační post → "Zjistěte cenu vaší nemovitosti na ocenit.online" nebo engagement otázka
- Statistický post → "Jak je na tom vaše nemovitost? Odhad zdarma na ocenit.online"
- Tip/návod → "První krok? Zjistit reálnou cenu. ocenit.online – formulář za 60 sekund"

KLÍČOVÉ SDĚLENÍ:
- Formulář za 60 sekund (ne chatbot, ne telefonát)
- Report na email za 2 minuty
- Data z reálných prodejů (ne z inzerátů)
- Zdarma a nezávazně
- Nezávislý odhad (nejsme realitka)

CROSS-SELL (po získání leadu):
- Hypoteční poradenství (hypoteeka.cz)
- Prověření nájemníka (prescoring.com)
- Certifikovaný znalecký posudek (doporučení partnera)',
'Obchodní pravidla Ocenit.online', 25),

-- GUARDRAIL
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'guardrail_ocenit', 'guardrail',
'BEZPEČNOSTNÍ PRAVIDLA:
- Odhad je ORIENTAČNÍ, ne právně závazný
- Pro závazný posudek doporučujeme certifikovaného znalce
- NIKDY neuvádej "přesný odhad" nebo "garantovaná cena"
- NIKDY nedávej právní ani daňové rady
- NIKDY nekritizuj konkurenci jménem
- NIKDY nezmiňuj AI, chatbot, umělou inteligenci (to je odhad.online)
- Odhad je vždy ROZMEZÍ, nikdy jedna částka

POVINNÉ DISCLAIMERY:
- Při zmínce cen: "Orientační údaj na základě reálných transakcí"
- Při zmínce hypotéky: "Orientační výpočet, konkrétní podmínky stanoví banka"

ZAKÁZANÝ OBSAH:
- "Zaručená přesnost", "100% přesný"
- "Lepší než znalec"
- Spekulace, get-rich-quick, krypto, forex
- Politika, osobní útoky
- Clickbait bez hodnoty',
'Guardrails Ocenit.online', 30),

-- CONTENT STRATEGY
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'content_strategy_ocenit', 'content_strategy',
'STRATEGIE OBSAHU:
Content mix: 65 % edukace, 25 % soft-sell, 10 % hard-sell.

EDUKAČNÍ OBSAH (65 %):
- Statistiky a trendy trhu (ceny, sazby, doba prodeje)
- Faktory ovlivňující cenu nemovitosti
- Praktické tipy pro prodávající a kupující
- Mýty a fakta o cenách nemovitostí
- Srovnání lokalit a typů nemovitostí

SOFT-SELL (25 %):
- Příběhy z praxe (správná cena = rychlý prodej)
- Proč je důležité znát reálnou cenu
- Výhody nezávislého odhadu
- Jak report z ocenit.online pomáhá při rozhodování

HARD-SELL (10 %):
- "Zjistěte cenu za 60 sekund na ocenit.online"
- "Formulář → Report → Rozhodnutí"
- Přímé CTA na vyplnění formuláře

SPECIFIKA PLATFOREM:
- FACEBOOK: Delší texty, statistiky, tipy pro rodiny, 35-60 let
- LINKEDIN: Profesionální, investiční pohled, data, trendy trhu
- INSTAGRAM: Infografiky s čísly, krátké tipy, vizuální srovnání
- X: Jedno číslo + kontext, rychlé fakty, trendy',
'Content strategie Ocenit.online', 40);

-- ===========================================
-- 4. RSS FEEDY
-- ===========================================

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- NEMOVITOSTI & REALITY
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Hospodářské noviny - Reality', 'https://reality.ihned.cz/?m=rss', 'nemovitosti', true, 6),
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'iDNES.cz - Bydlení', 'https://www.idnes.cz/bydleni/rss', 'bydleni', true, 6),
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Novinky.cz - Bydlení', 'https://www.novinky.cz/rss/sekce/11', 'bydleni', true, 12),
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Kurzy.cz - Reality', 'https://www.kurzy.cz/rss/reality/', 'nemovitosti', true, 12),

-- HYPOTÉKY & FINANCE
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Hypoindex.cz', 'https://www.hypoindex.cz/feed/', 'hypoteky', true, 12),
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Peníze.cz', 'https://www.penize.cz/rss', 'finance', true, 24),

-- EKONOMIKA & SAZBY
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'ČNB - Tiskové zprávy', 'https://www.cnb.cz/cs/rss/rss_tz.xml', 'cnb', true, 24),
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Hospodářské noviny - Ekonomika', 'https://ekonomika.ihned.cz/?m=rss', 'ekonomika', true, 12),
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'E15.cz - Finance', 'https://www.e15.cz/rss', 'finance', true, 12),

-- TRHY & CENY
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Bezrealitky.cz - Blog', 'https://www.bezrealitky.cz/blog/feed', 'reality_blog', true, 24),

-- STAVEBNICTVÍ
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'TZB-info - Bydlení', 'https://www.tzb-info.cz/rss/rss-bydleni', 'bydleni_tech', true, 24),

-- LEGISLATIVA
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Ministerstvo pro místní rozvoj', 'https://www.mmr.cz/cs/rss', 'legislativa', true, 24),

-- REGIONÁLNÍ
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Praha - iDNES', 'https://praha.idnes.cz/rss.aspx', 'praha', true, 24),
('28fb42a2-01f0-471d-a365-cf0440e9810e', 'Brno - iDNES', 'https://brno.idnes.cz/rss.aspx', 'brno', true, 24);

-- ===========================================
-- KONEC SEEDU
-- ===========================================
