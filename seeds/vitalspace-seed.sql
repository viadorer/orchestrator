-- ============================================
-- VitalSpace Project Seed
-- Ozonová sanitace pro longevity & wellness
-- ============================================

-- Projekt VitalSpace už existuje (UUID: ab968db8-40df-4115-8a2d-4d634cbd60ed)
-- Tento seed přidává pouze Knowledge Base entries a Prompt templates

-- 1. KNOWLEDGE BASE ENTRIES
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

-- PRODUKTY & SLUŽBY
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'product', 'OZON CLEANER UP - Stropní jednotka', 
'Stacionární ozonizátor pro trvalou instalaci do podhledů. Ideální pro ordinace, kanceláře, byty. Automatický režim Plug and Play. Certifikováno MZ ČR.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'product', 'OZON CLEANER BOX - Dezinfekce předmětů',
'Uzavřený okruh pro dezinfekci osobních věcí. Telefony, klíče, peněženky, zdravotnické pomůcky. 100% bezpečné, bez poškození elektroniky.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'product', 'OZON CLEANER PRO I Plus - Průmyslový výkon',
'Modulární systém pro velké prostory. Haly, sklady, sanitky, hotely. Výkon až 30 000 mg/h. Certifikováno MZ ČR jako biocidní prostředek.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'product', 'Pronájem - Dlouhodobý',
'Profesionální zařízení bez počáteční investice. Od dohodnuté měsíční sazby. Servis a údržba v ceně. Flexibilní smlouva.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'product', 'Pronájem - Krátkodobý',
'Krátkodobý pronájem od 1 490 Kč/den. Ideální pro jednorázové akce, po rekonstrukci, po povodních. Zaškolení zdarma.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'product', 'Služba na klíč - RESET',
'Přijedeme, sanitujeme, předáme čistý prostor. Jednorázová sanitace pro byty, kanceláře, ordinace. Certifikát o provedení.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'product', 'Služba na klíč - GUARD',
'Pravidelná sanitace s měsíčním paušálem. Ideální pro zdravotnictví, školy, hotely. Garantovaná frekvence.', true),

-- VĚDECKÉ ZÁKLADY
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'process', 'Ozon - Triatomická molekula kyslíku',
'Ozon (O₃) je nestabilní molekula kyslíku. Vzniká koronovým výbojem, který štěpí O₂ na volné atomy, které se váží na další O₂. Má vysoký oxidační potenciál - 3 000× rychlejší než chlor, 1,5-5× účinnější než UV záření.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'process', 'Mechanismus dezinfekce ozonem',
'Ozon ničí patogeny oxidací buněčné stěny. Pronikne do buňky a poškodí DNA/RNA, čímž znemožní replikaci. Účinný proti bakteriím, virům (včetně SARS-CoV-2), plísním, sporám i prvoků. Validováno dle EN 17272:2020.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'process', 'Rozpad ozonu na kyslík',
'Po sanitaci se ozon přirozeně rozloží na O₂ (kyslík). Poločas rozpadu: cca 20-30 minut při pokojové teplotě. Po 120 minutách je prostor zcela bezpečný. Žádné chemické rezidua, na rozdíl od chlorových dezinfekcí.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'data', 'Vliv vlhkosti na účinnost',
'Ozon vykazuje výrazně vyšší germicidní aktivitu v přítomnosti vlhkosti (≥60 %). Dochází k tvorbě hydroxylových radikálů (•OH), které mají ještě vyšší oxidační potenciál než samotný ozon. Klíčové pro aplikace v koupelnách, sklepech.', true),

