-- ============================================
-- SEED: Hypoteeka.cz
-- Projekt č. 6 – Kompletní nastavení + RSS
-- Hypoteční platforma s AI asistentem Hugo
-- ============================================

-- CLEANUP
DELETE FROM project_prompt_templates WHERE project_id = '10c40bd7-1e51-4d22-8437-2529fbc3a866';
DELETE FROM knowledge_base WHERE project_id = '10c40bd7-1e51-4d22-8437-2529fbc3a866';
DELETE FROM content_queue WHERE project_id = '10c40bd7-1e51-4d22-8437-2529fbc3a866';
DELETE FROM agent_tasks WHERE project_id = '10c40bd7-1e51-4d22-8437-2529fbc3a866';
DELETE FROM agent_log WHERE project_id = '10c40bd7-1e51-4d22-8437-2529fbc3a866';
DELETE FROM post_history WHERE project_id = '10c40bd7-1e51-4d22-8437-2529fbc3a866';
DELETE FROM rss_sources WHERE project_id = '10c40bd7-1e51-4d22-8437-2529fbc3a866';
DELETE FROM projects WHERE id = '10c40bd7-1e51-4d22-8437-2529fbc3a866';

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
  '10c40bd7-1e51-4d22-8437-2529fbc3a866',
  'Hypoteeka.cz',
  'hypoteeka-cz',
  'Informační platforma pro svět hypoték a financování nemovitostí. AI asistent Hugo pomáhá s orientačními výpočty a propojuje klienty s certifikovanými specialisty. Schůzka se specialistou je zdarma a nezávazná. Služba specialisty je pro klienta zdarma - provizi platí banka. Web: hypoteeka.cz',

  ARRAY['facebook', 'instagram', 'linkedin', 'x'],
  NULL,

  '{"tone": "empathetic_professional", "energy": "calm_confident", "style": "conversational"}'::jsonb,

  '{"educational": 0.60, "soft_sell": 0.25, "hard_sell": 0.15}'::jsonb,

  '{
    "forbidden_topics": [
      "konkrétní sazby jako slib", "garantované schválení",
      "individuální poradenství", "doporučuji vám konkrétně",
      "akcie", "krypto", "forex", "pojištění mimo kontext hypotéky",
      "politická kritika", "osobní útoky na banky",
      "konkrétní jména konkurentů"
    ],
    "mandatory_terms": [
      "orientační výpočet", "certifikovaný specialista",
      "schůzka zdarma", "nezávazně", "obecně známé informace"
    ],
    "max_hashtags": 5
  }'::jsonb,

  ARRAY[
    'hypotéka', 'splátka', 'úroková sazba', 'fixace',
    'vlastní zdroje', 'LTV', 'DSTI', 'ČNB',
    'refinancování', 'bonita', 'nemovitost',
    'prvokupující', 'investiční nemovitost',
    'stavební spoření', 'specialista zdarma'
  ],

  '{
    "start_with_question": true,
    "max_bullets": 5,
    "no_hashtags_in_text": true,
    "max_length": 2200,
    "start_with_number": true,
    "no_emojis": true,
    "no_exclamation_marks": false,
    "paragraph_max_sentences": 3,
    "conversational_tone": true
  }'::jsonb,

  '{
    "primary_color": "#1e40af",
    "secondary_color": "#1e3a5f",
    "accent_color": "#f59e0b",
    "text_color": "#ffffff",
    "font": "Inter",
    "logo_url": null,
    "style": "professional_finance",
    "photography": {
      "style": "modern_real_estate",
      "subjects": ["happy_families", "modern_apartments", "city_views", "keys_handover", "professional_meetings"],
      "mood": "warm_trustworthy",
      "avoid": ["stock_photos_obvious", "sad_people", "empty_offices"]
    }
  }'::jsonb,

  '{
    "enabled": false,
    "posting_frequency": "daily",
    "posting_times": ["09:00", "17:00"],
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

