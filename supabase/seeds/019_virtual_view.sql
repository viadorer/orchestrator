-- ===========================================
-- SEED: Virtual View - Matterport 3D skenování
-- Projekt ID: 17443720-68b7-460a-859e-28b1b5d66913
-- Web: virtualview.cz | Infinity Loop, s.r.o. (Plzeň)
-- ===========================================

-- CLEANUP
DELETE FROM project_prompt_templates WHERE project_id = '17443720-68b7-460a-859e-28b1b5d66913';
DELETE FROM knowledge_base WHERE project_id = '17443720-68b7-460a-859e-28b1b5d66913';
DELETE FROM rss_sources WHERE project_id = '17443720-68b7-460a-859e-28b1b5d66913';
DELETE FROM content_queue WHERE project_id = '17443720-68b7-460a-859e-28b1b5d66913';
DELETE FROM agent_tasks WHERE project_id = '17443720-68b7-460a-859e-28b1b5d66913';
DELETE FROM agent_log WHERE project_id = '17443720-68b7-460a-859e-28b1b5d66913';
DELETE FROM post_history WHERE project_id = '17443720-68b7-460a-859e-28b1b5d66913';
DELETE FROM projects WHERE id = '17443720-68b7-460a-859e-28b1b5d66913';

-- 1. PROJEKT
INSERT INTO projects (
  id, name, slug, description,
  platforms, late_social_set_id,
  mood_settings, content_mix, constraints, semantic_anchors, style_rules,
  visual_identity, orchestrator_config, is_active
) VALUES (
  '17443720-68b7-460a-859e-28b1b5d66913',
  'Virtual View',
  'virtual-view',
  'Matterport 3D skenování a digitální dvojčata. Profesionální 3D virtuální prohlídky pro nemovitosti, hotely, muzea, průmysl, pojišťovnictví, stavebnictví a další B2B segmenty. Infinity Loop, s.r.o. (David Choc, Plzeň). Web: virtualview.cz',
  ARRAY['linkedin', 'instagram', 'facebook'],
  NULL,
  '{"tone": "professional", "energy": "medium-high", "style": "innovative_expert"}'::jsonb,
  '{"educational": 0.60, "soft_sell": 0.25, "hard_sell": 0.15}'::jsonb,
  '{"forbidden_topics": ["kritika konkrétních konkurentů jménem","nepodložené statistiky","vymyšlená čísla","zaručená návratnost","100% přesnost bez kontextu","politická témata","osobní útoky","kryptoměny","clickbait bez hodnoty"], "mandatory_terms": ["3D prohlídka","digitální dvojče","Matterport","virtualview.cz"], "max_hashtags": 5}'::jsonb,
  ARRAY['3D prohlídka','digitální dvojče','Matterport','virtuální prohlídka','3D skenování','Dollhouse View','BIM export','Mattertags','Virtual View','virtualview.cz','Plzeň','nemovitosti','hotely','průmysl','muzea','pojišťovnictví','stavebnictví'],
  '{"start_with_question": true, "max_bullets": 5, "no_hashtags_in_text": true, "max_length": 2500, "max_emojis": 2, "paragraph_max_sentences": 3, "use_real_examples": true, "data_driven": true, "b2b_tone": true}'::jsonb,
  '{"primary_color": "#1a1a2e", "secondary_color": "#16213e", "accent_color": "#0f3460", "text_color": "#ffffff", "font": "Inter", "style": "modern_tech", "photography": {"style": "tech_professional", "subjects": ["3d_scans","matterport_camera","virtual_tours","modern_buildings","industrial_spaces","hotel_interiors","museum_exhibitions"], "mood": "innovative_and_professional", "avoid": ["stock_photos_obvious","overly_dark","low_quality_renders"]}}'::jsonb,
  '{"enabled": false, "posting_frequency": "daily", "posting_times": ["09:00","14:00"], "max_posts_per_day": 1, "content_strategy": "6-2.5-1.5", "auto_publish": false, "auto_publish_threshold": 8.5, "timezone": "Europe/Prague", "platforms_priority": ["linkedin","facebook","instagram"], "pause_weekends": true}'::jsonb,
  true
);

-- ===========================================
-- 2. KNOWLEDGE BASE
-- ===========================================