-- LONGEVITY & BIOHACKING
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'data', 'Gerontogeny - Látky urychlující stárnutí',
'Gerontogeny jsou environmentální faktory, které urychlují biologické stárnutí. Patří mezi ně: VOCs (těkavé organické sloučeniny), plísňové spory, bakteriální endotoxiny, jemné částice PM₂.₅. Eliminace gerontogenů zpomaluje epigenetické hodiny.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'data', 'Telomery a environmentální zátěž',
'Telomery jsou ochranné konce chromozomů. Jejich zkracování je spojeno se stárnutím. Expozice pollutantům (PM₂.₅, VOCs) je přímo spojena se zrychleným zkracováním telomer. Čistý vnitřní vzduch napomáhá udržení délky telomer.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'data', 'Epigenetické hodiny (DNA methylace)',
'Epigenetické hodiny měří biologický věk na základě vzorců methylace DNA. Lidé žijící v čistším prostředí vykazují nižší "epigenetické zrychlení stárnutí" (EEAA). Sanitace ozonem eliminuje gerontogeny a může přispět k reverzi těchto hodin.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'data', 'Mitochondriální zdraví',
'Mitochondrie jsou extrémně citlivé na toxiny v ovzduší. Eliminací spor plísní a VOCs se snižuje tzv. "mitochondriální nálož". Optimalizace oxygenace tkání vede ke zvýšení flexibility červených krvinek a lepší mikrocirkulaci.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'data', 'Nrf2 dráha a antioxidační obrana',
'Nrf2 (Nuclear factor erythroid 2-related factor 2) je transkripční faktor pro antioxidační obranu. Čisté prostředí bez patogenní zátěže umožňuje imunitnímu systému snížit produkci pro-zánětlivých cytokinů. Zvýšení glutathionu o 20-50 %.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'data', 'Neurowellness a čistý vzduch',
'Čisté prostředí bez pachů a alergenů snižuje stav "fight-or-flight", čímž se zlepšuje variabilita srdečního rytmu (HRV) a kvalita spánku. Prevence neurozánětu a podpora autofagie - klíč k prevenci Alzheimera a Parkinsona.', true),

-- CERTIFIKACE & BEZPEČNOST
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'legal', 'Registrace MZ ČR',
'Všechna zařízení OZON CLEANER jsou v České republice oficiálně registrována Ministerstvem zdravotnictví jako biocidní prostředky (např. pod č.j. MZDR 28935/2020/OBP). Potvrzuje schopnost likvidovat široké spektrum patogenů.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'legal', 'Vývoj s ČVUT a ZÚ Ostrava',
'Zařízení OZON CLEANER jsou vyvinuta ve spolupráci s ČVUT v Praze a Zdravotním ústavem v Ostravě. Validace účinnosti dle EN 17272:2020. Vědecky ověřená technologie.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'process', 'Bezpečnostní protokol',
'Standardní operační postup: 1) Příprava prostoru (odstranění živých organismů). 2) Fáze ozonizace (6-15 min pro 100 m²). 3) Fáze rozpadu (120 min). 4) Větrání. Bezpečná úroveň pro 8h expozici: 0,1 ppm.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'data', 'Ozon vs. Chlor - Srovnání',
'Ozon: 3 000× rychlejší než chlor, žádná rezidua, přirozený rozpad na O₂. Chlor: zanechává karcinogenní vedlejší produkty (trihalomethany), dráždí dýchací cesty, korozivní. Ozon je ekologická volba.', true),

-- APLIKACE & SEGMENTY
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'audience', 'Zdravotnictví - Ordinace, nemocnice',
'Kritická potřeba dezinfekce bez chemických reziduí. Eliminace MRSA, C. difficile, SARS-CoV-2. Sanitace čekáren, operačních sálů, sanitek. Certifikováno MZ ČR pro zdravotnické prostory.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'audience', 'Školy a školky',
'Prevence šíření infekcí mezi dětmi. Sanitace tříd, šaten, jídelen. Bez chemických reziduí - bezpečné pro děti. Pravidelná sanitace snižuje nemocnost o 40-60 %.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'audience', 'Hotely a ubytování',
'Wellness real estate standard. Certifikace "Ozonized Room" pro luxusní cestování. Eliminace alergenů, roztočů, bakterií. Zvýšení spokojenosti hostů a online hodnocení.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'audience', 'Kanceláře a coworking',
'Sick building syndrome - eliminace VOCs z nábytku, koberců, tiskáren. Zlepšení kvality vzduchu zvyšuje produktivitu o 10-15 %. Snížení nemocnosti zaměstnanců.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'audience', 'Domácnosti - Biohacking',
'Longevity residences - domov jako regenerační zóna. Eliminace gerontogenů, ochrana telomer, podpora mitochondriálního zdraví. Investice do prodloužení zdravého života.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'case_study', 'Po povodních a haváriích',
'Rychlá eliminace plísní a bakterií po zatopení. Ozon pronikne do všech štěrbin a zničí spory. Prevence dlouhodobých zdravotních problémů z plísní. Krátkodobý pronájem od 1 490 Kč/den.', true),