-- ===== PRODUCT =====

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'product', 'Co je Hypoteeka.cz',
'Hypoteeka.cz je informační platforma pro svět hypoték a financování nemovitostí. AI asistent Hugo podává obecně známé informace a dělá orientační výpočty. Individuální poradenství poskytují výhradně certifikovaní specialisté na osobní schůzce. Schůzka je zdarma a nezávazná. Informace klientů jsou důvěrné a zpracovávány v souladu s GDPR.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'product', 'Co dělá hypoteční specialista',
'Hypoteční specialista z Hypoteeky poskytuje kompletní servis ZDARMA:
1. Porovná nabídky 8+ bank najednou - klient nemusí obcházet pobočky
2. Vyjedná nižší sazbu (o 0,2-0,5 % nižší než veřejně dostupná) - úspora 100-250 tis. Kč
3. Připraví kompletní dokumentaci - klient neřeší papírování
4. Zastupuje klienta při jednání s bankou
5. Hlídá termíny, podmínky a skryté poplatky
6. Poradí s pojištěním nemovitosti a schopnosti splácet
7. Po skončení fixace pomůže s refinancováním
Cena: ZDARMA pro klienta. Provizi platí banka (0,5-1 % z úvěru). Konzultace nezávazná, 15-30 minut.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'product', 'Typy hypoték',
'Účelová hypotéka: na konkrétní nemovitost, nejnižší sazba.
Neúčelová (americká) hypotéka: na cokoliv se zástavou nemovitosti, vyšší sazba o 1-2 %.
Předhypoteční úvěr: na překlenutí doby před čerpáním, 1-2 roky, vyšší sazba. Používá se při koupi z dražby, od developera nebo před kolaudací.
Kombinace se stavebním spořením: nižší celkové náklady, státní podpora 2 000 Kč/rok.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'product', 'Stavební spoření a hypotéka',
'Kombinace stavebního spoření s hypotékou snižuje celkové náklady. Úvěr ze stavebního spoření má typicky nižší sazbu (3-4 %). Naspořené prostředky lze použít jako vlastní zdroje. Státní podpora 2 000 Kč ročně (při spoření min. 20 000 Kč/rok). Vhodné pro dlouhodobé plánování.', true),

-- ===== PROCESS =====

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'process', 'Kroky k získání hypotéky',
'1) Konzultace a prescoring (ověření bonity) - zdarma, nezávazně
2) Výběr nemovitosti
3) Podání žádosti s dokumenty
4) Odhad nemovitosti (3-6 tis. Kč)
5) Schválení bankou (2-4 týdny)
6) Podpis úvěrové smlouvy
7) Čerpání úvěru
Celý proces trvá typicky 4-8 týdnů. Expresní schválení do 5 pracovních dnů u některých bank.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'process', 'Co je prescoring',
'Prescoring je nezávazné předschválení hypotéky na základě příjmu a závazků. Banka potvrdí, na jakou částku klient dosáhne. Platí obvykle 3 měsíce. Je zdarma a bez závazku. Pomáhá při hledání nemovitosti - klient ví svůj rozpočet.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'process', 'Dokumenty k hypotéce',
'K žádosti o hypotéku potřebujete: občanský průkaz, potvrzení o příjmu (3 výplatní pásky nebo 2 daňová přiznání pro OSVČ), kupní smlouvu nebo smlouvu o smlouvě budoucí, odhad nemovitosti (zajistí banka nebo odhadce).', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'process', 'Odhad nemovitosti pro banku',
'Banka vyžaduje odhad od certifikovaného odhadce. Cena odhadu je 3 000-6 000 Kč. Některé banky odhad hradí nebo nabízejí online odhad zdarma. Odhad určuje maximální výši hypotéky - LTV se počítá z odhadní ceny, ne z kupní ceny.', true),