-- ---- PRODUCT ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'product', 'Co je Virtual View',
'Virtual View (virtualview.cz) je služba profesionálního 3D skenování a tvorby digitálních dvojčat pomocí technologie Matterport. Provozuje Infinity Loop, s.r.o. se sídlem v Plzni (David Choc). Nabízíme kompletní 3D virtuální prohlídky pro nemovitosti, hotely, muzea, průmyslové objekty, pojišťovnictví, stavebnictví a další B2B segmenty. Výstupem je interaktivní 3D model přístupný z jakéhokoli zařízení — PC, tablet, mobil i VR headset.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'product', 'Klíčové funkce Matterport',
'3D Digital Twin — plně interaktivní digitální kopie reálného prostoru, přesná do centimetrů. Dollhouse View — unikátní 3D pohled na celý objekt, žádná jiná technologie toto nenabízí. Měřicí nástroje — point-to-point měření přímo v modelu s přesností 1–2 cm. BIM/CAD export — formáty E57, OBJ, RVT (Revit), DWG (AutoCAD). Mattertags — interaktivní body v prostoru s textem, fotkami, videem, odkazy. Embedding — vložení do webové stránky jedním řádkem kódu. Google Street View integrace. VR kompatibilita — Meta Quest, HTC Vive. AI funkce (2025) — automatické popisy, defurnishing, generování videí. Schématické půdorysy — 2D plány s rozměry automaticky ze skenu.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'product', 'Ceník Virtual View',
'Akční ceny Virtual View (30–45 % pod trhem u menších prostor):
Byt do 50 m²: 2 450 CZK (trh: 3 300–3 500). Byt 51–100 m²: cca 3 500 CZK (trh: 4 000–4 500). Dům 101–200 m²: cca 4 500 CZK (trh: 5 000–6 000). Objekt 201–300 m²: cca 5 500 CZK (trh: 6 500–7 500). Nad 300 m²: 20–25 CZK/m². Hotel/komerční: individuálně, až 30 000 CZK. Agresivní vstupní strategie pro získání tržního podílu.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'product', 'Proces skenování',
'1. Konzultace — zjistíme potřeby klienta, typ prostoru, účel. 2. Příprava prostoru — úklid, osvětlení. 3. Skenování — Matterport kamerou, 30–90 minut dle velikosti. 4. Zpracování — Matterport cloud, 24–48 hodin. 5. Úpravy — Mattertags, popisky, branding, embedding kód. 6. Předání — odkaz, embedding kód, půdorysy, exporty. 7. Hosting — Matterport cloud, 24/7. Celý proces: 3–5 pracovních dní.', true);

-- ---- MARKET ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'market', 'Globální trh 3D skenování',
'Globální trh 3D skenování: 4,3–5,7 mld USD (2024), CAGR 10–11 %, projekce 7,5–8,9 mld USD do 2030. Trh virtuálních prohlídek: 11 mld USD, projekce 74 mld USD do 2030 (CAGR 34,3 %). Trh digitálních dvojčat budov: 2,07 mld USD (2024), projekce 26,2 mld USD do 2033 (CAGR 32,6 %). Matterport: 14,1 mil prostor, 50,7 mld sq ft, 177 zemí, 1,2 mil předplatitelů, tržby 169,7 mil USD (FY2024, +8 %). CoStar Group akvizice za ~1,6 mld USD (únor 2025).', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'market', 'Český trh Matterport služeb',
'15–20 aktivních poskytovatelů, převážně OSVČ a mikrofirmy. Klíčoví hráči: Matterpro.cz (Děčín), Scan360.cz (Brno), iVirtual.cz (celostátně), VRapps.cz (Olomouc), 3DVirtual.cz (Praha). Distributor: SMAR s.r.o. Trh cenově kompresovaný — soutěž primárně cenou. Insight: „Překvapivé, jak málo makléřů využívá tuto technologii." Mezery: průmysl, BIM, facility management (jen iVirtual a VRapps). Pojišťovnictví, zdravotnictví, školství, retail — žádné dedikované nabídky. Plzeňský kraj bez silného hráče.', true);

-- ---- DATA (statistiky) ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'data', 'Statistiky: Prodej nemovitostí',
'3D prohlídka = prodej o 31 % rychleji, cena o 9 % vyšší (143 000 listingů, Matterport). Redfin: o 10 dní rychleji, o 50 100 USD více. Zillow: o 10 % rychleji, o 22 % vyšší šance prodeje do 30 dní. Keller Williams: doba na trhu z 30 na 21 dní (-30 %).', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'data', 'Statistiky: Engagement a konverze',
'O 49 % více kvalifikovaných leadů. 3–6× více času na listingu. O 87 % více zobrazení, o 300 % vyšší engagement. 95 % lidí spíše zavolá, 60 % spíše napíše e-mail. 71 % kupujících by koupilo bez fyzické prohlídky s 3D tour.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'data', 'Statistiky: Preference kupujících',
'96 % kupujících využívá online nástroje (NAR 2024). 80 % by přešlo k makléři s 3D prohlídkami. 94 % Gen Z a 83 % mileniálů by přešlo k makléři s 3D. 88 % prodávajících preferuje makléře s 3D prohlídkami.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'data', 'Statistiky: Hotely',
'Hotely s virtuální prohlídkou: +48 % rezervací. Konverze na webu: +167 %. 3× více času na webu. 96 % event koordinátorů potvrzuje přínos pro vizualizaci prostorů.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'data', 'Statistiky: Stavebnictví a BIM',
'BIM skenování: ROI 10:1+. Detekce kolizí: -40 % nákladů na vícepráce. Reality capture: 73% redukce chyb. Projektový cyklus: -15–30 %.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'data', 'Statistiky: Pojišťovnictví a průmysl',
'Pojišťovnictví: přesnost měření do 1 %, eliminace opakovaných návštěv, nemanipulovatelná časová razítka. Průmysl: školení -40 % nákladů (RemSense). KLM: čisticí procedury o 30 % rychleji. BMO Bank: 503 poboček za 3 měsíce, úspora ~6 000 hodin.', true);