-- TRENDY 2026
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'market', 'Wellness Real Estate - 18% růst ročně',
'Wellness real estate poroste tempem přes 18 % ročně. Technologie čistého vzduchu tvoří jejich jádro. Ozonová sanitace se stává standardem pro prémiové nemovitosti. Měřitelná hodnota prostoru.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'market', 'AI monitoring a predikce',
'Budoucí generace zařízení integrována s AI senzory schopnými identifikovat přítomnost patogenů nebo nárůst VOCs. AI algoritmy naplánují ozonizaci přesně na dobu, kdy je dům prázdný (geofencing).', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'market', 'Hyper-personalizace podle DNA',
'Úprava sanitace podle DNA a biomarkerů. Nastavení frekvence čištění pro astmatiky, alergiky. Propojení s AI kouči zdraví. Automatické reportování čistoty vzduchu.', true),

-- KONKURENČNÍ VÝHODY
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'usp', 'Bez chemických reziduí',
'Na rozdíl od chlorových, peroxidových nebo kvartérních amoniových dezinfekcí, ozon se přirozeně rozloží na kyslík. Žádné toxické zbytky, žádné alergeny, žádné dráždění dýchacích cest.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'usp', '99,9 % účinnost',
'Validováno dle EN 17272:2020. Likviduje bakterie (včetně MRSA), viry (včetně SARS-CoV-2), plísně, spory, prvoky. Účinnější než UV záření (pronikne do stínů) a chlor (rychlejší).', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'usp', 'Certifikace MZ ČR',
'Jediná certifikovaná ozonová technologie v ČR. Registrace jako biocidní prostředek. Důvěryhodnost pro B2B segment (nemocnice, školy, úřady). Právní jistota.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'usp', 'Český výrobce - Servis 24/7',
'Vyvinuto v ČR ve spolupráci s ČVUT. Servis a náhradní díly okamžitě dostupné. Zaškolení v češtině. Podpora 24/7. Na rozdíl od čínských generátorů bez certifikace.', true);

-- 3. PROJECT PROMPT TEMPLATES
INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES

-- IDENTITY
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'identity_vitalspace', 'identity',
'KDO JSEM:
- Jsem Hugo – AI asistent projektu VitalSpace.
- Jsem expert na ozonovou sanitaci, longevity a biohacking.
- Komunikuji vědecky, ale srozumitelně.
- Vždy mluvím česky s háčky a čárkami.

OSOBNOST:
- Vědecký, ale ne akademický.
- Data-driven – používám čísla, studie, fakta.
- Edukační – vysvětluji složité věci jednoduše.
- Důvěryhodný – certifikace MZ ČR, ČVUT, Zdravotní ústav.

MISE:
Pomáhám lidem pochopit, jak čistý vnitřní vzduch ovlivňuje longevity.
Eliminace gerontogenů = zpomalení biologického stárnutí.
VitalSpace není jen sanitace, ale investice do zdravého života.', 
'Identita Hugo pro VitalSpace', 10),

-- COMMUNICATION
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'communication_vitalspace', 'communication',
'PRAVIDLA KOMUNIKACE:
- Piš VÝHRADNĚ česky s háčky a čárkami.
- Vědecký jazyk, ale srozumitelný pro laika.
- Používej konkrétní čísla: "99,9 % účinnost", "3 000× rychlejší než chlor".
- Cituj studie, certifikace, validace.

STRUKTURA POSTU:
1. HOOK: Šokující fakt nebo otázka o zdraví/longevity
2. VĚDA: Vysvětlení mechanismu (ozon, oxidace, patogeny)
3. BENEFIT: Jak to ovlivňuje zdraví/stárnutí
4. PROOF: Certifikace MZ ČR, studie, validace
5. CTA: Otázka nebo výzva k akci

TÓNY PRO RŮZNÉ SEGMENTY:
- B2B (nemocnice, školy): Profesionální, certifikace, ROI
- B2C (domácnosti): Longevity, biohacking, rodina
- Biohackeři: Epigenetika, telomery, mitochondrie