-- ===== DATA (ČNB pravidla) =====

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'data', 'ČNB pravidla 2026 - LTV, DSTI, DTI',
'Metodika ČNB 2026:
- LTV limit: 80 % (výše úvěru / hodnota nemovitosti). Pro mladé do 36 let: 90 %.
- DSTI limit: 45 % (měsíční splátky všech úvěrů / čistý měsíční příjem)
- DTI limit: 9,5 (celkový dluh / roční čistý příjem)
- Standardní splatnost: max 30 let
- Banky mohou poskytnout max 5 % objemu nových hypoték nad tyto limity.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'data', 'Výjimka LTV pro mladé do 36 let',
'Žadatelé do 36 let mohou získat hypotéku s LTV až 90 % (místo standardních 80 %). Podmínka: alespoň jeden ze žadatelů musí být mladší 36 let v den podání žádosti. Platí pro hypotéky na vlastní bydlení. To znamená, že místo 20 % vlastních zdrojů stačí jen 10 %. U nemovitosti za 5 mil. Kč je to rozdíl 500 000 Kč.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'data', 'Co je fixace a jak ji zvolit',
'Fixace je období, po které je garantovaná úroková sazba. Běžné délky: 1, 3, 5, 7, 10 let. Po skončení fixace banka nabídne novou sazbu. Klient může bez poplatku refinancovat u jiné banky. Kratší fixace = nižší sazba, ale vyšší riziko. Delší fixace = vyšší sazba, ale jistota. Optimální volba závisí na situaci klienta.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'data', 'Vlastní zdroje - kolik a odkud',
'Minimálně 20 % ceny nemovitosti (LTV max 80 %). Pro žadatele do 36 let stačí 10 % (LTV max 90 %). Zdroje: úspory, dar od rodiny (darovací smlouva), stavební spoření, prodej jiného majetku, zástava jiné nemovitosti. Navíc počítat s 5-8 % na vedlejší náklady (provize RK, odhad, právník, pojištění, stěhování).', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'data', 'Jak naspořit na vlastní zdroje',
'Plán spoření:
1. Spořicí účet s úrokem 4-5 % p.a.
2. Termínovaný vklad na 1-2 roky
3. Stavební spoření - státní podpora 2 000 Kč/rok
4. Konzervativní investice (dluhopisové fondy) pro horizont 2+ roky
5. Dar od rodiny - stačí darovací smlouva
Příklad: Nemovitost 4 mil. Kč → potřeba min. 800 tis. Kč. Spoření 20 tis./měsíc = 40 měsíců, 30 tis./měsíc = 27 měsíců.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'data', 'Náklady spojené s koupí nemovitosti',
'Kromě vlastních zdrojů (min 20 % ceny) počítejte s:
- Provize realitní kanceláře: 3-5 % z ceny
- Odhad nemovitosti: 3 000-6 000 Kč
- Právní služby: 5 000-15 000 Kč
- Poplatek za vklad do katastru: 2 000 Kč
- Pojištění nemovitosti: povinné pro hypotéku, 3-8 tis. Kč/rok
- Stěhování a úpravy: 20-100 tis. Kč
Celkem navíc: 5-8 % z ceny nemovitosti.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'data', 'Co je refinancování',
'Refinancování je převod hypotéky k jiné bance za lepších podmínek. Po skončení fixace je refinancování bez poplatku. Při předčasném splacení během fixace se platí poplatek. Proces trvá 2-4 týdny. Ideální čas: několik měsíců před koncem fixace.', true),