-- ---- USE CASES (B2B segmenty) ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'Use case: Developeři',
'Benefity: Prodej off-plan přes 3D vzorové byty. Zahraniční investoři „navštíví" projekt odkudkoli. Dollhouse view ukazuje celý layout. Embedding do webu projektu zvyšuje engagement o stovky procent. Pain points: Abstraktní prodej z plánů, drahé showroomy, dlouhé prodejní cykly. Hook: „65 % bytů jednoho plzeňského projektu se prodalo ještě před kolaudací — díky jedinému nástroji."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'Use case: Hotely a hospitality',
'Benefity: Hosté prohlédnou pokoje, wellness, restauraci před rezervací. Eliminace negativních recenzí „neodpovídalo fotkám." Event koordinátoři posoudí prostor vzdáleně. +48 % rezervací, +167 % konverze. Pain points: Nízká konverze webu (1,5–2,5 %), únik na OTA (Booking, Expedia). Hook: „Průměrný hotelový web konvertuje 2 %. S 3D prohlídkou to může být 5 % a více."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'Use case: Průmysl a výroba',
'Benefity: Digitální dvojče závodu pro údržbu, školení, vzdálené inspekce, plánování přestaveb. Mattertags označují stroje s dokumentací. Školení -40 %. Eliminace zbytečných fyzických návštěv. Pain points: Onboarding trvá týdny, neaktuální dokumentace, drahé inspekce. Hook: „BMO Bank ušetřila 6 000 hodin digitalizací 503 poboček."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'Use case: Muzea a galerie',
'Benefity: Globální dostupnost 24/7. Mattertags jako interaktivní průvodce (audio, video, texty). Digitální archivace dočasných výstav. Dollhouse „ptačí pohled." Nový zdroj příjmů z virtuálních vstupů. Pain points: Omezený geografický dosah, dočasné výstavy zmizí, malé rozpočty. Hook: „320 m² výstavní plochy, 2 500 virtuálních návštěvníků měsíčně, 42 % pak přišlo osobně."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'Use case: Pojišťovny',
'Benefity: 3D dokumentace před i po škodní události. Přesnost do 1 %. Nemanipulovatelná časová razítka. Xactimate-kompatibilní exporty. Vzdálený přístup bez opakovaných návštěv. Pain points: Nekompletní fotodokumentace, opakované návštěvy, nebezpečná místa, nepřesná měření. Hook: „S jedním 3D skenem máte kompletní dokumentaci s přesností do 1 % — navždy."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'Use case: Architekti a stavebnictví',
'Benefity: Přesné as-built zaměření. Export do BIM/Revit/AutoCAD. Skenování obtížně přístupných míst. Projektový cyklus -15–30 %. Pain points: Manuální zaměřování až 10 hodin/objekt. Nepřesná data = 20–30 % více change orders. Vícepráce 5–12 % rozpočtu. Hook: „Manuální zaměřování: 10 hodin. Matterport sken: pod hodinu. Výstup jde přímo do Revitu."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'Use case: Správci nemovitostí a coworking',
'Benefity: Digitální dvojče portfolia. Vzdálená prohlídka eliminuje neproduktivní osobní prohlídky. Mattertags s údržbovou dokumentací. Coworking: členové vybírají místo z domova. Pain points: Opakované fyzické prohlídky, nekvalifikovaní zájemci, zastaralá dokumentace. Hook: „Méně prohlídek, více uzavřených smluv. O 49 % více kvalifikovaných leadů."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'Use case: Školy, retail, restaurace, vláda, zdravotnictví',
'Školy: Virtuální kampus pro zahraniční uchazeče. Mattertags s info o programech. Dny otevřených dveří bez kapacitních omezení. Hook: „Student v Tokiu projde kampus z obýváku."
Retail: Virtuální showroom 24/7. Mattertags propojují produkty s e-shopem. Hook: „Otevřete showroom světu — 24/7."
Restaurace/event: 3D prohlídka přesvědčí event plánovače za 3 minuty. Hook: „Nechte prostor prodávat sám."
Vláda: Správa budov, krizové řízení, památková ochrana. EU dotace na digitalizaci.
Zdravotnictví: Plánování rekonstrukcí, orientace pacientů, méně průchodů = nižší kontaminace.', true);