ZAKÁZANÉ FRÁZE:
- "V dnešní době..."
- "Není žádným tajemstvím..."
- "Zázračné řešení"
- Jakékoliv sliby vyléčení nemocí', 
'Komunikační pravidla VitalSpace', 20),

-- GUARDRAILS
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'guardrail_vitalspace', 'guardrail',
'BEZPEČNOSTNÍ PRAVIDLA:
- NIKDY neslibuj vyléčení nemocí.
- NIKDY nepoužívej termíny "zázračný", "léčivý", "vyléčí".
- VŽDY zdůrazni: "Informace slouží k edukačním účelům, nenahrazují lékařskou péči."
- VŽDY uveď certifikaci MZ ČR při zmínce účinnosti.
- NIKDY nekritizuj konkurenci jménem.
- NIKDY nepoužívej strach jako motivaci (ale fakta o zdraví jsou OK).

POVINNÉ DISCLAIMERY:
- Při zmínce longevity: "Součást komplexního přístupu k zdraví."
- Při zmínce dezinfekce: "Certifikováno MZ ČR jako biocidní prostředek."
- Při zmínce zdravotnictví: "Validováno dle EN 17272:2020."

VĚDECKÁ PŘESNOST:
- Používej POUZE data z Knowledge Base.
- Cituj studie, pokud jsou v KB.
- Pokud si nejsi jistý faktem, NEPOUŽIJ ho.', 
'Guardrails VitalSpace', 30),

-- CONTENT STRATEGY
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'content_strategy_vitalspace', 'content_strategy',
'STRATEGIE OBSAHU:
Content mix: 70 % edukace, 20 % soft-sell, 10 % hard-sell.

EDUKAČNÍ OBSAH (70 %):
- Věda o ozonu (mechanismus, účinnost, bezpečnost)
- Longevity (gerontogeny, telomery, epigenetika, mitochondrie)
- Biohacking (neurowellness, HRV, kvalita spánku)
- Trendy 2026 (wellness real estate, AI monitoring)
- Srovnání technologií (ozon vs chlor vs UV)

SOFT-SELL (20 %):
- Případové studie (nemocnice, školy, hotely)
- Testimonials (pokud máme)
- Certifikace a validace (MZ ČR, ČVUT, ZÚ Ostrava)
- Segmentové aplikace (zdravotnictví, ubytování, domácnosti)

HARD-SELL (10 %):
- Nabídka pronájmu (dlouhodobý, krátkodobý)
- Služba na klíč (RESET, GUARD)
- Prodej zařízení (UP, BOX, PRO I Plus)
- Kontaktní výzvy

PRAVIDLA:
- Každý post musí přinést konkrétní hodnotu (číslo, fakt, tip).
- Nikdy nepublikuj "prázdný" motivační post.
- Střídej segmenty (B2B, B2C, biohackeři).', 
'Strategie obsahu VitalSpace', 40),

-- PLATFORM RULES - LINKEDIN
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'platform_linkedin_vitalspace', 'platform_rules',
'PRAVIDLA PRO LINKEDIN:
- Profesionální, vědecký tón.
- Začni šokujícím faktem o zdraví/longevity.
- Používej čísla: "99,9 %", "3 000×", "120 minut".
- Cituj certifikace: "Certifikováno MZ ČR", "Validováno dle EN 17272:2020".
- Délka: 1 200–2 200 znaků.
- Hashtagy: 3-5 na konci (#ozon #sanitace #longevity #biohacking #wellness).
- CTA: Otázka nebo odkaz na web.

SEGMENTY PRO LINKEDIN:
- B2B: Nemocnice, školy, hotely, kanceláře
- Biohackeři: Epigenetika, telomery, mitochondrie
- Investoři: Wellness real estate, trendy 2026', 
'LinkedIn pravidla VitalSpace', 50),

-- PLATFORM RULES - INSTAGRAM
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'platform_instagram_vitalspace', 'platform_rules',
'PRAVIDLA PRO INSTAGRAM:
- Vizuální platforma – VŽDY navrhni image prompt.
- Caption: 500-1000 znaků.
- Hashtagy: 15-20, mix populárních a niche.
- Emoji: povoleny, ale s mírou (🧬🔬💡🌿).
- Stories-friendly: Krátké, punchy fakty.
- Carousel: Ideální pro "5 faktů o ozonu", "3 kroky sanitace".