-- ===== MARKET =====

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'market', 'Tržní kontext 2026',
'Průměrné hypoteční sazby se v roce 2026 stabilizovaly kolem 4,2-4,5 %. Oproti anomálně nízkým sazbám 2020-2021 (kolem 2 %) je to návrat k dlouhodobému normálu. Sazby kolem 4 % jsou z historického pohledu stále příznivé. Klíčové: nečekat na "zázračný pokles" - ceny nemovitostí mezitím rostou rychleji než případná úspora na sazbě.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'market', 'Vlna refixací 2025-2026',
'V letech 2025-2026 probíhá rekordní vlna refixací hypoték v objemu přes 628 miliard Kč. Stovky tisíc lidí řeší nové podmínky. Kdo má hypotéku s fixací z let 2020-2021 (sazby kolem 2 %), teď dostává nabídky kolem 4-5 %. Ideální čas porovnat nabídky více bank - rozdíly mohou být výrazné.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'market', 'Strategie fixace 2026',
'V roce 2026 se klienti rozhodují mezi kratší fixací (3 roky) s nadějí na pokles sazeb a delší fixací (5-7 let) pro jistotu. Kratší fixace: nižší sazba teď, ale riziko růstu. Delší fixace: vyšší sazba, ale klid na duši. Optimální volba závisí na příjmu, toleranci k riziku a plánech s nemovitostí.', true),

-- ===== AUDIENCE =====

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'audience', 'Prvokupující (25-35 let)',
'Kupují poprvé, mají strach a nejistotu. Potřebují edukaci - co je fixace, jak funguje schvalování, co čekat. Výjimka pro mladé do 36 let (LTV 90 %) je klíčový argument. Tón: trpělivý, povzbuzující, krok za krokem. Na začátek potřebují min. 10-20 % + 5-8 % na vedlejší náklady.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'audience', 'Investoři do nemovitostí',
'Hledají pákový efekt a výnosnost, ne bydlení. Mluví jazykem investic: cash flow, výnosnost, pákový efekt. Specifika investičních hypoték: vyšší LTV požadavky, vyšší sazba. Zajímá je poměr splátka vs nájem. Tón: expertní, čísla, srovnání.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'audience', 'Refinancující klienti',
'Mají hypotéku a řeší konec fixace nebo lepší podmínky. Znají základy, chtějí rychlé a přesné odpovědi. Klíčový argument: porovnání nabídek bank, úspora na sazbě. Vlna refixací 2025-2026 je obrovská příležitost. Tón: efektivní, datový.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'audience', 'Komplikované případy',
'OSVČ, kombinované příjmy, příjmy ze zahraničí, předchozí zamítnutí. Potřebují empatii a ujištění, že existuje cesta. Specialista řeší i nestandardní situace. Tón: empatický, konstruktivní, nikdy neodmítat.', true),

-- ===== FAQ =====

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'faq', 'Splátka vs nájem - co se víc vyplatí',
'Při nájmu platíte cizí hypotéku. Při vlastní hypotéce si budujete majetek. Po splacení máte nemovitost, po nájmu nemáte nic. Nemovitosti dlouhodobě rostou na hodnotě. V Praze je průměrný nájem 2+kk kolem 22 000 Kč, v Brně 16 000 Kč. Pokud je splátka blízko nájmu, budujete si vlastní majetek za podobnou částku.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'faq', 'Bojím se růstu sazeb',
'Při obavě z růstu sazeb pomáhá delší fixace (5-10 let). Aktuální sazby kolem 4 % jsou historicky stále příznivé. Při fixaci je sazba garantovaná po celou dobu. Po skončení fixace lze refinancovat. Správná fixace je pojistka - specialista pomůže zvolit optimální délku.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'faq', 'Chci počkat na nižší sazby',
'Nikdo nedokáže spolehlivě předpovědět vývoj sazeb. Čekáním klient platí nájem a nebuduje majetek. Ceny nemovitostí mohou růst rychleji než případný pokles sazeb. Při budoucím poklesu sazeb lze hypotéku refinancovat za lepších podmínek. Kdo čeká, často prodělá víc na ceně nemovitosti než ušetří na úroku.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'faq', 'Nemám dost vlastních zdrojů',
'Možnosti: dar od rodiny (stačí darovací smlouva), stavební spoření, prodej jiného majetku. Pro mladé do 36 let stačí 10 % místo 20 %. Některé banky akceptují zástavu jiné nemovitosti. Plán spoření: při odkládání 20 tis./měsíc naspořeno 800 tis. za 40 měsíců.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'faq', 'Bojím se ztráty zaměstnání',
'Možnosti ochrany: pojištění schopnosti splácet (měsíční poplatek). Doporučená finanční rezerva 3-6 měsíčních splátek. Banka může nabídnout odklad splátek (až 3 měsíce). V krajním případě lze nemovitost prodat a splatit hypotéku.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'faq', 'Průměrná úspora s poradcem',
'Průměrná úspora klientů Hypoteeky je 164 000 Kč na úrocích za celou dobu splácení. Specialista vyjedná sazbu o 0,2-0,5 % nižší než veřejně dostupná. U úvěru 3 mil. Kč to je úspora 100-250 tis. Kč. Služba je pro klienta zcela zdarma - provizi platí banka.', true),