-- ---- AUDIENCE ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'audience', 'Cílové B2B segmenty',
'1. DEVELOPEŘI — vysoká ochota platit, opakované zakázky (obchodní ředitel, marketing)
2. HOTELY — vysoký ROI, měřitelné výsledky (GM, revenue manager)
3. PRŮMYSL — největší zakázky, dlouhé kontrakty (facility manager, HR, COO)
4. REALITNÍ KANCELÁŘE — objem, nízké marže (makléř, vedoucí pobočky)
5. MUZEA — nižší rozpočty, PR hodnota (ředitel, kurátor)
6. POJIŠŤOVNY — specializovaný, vysoká hodnota (vedoucí likvidace, risk manager)
7. ARCHITEKTI — technický segment (hlavní architekt, PM)
8. SPRÁVCI NEMOVITOSTÍ — opakované zakázky (property manager)', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'audience', 'Bolesti B2B klientů',
'Společné: Fyzické prohlídky drahé a časově náročné. Fotografie nezachytí prostorový kontext. Dokumentace neaktuální. Rozhodovatelé nemohou přijet osobně. Konkurence nabízí lepší online prezentaci. Specifické: Developeři — prodat off-plan zahraničním kupcům. Hotely — zvýšit přímé rezervace, snížit OTA závislost. Průmysl — efektivní školení, dokumentace údržby. Pojišťovny — přesná forenzní dokumentace. Architekti — přesné as-built, BIM. Muzea — globální dosah, archivace.', true);

-- ---- USP ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'usp', 'Proč Virtual View',
'1. CENA: 30–45 % pod trhem u menších prostor. 2. B2B SPECIALIZACE: Rozumíme developerům, hotelům, průmyslu, pojišťovnám — ne jen „fotograf pro realitky." 3. REGIONÁLNÍ DOMINANCE: Plzeňský kraj bez silného konkurenta. 4. TECH ZÁZEMÍ: Infinity Loop = custom integrace, API, embedding. 5. KOMPLETNÍ SERVIS: Sken → Mattertags → BIM export → Google Street View → VR. 6. RYCHLOST: Model za 3–5 dní. 7. MĚŘITELNÉ VÝSLEDKY: Engagement, konverze, doba na stránce.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'usp', 'Strategické poznatky',
'1. Český trh cenově kompresovaný — odlišení specializací na B2B mimo reality (nulová konkurence, vyšší ochota platit). 2. Nejsilnější argumenty: prodej +31 %, leady +49 %, úspora 6 000 hodin (BMO), chyby -73 % (stavebnictví). 3. Customer journey pokrytí: awareness → consideration → decision napříč segmenty a platformami.', true);

-- ---- FAQ ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'faq', 'Jak dlouho trvá skenování?',
'Byt do 100 m²: 30–45 min. Dům 200 m²: 60–90 min. Velký komerční objekt: 2–4 hodiny. Zpracování: 24–48 h. Celkem: 3–5 pracovních dní.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'faq', 'Co připravit?',
'Uklizený prostor, zapnout světla, otevřít žaluzie. Odstranit osobní předměty. U komerčních prostor: zajistit přístup do všech místností.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'faq', 'Exportní formáty',
'Standardní: 3D model (web odkaz), embedding kód, půdorysy (PDF), fotografie. Profesionální: E57, OBJ, RVT (Revit), DWG (AutoCAD), XYZ. BIM/CAD exporty jako příplatek.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'faq', 'Funguje na mobilu?',
'Ano. Plně responzivní — PC, tablet, mobil bez instalace. VR: Meta Quest, HTC Vive. Google Street View integrace přímo v Google Mapách.', true);

-- ---- GENERAL (content patterns) ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'general', 'Pattern: Statistika + benefit',
'Formát: Data-driven post. Struktura: 1. Hook: Překvapivá statistika. 2. Kontext: Co to znamená. 3. Benefit: Jak 3D prohlídka řeší problém. 4. Důkaz: Case study nebo data. 5. CTA: virtualview.cz nebo konzultace. Příklad: „Nemovitosti s 3D prohlídkou se prodávají o 31 % rychleji. Studie 143 000 listingů to potvrzuje."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'general', 'Pattern: Problém-řešení',
'Formát: Pain point → řešení. Struktura: 1. Problém: Konkrétní bolest cílového segmentu. 2. Důsledky: Co to stojí (čas, peníze, ztracené příležitosti). 3. Řešení: Jak 3D prohlídka eliminuje problém. 4. Důkaz: Čísla nebo příklad. 5. CTA: Nabídka pilotního skenu nebo konzultace.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'general', 'Pattern: Before-after srovnání',
'Formát: Kontrast starý vs nový přístup. Struktura: 1. PŘED: Jak to funguje bez 3D (čas, náklady, chyby). 2. PO: Jak to funguje s Matterport (úspora, přesnost, rychlost). 3. Čísla: Konkrétní srovnání. 4. CTA. Příklad: „Manuální zaměřování: 10 hodin. Matterport: pod hodinu. Výstup jde přímo do Revitu."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'general', 'Pattern: Trendový / thought-leadership',
'Formát: Vizionářský post o budoucnosti. Struktura: 1. Trend: Globální data o růstu trhu. 2. Signál: CoStar koupil Matterport za 1,6 mld USD. 3. Implikace: Co to znamená pro české firmy. 4. Příklady odvětví. 5. CTA: Diskuze nebo konzultace.', true);

-- ===========================================
-- 3. PROMPT TEMPLATES
-- ===========================================

INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES

-- IDENTITY
('17443720-68b7-460a-859e-28b1b5d66913', 'identity_vv', 'identity',
$$Jsi content specialista pro Virtual View (virtualview.cz) — službu profesionálního 3D skenování a tvorby digitálních dvojčat pomocí technologie Matterport.

KDO JSME:
- Virtual View, provozuje Infinity Loop, s.r.o. (David Choc, Plzeň)
- Profesionální Matterport 3D skenování pro B2B klienty
- Specializace: nemovitosti, hotely, muzea, průmysl, pojišťovnictví, stavebnictví, správa budov
- Web: virtualview.cz

TVOJE ROLE:
- Generuješ odborný B2B obsah pro LinkedIn, Instagram a Facebook
- Používáš ověřené statistiky a data (nikdy nevymýšlej čísla)
- Komunikuješ česky, profesionálně, datově podloženě
- Cílíš na decision-makery v B2B segmentech
- Každý post má konkrétní CTA směřující na virtualview.cz$$,
'Identita Virtual View', 10),

-- COMMUNICATION
('17443720-68b7-460a-859e-28b1b5d66913', 'communication_vv', 'communication',
$$PRAVIDLA KOMUNIKACE:
- JAZYK: Piš VÝHRADNĚ česky LATINKOU s háčky a čárkami
- TÓN: Profesionální B2B, datově podložený, bez marketingových klišé
- EMOJI: Maximálně 2 na post (jen pokud přidávají hodnotu), na LinkedIn žádné
- HASHTAHY: 3–5 na konci postu, nikdy v textu (#VirtualView #3Dprohlidka #digitalnitvojce)
- ČÍSLA: Vždy konkrétní statistiky s kontextem, nikdy vymyšlená
- FORMÁT: Krátké odstavce (max 3 věty), bullet points pro přehlednost
- CTA: Vždy konkrétní akce (konzultace, demo, odkaz na virtualview.cz)

PLATFORMY:
- LINKEDIN: Nejdelší texty (150–250 slov), odborný tón, bez emoji, B2B decision-makeři
- FACEBOOK: Střední délka (100–160 slov), přístupnější tón, max 2 emoji
- INSTAGRAM: Nejkratší (80–120 slov), vizuální storytelling, max 2 emoji, 3–5 hashtagů$$,
'Komunikační pravidla Virtual View', 20),

-- GUARDRAIL
('17443720-68b7-460a-859e-28b1b5d66913', 'guardrail_vv', 'guardrail',
$$ZAKÁZANÝ OBSAH:
- Kritika konkrétních konkurentů jménem
- Nepodložené nebo vymyšlené statistiky
- „Zaručená návratnost investice" nebo „100% přesnost" bez kontextu
- Politická témata, osobní útoky
- Clickbait bez hodnoty
- Srovnání s konkrétními cenami konkurentů
- Buzzwordy bez obsahu („revoluční", „game-changer", „disruptivní")

POVINNÉ:
- Vždy uvádět zdroj statistiky (Matterport, Redfin, Zillow, NAR apod.)
- Vždy CTA na virtualview.cz
- Vždy zmínit „3D prohlídka" nebo „digitální dvojče" nebo „Matterport"
- U hotelů: zmínit přímé rezervace vs OTA
- U stavebnictví: zmínit BIM kompatibilitu
- U pojišťoven: zmínit forenzní přesnost$$,
'Guardrails Virtual View', 30),

-- CONTENT STRATEGY
('17443720-68b7-460a-859e-28b1b5d66913', 'content_strategy_vv', 'content_strategy',
$$OBSAHOVÉ PILÍŘE:

1. EDUKACE (60 %):
   - Jak 3D prohlídka řeší konkrétní problém v daném segmentu
   - Statistiky a data o dopadu na business
   - Technické funkce Matterport (Dollhouse, Mattertags, BIM export)
   - Trendy v digitálních dvojčatech

2. SOFT-SELL (25 %):
   - Use cases s konkrétními čísly
   - Before-after srovnání (manuální vs Matterport)
   - Segment-specifické benefity

3. HARD-SELL (15 %):
   - Nabídka pilotního skenu
   - Akční ceny
   - Přímá výzva ke konzultaci

ROTACE SEGMENTŮ:
Střídat cílové segmenty — nikdy 2 posty za sebou pro stejný segment.
Pořadí priority: developeři → hotely → průmysl → architekti → pojišťovny → muzea → správci → školy → retail → vláda → zdravotnictví

CUSTOMER JOURNEY:
- Awareness: Statistiky, trendy, vzdělávací obsah
- Consideration: Use cases, srovnání, ROI kalkulace
- Decision: Nabídka demo, pilotní sken, konzultace$$,
'Content strategie Virtual View', 40),

-- VISUAL STYLE
('17443720-68b7-460a-859e-28b1b5d66913', 'visual_style_vv', 'visual_style',
$$VIZUÁLNÍ STYL PRO GENEROVÁNÍ OBRÁZKŮ:

FOTOGRAFIE:
- Profesionální interiéry a exteriéry budov
- Matterport kamera v akci (skenování)
- Moderní architektura, průmyslové prostory, hotelové interiéry
- Muzejní výstavy, showroomy
- Čisté, dobře osvětlené prostory

BARVY:


STYL:
- Profesionální, inovativní
- Žádné stock photo klišé
- Preferovat reálné prostory před renderem
- Pokud možno ukázat interaktivitu (člověk u tabletu s 3D modelem)$$,
'Vizuální styl Virtual View', 45),

-- PROMPT EXAMPLES (17 promptů z průzkumu trhu)
('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_developeri_linkedin', 'examples',
$$Napiš odborný LinkedIn post pro Virtual View cílený na developery rezidenčních i komerčních projektů v ČR. Typ: statistika + benefit. Délka: 150–200 slov. Tón: profesionální, datově podložený, bez emoji. Téma: jak 3D digitální dvojče vzorového bytu urychluje off-plan prodej. Použij statistiku „65 % bytů prodáno před kolaudací díky 3D prohlídce" a „nemovitosti s 3D prohlídkou se prodávají o 31 % rychleji." Zdůrazni zahraniční kupující a Dollhouse View. CTA: bezplatná konzultace na virtualview.cz.$$,
'Prompt: Developeři / LinkedIn / Awareness', 50),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_hotely_instagram', 'examples',
$$Napiš Instagram post pro Virtual View zaměřený na hotely, penziony a wellness centra v ČR. Typ: benefit + otázka. Délka: 80–120 slov. Tón: odborný, přístupný. Téma: jak virtuální prohlídka hotelu zvyšuje přímé rezervace a snižuje závislost na OTA (Booking, Expedia). Statistiky: „+48 % rezervací" a „3× více času na webu." Provokativní otázka na začátku. 3–5 hashtagů. Max 2 emoji. CTA: virtualview.cz v bio.$$,
'Prompt: Hotely / Instagram / Consideration', 51),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_pojistovny_linkedin', 'examples',
$$Napiš LinkedIn post pro Virtual View cílený na pojišťovny, likvidátory škod a risk manažery. Typ: case study / problém-řešení. Délka: 180–250 slov. Tón: vysoce odborný, forenzní přesnost. Téma: Matterport 3D sken pro dokumentaci škodních událostí. Scénář (požár/povodeň), kde klasická fotodokumentace selhává. Přesnost do 1 %, nemanipulovatelná časová razítka, Xactimate exporty. ROI: eliminace opakovaných návštěv. CTA: pozvánka na demo. Bez emoji.$$,
'Prompt: Pojišťovny / LinkedIn / Decision', 52),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_prumysl_linkedin', 'examples',
$$Napiš LinkedIn post pro Virtual View cílený na manažery průmyslových podniků, facility manažery a HR ředitele. Typ: statistika + vzdělávací. Délka: 150–200 slov. Tón: profesionální B2B, ROI orientovaný. Téma: digitální dvojče výrobního závodu pro školení, údržbu a vzdálené inspekce. Data: „školení -40 %" a „BMO: 503 poboček za 3 měsíce, úspora 6 000 hodin." Mattertags s technickou dokumentací. Bezpečnostní aspekt. CTA: pilotní sken jedné haly. Bez emoji.$$,
'Prompt: Průmysl / LinkedIn / Awareness', 53),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_muzea_facebook', 'examples',
$$Napiš Facebook post pro Virtual View zaměřený na muzea, galerie a kulturní instituce. Typ: inspirativní + benefit. Délka: 120–160 slov. Tón: kultivovaný, inspirativní, podložený daty. Téma: virtuální výstava zpřístupňuje sbírky celému světu. Příklad: „320 m², 2 500 virtuálních návštěvníků/měsíc, 42 % pak přišlo osobně." Mattertags jako průvodce, digitální archivace, VR. CTA: konzultace. Max 1 emoji.$$,
'Prompt: Muzea / Facebook / Consideration', 54),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_architekti_instagram', 'examples',
$$Napiš Instagram post pro Virtual View cílený na architekty, projektanty a stavební inženýry. Typ: before-after srovnání. Délka: 80–110 slov. Tón: technický, praktický. Téma: manuální zaměřování vs Matterport sken s BIM exportem. Kontrast: „10 hodin, 20–30 % více change orders" vs „pod hodinu, přesnost 2 cm, export do Revitu/AutoCADu." Formáty E57, OBJ, RVT, DWG. CTA: virtualview.cz. 3–4 hashtagy. Max 1 emoji.$$,
'Prompt: Architekti / Instagram / Awareness', 55),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_spravci_linkedin', 'examples',
$$Napiš LinkedIn post pro Virtual View cílený na property manažery a správce komerčních budov. Typ: problém-řešení + ROI. Délka: 170–220 slov. Tón: pragmatický, úspora času a peněz. Téma: digitální dvojče portfolia eliminuje neproduktivní prohlídky. Pain point: desítky prohlídek s nekvalifikovanými zájemci. 3D prohlídka jako „filtr." Statistika: „+49 % kvalifikovaných leadů," „-60 % zbytečných prohlídek." CTA: „Spočítejte si s námi úsporu." Bez emoji.$$,
'Prompt: Správci / LinkedIn / Decision', 56),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_skoly_facebook', 'examples',
$$Napiš Facebook post pro Virtual View zaměřený na školy, univerzity a vzdělávací instituce. Typ: vzdělávací + příběh. Délka: 120–160 slov. Tón: přístupný, akademický. Téma: virtuální prohlídka kampusu pro nábor studentů. Narativ: zahraniční student vybírá mezi 5 univerzitami, jen jedna nabízí 3D prohlídku. Mattertags s info o programech, navigace, dny otevřených dveří bez kapacitních omezení. CTA: „Dejte uchazečům důvod vybrat si vás." Max 1 emoji.$$,
'Prompt: Školy / Facebook / Awareness', 57),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_coworking_instagram', 'examples',
$$Napiš Instagram post pro Virtual View zaměřený na coworkingová centra a business centra. Typ: benefit + vizuální storytelling. Délka: 80–110 slov. Tón: moderní, podnikatelský. Téma: virtuální prohlídka pomáhá obsazovat flex desky rychleji. Členové prohlédnou prostory 24/7 z domova. Mattertags s cenami a dostupností. Embedding do webu. CTA: web v bio. 3–4 hashtagy. Max 2 emoji.$$,
'Prompt: Coworking / Instagram / Consideration', 58),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_retail_linkedin', 'examples',
$$Napiš LinkedIn post pro Virtual View cílený na maloobchod, showroomy, autosalony a e-commerce. Typ: trendový + benefit. Délka: 150–200 slov. Tón: progresivní, business. Téma: „vždy otevřený" virtuální showroom 24/7. Mattertags propojují produkty s e-shopem. Vizuální merchandising, školení zaměstnanců. Trend: zákazníci chtějí online zážitek blízký fyzické návštěvě. CTA: „Otevřete showroom světu — 24/7." Bez emoji.$$,
'Prompt: Retail / LinkedIn / Awareness', 59),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_stavebnictvi_linkedin', 'examples',
$$Napiš LinkedIn post pro Virtual View cílený na stavbyvedoucí a projektové manažery. Typ: ROI kalkulace. Délka: 200–250 slov. Tón: technický, pragmatický, čísla. Téma: pravidelné 3D skenování stavby pro dokumentaci, vzdálené inspekce, prevenci víceprací. Data: „vícepráce 5–12 % rozpočtu," „BIM detekce kolizí -40 %," „reality capture: -73 % chyb." Workflow: měsíční sken → BIM overlay → identifikace odchylek. Export E57. CTA: „Spočítejme, kolik vám vícepráce stojí." Bez emoji.$$,
'Prompt: Stavebnictví / LinkedIn / Decision', 60),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_restaurace_facebook', 'examples',
$$Napiš Facebook post pro Virtual View zaměřený na restaurace, kavárny, event centra a svatební místa. Typ: otázka + benefit. Délka: 100–140 slov. Tón: přátelský, profesionální. Téma: virtuální prohlídka přesvědčí event plánovače před první návštěvou. Otázka: „Kolik event plánovačů musí objíždět 10 míst osobně?" 3D prohlídka = posouzení atmosféry za 3 minuty. Mattertags s kapacitami, ceníky. CTA: „Nechte prostor prodávat sám — 24/7." Max 2 emoji.$$,
'Prompt: Restaurace / Facebook / Awareness', 61),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_vlada_linkedin', 'examples',
$$Napiš LinkedIn post pro Virtual View cílený na státní správu, kraje, města. Typ: vzdělávací + vize. Délka: 160–210 slov. Tón: formální, důvěryhodný. Téma: digitální dvojče veřejných budov pro správu, údržbu, krizové řízení, památkovou ochranu. Plánování evakuací, dokumentace památek, vzdálený přístup. Matterport for Government (FedRAMP). EU dotace na digitalizaci. CTA: „Přenesme správu budov do 21. století." Bez emoji.$$,
'Prompt: Vláda / LinkedIn / Consideration', 62),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_zdravotnictvi_linkedin', 'examples',
$$Napiš LinkedIn post pro Virtual View cílený na ředitele nemocnic a facility manažery klinik. Typ: benefit + problém-řešení. Délka: 150–190 slov. Tón: odborný, seriózní. Téma: digitální dvojče nemocnice pro rekonstrukce, umístění vybavení, orientaci pacientů, regulatorní kontroly. Eliminace opakovaných obhlídek. Hygienický argument — méně průchodů = nižší kontaminace. CTA: „Digitalizujte infrastrukturu — od operačních sálů po parkoviště." Bez emoji.$$,
'Prompt: Zdravotnictví / LinkedIn / Awareness', 63),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_vsechny_instagram', 'examples',
$$Napiš Instagram post pro Virtual View jako souhrnný „proč 3D sken" post pro všechny B2B segmenty. Typ: srovnání / before-after. Délka: 90–120 slov. Tón: přesvědčivý, faktický. Téma: 5 důvodů proč 3D digitální dvojče překonává klasické fotky a video. Kontrasty: prostorové porozumění, interaktivita, měřitelnost, engagement (6× delší čas), datové výstupy (půdorysy, BIM, VR). Originální formulace. CTA: virtualview.cz. 4–5 hashtagů. Max 2 emoji.$$,
'Prompt: Všechny segmenty / Instagram / Decision', 64),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_cross_facebook', 'examples',
$$Napiš Facebook post pro Virtual View jako obecný awareness post. Typ: statistický přehled. Délka: 120–150 slov. Tón: informativní, autoritativní. Téma: 5 nejsilnějších statistik o dopadu 3D prohlídek. Vyber z: prodej +31 %, leady +49 %, 6× delší čas, hotely +48 %, chyby -73 %, školení -40 %. Ke každé statistice jedna věta kontextu. Otázka na konci: „Který údaj je pro vaše odvětví nejrelevantnější?" CTA: kontaktujte nás. Max 1 emoji.$$,
'Prompt: Cross-segment / Facebook / Awareness', 65),