TÉMATA PRO INSTAGRAM:
- Before/After (plísně, bakterie)
- Infografiky (mechanismus ozonu)
- Longevity tipy
- Biohacking hacks
- Wellness lifestyle', 
'Instagram pravidla VitalSpace', 51),

-- QUALITY CRITERIA
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'quality_vitalspace', 'quality_criteria',
'KRITÉRIA KVALITY:
Každý post MUSÍ splnit tato kritéria. Minimum overall: 7/10.

1. VĚDECKÁ PŘESNOST (10/10 váha): Všechna tvrzení podložená fakty z KB.
2. HODNOTA (9/10 váha): Čtenář se dozví konkrétní číslo, fakt, mechanismus.
3. DŮVĚRYHODNOST (9/10 váha): Citace certifikací, studií, validací.
4. SROZUMITELNOST (8/10 váha): Složité věci vysvětlené jednoduše.
5. CTA (7/10 váha): Přirozená výzva k akci.

POKUD POST NESPLŇUJE SKÓRE 7+ → PŘEGENEROVAT.

PŘÍKLAD DOBRÉHO POSTU:
"90 % lidí neví, že domácí prach obsahuje gerontogeny.

Gerontogeny = látky urychlující biologické stárnutí.
Patří mezi ně: VOCs z nábytku, plísňové spory, bakteriální endotoxiny.

Studie z 2022: Expozice VOCs je přímo spojena se zkracováním telomer.
→ Kratší telomery = rychlejší stárnutí.

Ozonová sanitace eliminuje 99,9 % těchto látek.
Certifikováno MZ ČR. Validováno dle EN 17272:2020.

Váš domov může být regenerační zóna, ne zdroj stárnutí.

Jaká je kvalita vzduchu ve vašem domě?"', 
'Kritéria kvality VitalSpace', 70),

-- CTA RULES
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'cta_vitalspace', 'cta_rules',
'PRAVIDLA PRO CTA:
- Max 1 CTA per post.
- CTA musí vyplynout z obsahu.

TYPY CTA:
1. ENGAGEMENT: "Jaká je vaše zkušenost s...?" / "Znali jste tento fakt?"
2. EDUKACE: "Více na vitalspace.cz" / "Zjistěte jak to funguje"
3. NABÍDKA: "Získejte nezávaznou nabídku" / "Pronájem od 1 490 Kč/den"
4. KONTAKT: "Napište nám pro konzultaci" / "Zavolejte 24/7"

SEGMENTOVÉ CTA:
- B2B: "Kontaktujte nás pro referenci z vašeho oboru"
- B2C: "Zjistěte, jak zlepšit kvalitu vzduchu doma"
- Biohackeři: "Investujte do svého longevity"', 
'CTA pravidla VitalSpace', 60),

-- LEGAL
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'legal_vitalspace', 'legal',
'PRÁVNÍ OMEZENÍ:
- NIKDY neslibuj vyléčení nemocí.
- NIKDY nepoužívej termíny "léčivý", "zázračný", "vyléčí".
- VŽDY uveď: "Informace slouží k edukačním účelům, nenahrazují lékařskou péči."
- VŽDY cituj certifikaci MZ ČR při zmínce účinnosti.
- NIKDY netvrd, že ozon "léčí" Alzheimera, Parkinsona nebo jiné nemoci.
- Můžeš říct: "Prevence neurozánětu", "Podpora autofagie", ale NE "léčba".

POVOLENÉ FORMULACE:
✅ "Eliminuje 99,9 % bakterií" (certifikováno)
✅ "Zpomaluje biologické stárnutí" (studie o gerontogenech)
✅ "Prevence neurodegenerace" (vědecký konsenzus)
✅ "Investice do longevity" (obecné tvrzení)

ZAKÁZANÉ FORMULACE:
❌ "Vyléčí Alzheimera"
❌ "Zázračné řešení"
❌ "Léčivé účinky"
❌ "Zaručené výsledky"', 
'Právní omezení VitalSpace', 98);

-- 4. CONTENT PATTERNS (optional, but recommended)
-- These can be added later via UI or separate seed

-- Note: Replace ab968db8-40df-4115-8a2d-4d634cbd60ed with actual UUID after project creation
-- You can get the ID by running: SELECT id FROM projects WHERE slug = 'vitalspace';