-- ===== LEGAL =====

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'legal', 'Oprávnění poradců',
'Individuální finanční poradenství mohou poskytovat pouze certifikovaní specialisté s příslušným oprávněním. Poradenství probíhá výhradně na osobní schůzce (online nebo osobně). AI asistent Hugo slouží jako první kontaktní bod pro orientaci, ale závazné informace a doporučení poskytuje vždy živý specialista.', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'legal', 'GDPR a ochrana údajů',
'Při sběru kontaktních údajů je nutný explicitní souhlas klienta se zpracováním v souladu s GDPR. Údaje jsou použity pro spojení s certifikovaným specialistou a v rámci skupiny pro přípravu konzultace. Souhlas musí být dobrovolný, informovaný a jednoznačný. Nikdy nevyžadujeme rodné číslo, číslo OP ani číslo účtu.', true),

-- ===== USP =====

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'usp', 'Proč Hypoteeka.cz',
'1. ZDARMA: Služba specialisty je pro klienta zcela zdarma - provizi platí banka
2. POROVNÁNÍ: Specialista porovná nabídky 8+ bank najednou
3. LEPŠÍ SAZBA: Vyjedná sazbu o 0,2-0,5 % nižší (úspora 100-250 tis. Kč)
4. KOMPLETNÍ SERVIS: Od A do Z - dokumentace, jednání s bankou, termíny
5. NEZÁVAZNĚ: Konzultace je nezávazná, klient se může rozhodnout jinak
6. RYCHLE: Prescoring do 24 hodin, schválení 2-4 týdny
7. AI ASISTENT: Hugo pomůže s orientací 24/7, specialista řeší detaily', true),

-- ===== GENERAL (content patterns) =====

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'general', 'Edukační posty - Hypotéky',
'Formát: Praktický návod s konkrétními čísly
Struktura: Hook (číslo/otázka) → Kontext → 3-5 faktů → Příklad s čísly → CTA
Témata: Jak funguje hypotéka, co je fixace, LTV/DSTI/DTI vysvětlení, kroky k hypotéce, dokumenty, prescoring, vlastní zdroje, refinancování, stavební spoření', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'general', 'Statistiky a trendy trhu',
'Formát: Data-driven post s konkrétními čísly
Struktura: Překvapivé číslo → Data → Analýza → Co to znamená → CTA
Témata: Vývoj sazeb, vlna refixací 628 mld. Kč, průměrná úspora 164 tis. Kč, srovnání splátka vs nájem, ceny nemovitostí v krajích, strategie fixace 2026', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'general', 'Mýty a fakta o hypotékách',
'Formát: Debunking s daty
Struktura: Mýtus → Realita → Důkaz → Doporučení → CTA
Témata: "Musím mít 20 % vlastních zdrojů" (ne pro mladé), "Čekám na nižší sazby" (ceny rostou rychleji), "Hypotéka je drahá" (srovnej s nájmem), "Poradce je drahý" (je zdarma), "Banka mi dá nejlepší nabídku" (porovnání se vyplatí)', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'general', 'Tipy pro prvokupující',
'Formát: Krok za krokem pro začátečníky
Struktura: "X věcí které..." → Tip + vysvětlení jednoduše → CTA
Témata: Co potřebuji na začátek, jak naspořit vlastní zdroje, co je prescoring, jak vybrat fixaci, na co si dát pozor ve smlouvě, skryté náklady koupě', true),