('17443720-68b7-460a-859e-28b1b5d66913', 'prompt_thought_leadership_linkedin', 'examples',
$$Napiš LinkedIn post pro Virtual View jako thought-leadership o budoucnosti digitálních dvojčat. Typ: vzdělávací / trendový. Délka: 200–250 slov. Tón: vizionářský, podložený fakty, bez buzzwordů. Téma: proč je 2026 zlomový — trh roste o 32,6 % ročně, CoStar koupil Matterport za 1,6 mld USD, 50 mld sq ft globálně. Co to znamená pro české firmy. AI funkce (popisy, defurnishing, měření). Konkrétní příklady odvětví. CTA: „Kde vidíte digitální dvojčata ve svém odvětví? Napište nám." Bez emoji.$$,
'Prompt: Thought-leadership / LinkedIn / Consideration', 66);

-- ===========================================
-- 4. RSS KANÁLY
-- ===========================================

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- NEMOVITOSTI & REALITY (hlavní segment)
('17443720-68b7-460a-859e-28b1b5d66913', 'Hospodářské noviny - Reality', 'https://reality.ihned.cz/?m=rss', 'nemovitosti', true, 6),
('17443720-68b7-460a-859e-28b1b5d66913', 'iDNES.cz - Bydlení', 'https://www.idnes.cz/bydleni/rss', 'nemovitosti', true, 12),
('17443720-68b7-460a-859e-28b1b5d66913', 'Kurzy.cz - Reality', 'https://www.kurzy.cz/rss/reality/', 'nemovitosti', true, 24),

-- TECHNOLOGIE & INOVACE
('17443720-68b7-460a-859e-28b1b5d66913', 'Lupa.cz - Technologie', 'https://www.lupa.cz/rss/clanky/', 'technologie', true, 12),
('17443720-68b7-460a-859e-28b1b5d66913', 'Root.cz - IT', 'https://www.root.cz/rss/clanky/', 'technologie', true, 24),
('17443720-68b7-460a-859e-28b1b5d66913', 'CzechCrunch', 'https://cc.cz/feed/', 'technologie', true, 12),

-- STAVEBNICTVÍ & ARCHITEKTURA
('17443720-68b7-460a-859e-28b1b5d66913', 'TZB-info - Stavebnictví', 'https://www.tzb-info.cz/rss', 'stavebnictvi', true, 12),
('17443720-68b7-460a-859e-28b1b5d66913', 'ASB Portal - Stavebnictví', 'https://www.asb-portal.cz/rss', 'stavebnictvi', true, 24),

-- HOSPITALITY & TURISMUS
('17443720-68b7-460a-859e-28b1b5d66913', 'COT Business - Cestovní ruch', 'https://www.cot.cz/feed/', 'hospitality', true, 24),
('17443720-68b7-460a-859e-28b1b5d66913', 'TTG Czech - Turismus', 'https://www.ttg.cz/feed/', 'hospitality', true, 24),