('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'case_study', 'Příběhy klientů',
'Formát: Krátký příběh s čísly (anonymizovaný)
Struktura: Situace → Problém → Řešení (specialista) → Výsledek (úspora) → CTA
Témata: Prvokupující a výjimka pro mladé, refinancování s úsporou, investor a cash flow, OSVČ a nestandardní případ, rodina a optimalizace splátky', true);

-- ===========================================
-- 3. PROMPT TEMPLATES
-- ===========================================

INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES

-- IDENTITY
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'identity_hypoteeka', 'identity',
'KDO JSEM:
- Jsem Hugo – AI asistent platformy hypoteeka.cz.
- Tvořím obsah o hypotékách, financování nemovitostí a trhu s bydlením.
- Komunikuji jako "zkušený kamarád u kávy" - věcně, lidsky, bez bankovní hantýrky.
- Vždy mluvím česky s háčky a čárkami. Žádné emotikony.

OSOBNOST:
- Empathetic professional - validuji situaci, pak dávám čísla.
- Data-driven - konkrétní čísla, ne obecné fráze.
- Konstruktivní - nikdy neodmítám, vždy ukazuji cestu.
- Důvěryhodný - orientační výpočty, přesné info dá specialista.

MISE:
Pomáháme lidem zorientovat se v hypotékách a najít nejlepší řešení.
Specialista porovná nabídky bank a vyjedná lepší podmínky - ZDARMA.
Průměrná úspora klientů: 164 000 Kč na úrocích.',
'Identita Hugo pro Hypoteeka.cz', 10),

-- COMMUNICATION
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'communication_hypoteeka', 'communication',
'PRAVIDLA KOMUNIKACE PRO SOCIÁLNÍ SÍTĚ:
- Piš VÝHRADNĚ česky s háčky a čárkami
- Tón: "Zkušený kamarád u kávy" - uklidňující, věcný, lidský
- Žádné emotikony, žádné vykřičníky v řadě
- Konkrétní čísla vždy: "splátka 15 900 Kč", ne "nízká splátka"
- České formáty: 1 000 000 Kč, 4,5 %
- Bankovní termíny vysvětluj lidsky: místo "LTV" řekni "poměr úvěru k ceně"
- Po každém čísle přidej insight - něco co čtenář nečekal
- Nikdy neodmítej - vždy ukaž cestu a řešení

STRUKTURA POSTU:
1. HOOK: Konkrétní číslo nebo překvapivý fakt
2. VALIDACE: Pochop situaci čtenáře
3. DATA: 2-3 konkrétní fakta
4. INSIGHT: Něco nečekaného
5. CTA: Přirozený bridge k dalšímu kroku

ZAKÁZANÉ FRÁZE:
- "V dnešní době...", "Není žádným tajemstvím..."
- "Doporučuji vám konkrétně...", "Pro vás je nejlepší..."
- "Garantujeme schválení", "Dostanete sazbu X %"
- Jakékoliv individuální rady nebo sliby',
'Komunikační pravidla Hypoteeka.cz', 20),

-- BUSINESS RULES
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'business_rules_hypoteeka', 'business_rules',
'OBCHODNÍ PRAVIDLA PRO CONTENT:

PRIMÁRNÍ CÍL: Edukovat o hypotékách → budovat důvěru → přivést na konzultaci se specialistou.
SEKUNDÁRNÍ CÍL: Pozice experta na hypoteční trh v ČR.

KLÍČOVÉ SDĚLENÍ (přirozeně zakomponovat):
- Specialista porovná 8+ bank najednou
- Vyjedná sazbu o 0,2-0,5 % nižší → úspora 100-250 tis. Kč
- Služba je pro klienta ZDARMA (platí banka)
- Konzultace nezávazná, 15-30 minut
- Průměrná úspora klientů: 164 000 Kč