-- PRŮMYSL & VÝROBA
('17443720-68b7-460a-859e-28b1b5d66913', 'Technický týdeník', 'https://www.technickytydenik.cz/rss', 'prumysl', true, 24),

-- POJIŠŤOVNICTVÍ & FINANCE
('17443720-68b7-460a-859e-28b1b5d66913', 'Peníze.cz - Pojištění', 'https://www.penize.cz/pojisteni/rss', 'pojistovnictvi', true, 24),
('17443720-68b7-460a-859e-28b1b5d66913', 'E15.cz - Finance', 'https://www.e15.cz/rss', 'finance', true, 12),

-- KULTURA & MUZEA
('17443720-68b7-460a-859e-28b1b5d66913', 'iDNES.cz - Kultura', 'https://www.idnes.cz/kultura/rss', 'kultura', true, 24),

-- EKONOMIKA (kontext)
('17443720-68b7-460a-859e-28b1b5d66913', 'Hospodářské noviny - Ekonomika', 'https://ekonomika.ihned.cz/?m=rss', 'ekonomika', true, 12),
('17443720-68b7-460a-859e-28b1b5d66913', 'ČNB - Tiskové zprávy', 'https://www.cnb.cz/cs/rss/rss_tz.xml', 'ekonomika', true, 24);

-- ===========================================
-- KONEC SEEDU Virtual View
-- ===========================================