CTA STRATEGIE:
- Edukační post → "Chcete vědět, na kolik dosáhnete? Nezávazná konzultace zdarma."
- Statistický post → "Kolik ušetříte vy? Specialista porovná nabídky bank zdarma."
- Tip/návod → "První krok? Nezávazný prescoring zdarma na hypoteeka.cz"
- Mýtus/fakt → "Zjistěte přesné podmínky - konzultace je zdarma a nezávazná."

DISCLAIMER (přirozeně, ne roboticky):
- V každém postu s čísly zmínit že jde o orientační údaj
- Střídej formulace: "orientačně", "obecně", "přesné podmínky stanoví specialista"
- NIKDY jako samostatný odstavec - zakomponuj do textu',
'Obchodní pravidla Hypoteeka.cz', 25),

-- GUARDRAIL
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'guardrail_hypoteeka', 'guardrail',
'BEZPEČNOSTNÍ PRAVIDLA:

NIKDY:
- Neslibuj konkrétní sazbu jako fakt ("dostanete 3,9 %")
- Neslibuj schválení hypotéky ("určitě dostanete")
- Nedávej individuální rady ("doporučuji vám", "pro vás je nejlepší")
- Nekritizuj konkrétní banky jménem
- Nepoužívej strach jako motivaci
- Neodmítej nikoho ("nesplňujete podmínky") - vždy ukaž cestu

VŽDY:
- Sazby uvádět jako "od", "orientačně", "v rozmezí"
- Zmínit že přesné podmínky stanoví specialista na schůzce
- Zdůraznit že konzultace je zdarma a nezávazná
- Být konstruktivní a pozitivní
- Uvádět že jde o obecně známé informace

PRÁVNÍ:
- Hugo podává obecně známé informace, ne individuální poradenství
- Individuální rady dávají JEN certifikovaní specialisté na schůzce
- Výpočty jsou orientační modelové příklady
- AI Act: transparentnost - jsme AI, ne člověk',
'Guardrails Hypoteeka.cz', 30),

-- CONTENT STRATEGY
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'content_strategy_hypoteeka', 'content_strategy',
'STRATEGIE OBSAHU:
Content mix: 60 % edukace, 25 % soft-sell, 15 % hard-sell.

EDUKAČNÍ OBSAH (60 %):
- Jak funguje hypotéka (pro prvokupující)
- ČNB pravidla lidsky (LTV, DSTI, DTI)
- Fixace - jak zvolit správnou délku
- Vlastní zdroje - kolik a odkud
- Refinancování - kdy a jak
- Stavební spoření + hypotéka
- Kroky k hypotéce krok za krokem
- Mýty a fakta

SOFT-SELL (25 %):
- Příběhy klientů (anonymizované) s konkrétní úsporou
- Vlna refixací 2025-2026 - proč porovnat nabídky
- Splátka vs nájem - srovnání s čísly
- Výjimka pro mladé do 36 let
- Průměrná úspora 164 000 Kč

HARD-SELL (15 %):
- "Konzultace zdarma - specialista porovná 8+ bank"
- "Průměrná úspora 164 000 Kč - kolik ušetříte vy?"
- "Prescoring zdarma do 24 hodin"
- Přímé CTA na hypoteeka.cz

SPECIFIKA PLATFOREM:
- FACEBOOK: Delší příběhy, rodiny, prvokupující, 30-50 let
- LINKEDIN: Profesionální, investoři, refinancování, tržní data
- INSTAGRAM: Infografiky s čísly, tipy, krátké fakty, 25-40 let
- X: Jedno číslo + kontext, rychlé fakty, trendy sazeb',
'Content strategie Hypoteeka.cz', 40);

-- ===========================================
-- 4. RSS FEEDY
-- ===========================================

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- HYPOTÉKY & SAZBY (hlavní téma - každých 6 hodin)
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Hypoindex.cz', 'https://www.hypoindex.cz/feed/', 'hypoteky', true, 6),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Finparáda.cz - Hypotéky', 'https://finparada.cz/rss/', 'hypoteky', true, 6),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Peníze.cz - Hypotéky', 'https://www.penize.cz/hypoteky/rss', 'hypoteky', true, 6),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Měšec.cz - Hypotéky', 'https://www.mesec.cz/rss/clanky/hypoteky/', 'hypoteky', true, 6),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Kalkulátor.cz - Hypotéky', 'https://www.kalkulator.cz/rss/hypoteky', 'hypoteky', true, 12),

-- ČNB & ÚROKOVÉ SAZBY (kritické pro hypoteční trh)
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'ČNB - Tiskové zprávy', 'https://www.cnb.cz/cs/rss/rss_tz.xml', 'cnb', true, 6),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'ČNB - Měnová politika', 'https://www.cnb.cz/cs/rss/rss_menova_politika.xml', 'cnb', true, 12),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Kurzy.cz - ČNB', 'https://www.kurzy.cz/rss/cnb/', 'cnb', true, 12),

-- STAVEBNÍ SPOŘENÍ (alternativa/doplněk k hypotékám)
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Peníze.cz - Stavební spoření', 'https://www.penize.cz/stavebni-sporeni/rss', 'stavebni_sporeni', true, 24),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Měšec.cz - Stavební spoření', 'https://www.mesec.cz/rss/clanky/stavebni-sporeni/', 'stavebni_sporeni', true, 24),

-- NEMOVITOSTI & CENY BYTŮ (kontext pro hypoteční rozhodování)
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Hospodářské noviny - Reality', 'https://reality.ihned.cz/?m=rss', 'nemovitosti', true, 6),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'iDNES.cz - Bydlení', 'https://www.idnes.cz/bydleni/rss', 'bydleni', true, 12),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Sreality.cz - Blog', 'https://www.sreality.cz/rss', 'nemovitosti', true, 12),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Bezrealitky.cz - Blog', 'https://www.bezrealitky.cz/blog/rss', 'nemovitosti', true, 24),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Kurzy.cz - Reality', 'https://www.kurzy.cz/rss/reality/', 'nemovitosti', true, 24),

-- EKONOMIKA & INFLACE (ovlivňuje hypoteční sazby)
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Hospodářské noviny - Ekonomika', 'https://ekonomika.ihned.cz/?m=rss', 'ekonomika', true, 12),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'E15.cz - Finance', 'https://www.e15.cz/rss', 'ekonomika', true, 12),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Aktuálně.cz - Ekonomika', 'https://www.aktualne.cz/rss/ekonomika/', 'ekonomika', true, 12),

-- OSOBNÍ FINANCE & PORADENSTVÍ
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Peníze.cz - Osobní finance', 'https://www.penize.cz/osobni-finance/rss', 'finance', true, 12),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Měšec.cz - Finance', 'https://www.mesec.cz/rss/clanky/', 'finance', true, 12),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Novinky.cz - Finance', 'https://www.novinky.cz/rss/sekce/10', 'finance', true, 12),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'České noviny - Ekonomika', 'https://www.ceskenoviny.cz/sluzby/rss2/?id=250', 'ekonomika', true, 24),

-- LEGISLATIVA & REGULACE
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Ministerstvo financí ČR', 'https://www.mfcr.cz/cs/rss', 'legislativa', true, 24),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Ministerstvo pro místní rozvoj', 'https://www.mmr.cz/cs/rss', 'legislativa', true, 24),

-- BANKOVNÍ SEKTOR (hypoteční produkty)
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Česká bankovní asociace', 'https://cbaonline.cz/rss', 'banky', true, 24),
('10c40bd7-1e51-4d22-8437-2529fbc3a866', 'Bankovnictví.cz', 'https://www.bankovnictvi.cz/rss', 'banky', true, 24);

-- ===========================================
-- KONEC SEEDU
-- ===========================================
