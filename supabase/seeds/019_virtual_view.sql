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
-- 5. B2C KNOWLEDGE BASE
-- ===========================================

-- ---- B2C STRATEGIE ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'general', 'B2C strategie komunikace',
'Soukromé osoby se rozhodují emocionálně — ale svůj rozhodovací proces ospravedlňují racionálně. B2C prompty proto pracují na obou vrstvách: nejprve vzbudíme zájem nebo emoci (strach z chyby, touha po jednoduchosti, hrdost na svůj prostor), pak přidáme konkrétní číslo nebo benefit, který rozhodnutí racionalizuje.

Zásady B2C komunikace:
- Hook: První věta musí zastavit scrollování — otázka, číslo, provokace nebo situace, se kterou se čtenář okamžitě ztotožní.
- Žádný jargon: Nepište „digitální dvojče", „3D spatial data" ani „dollhouse view" — pište „projít si celý byt z gauče."
- Konkrétní, ne obecné: Místo „prodejte rychleji" pište „prodejte o 10 dní dříve." Místo „za vyšší cenu" pište „+360 000 Kč."
- Jedna myšlenka na post: Každý post komunikuje jeden benefit nebo jeden příběh. Více = méně.
- CTA je konkrétní: Ne „Zjistěte více." Ale „Prohlédněte si ukázkový sken na virtualview.cz."
- Bez RK kontextu: Virtual View je samostatná služba — v B2C postech se žádná realitní kancelář nezmiňuje.
- A/B testujte hooky — stejný prompt s jiným prvním odstavcem může mít 3× vyšší engagement.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'audience', 'B2C cílové segmenty',
'Klíčové B2C segmenty Virtual View:

1. PRODÁVAJÍCÍ NEMOVITOST — Pain: Dlouho na trhu, málo vážných zájemců, nutnost stále uklízet a být doma při prohlídkách.
2. KUPUJÍCÍ NEMOVITOST — Pain: Obava z koupě zajíce v pytli, zbytečné cestování na prohlídky, velká životní investice.
3. PRONAJÍMATEL — Pain: Ztráta času neproduktivními prohlídkami, pomalé obsazení, nekvalitní nájemci.
4. NÁJEMCE HLEDAJÍCÍ BYT — Pain: Nejistota z dálkového výběru, strach že prostor nevypadá jako na fotkách.
5. MAJITEL (DOKUMENTACE) — Pain: Žádná dokumentace stavu před rekonstrukcí, pojistná událost, dědictví.
6. RODINY A ŽIVOTNÍ ROZHODNUTÍ — Pain: Vzdálení příbuzní nemohou vidět nový dům, plánování stěhování, příprava dětí na nový domov.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'data', 'B2C statistiky pro social media',
'Ověřené statistiky pro B2C komunikaci — každé číslo má zdroj:
- Prodej o 31 % rychleji — Méně týdnů stresu, dříve máte peníze. (Matterport, 143 000 listingů)
- O 9 % vyšší prodejní cena — Průměrný byt za 4 mil.: +360 000 Kč navíc. (Matterport)
- 71 % kupujících by koupilo bez fyzické prohlídky — Váš byt dostupný pro kupující z celé ČR i zahraničí. (Redfin)
- O 49 % více kvalifikovaných zájemců — Méně zbytečných návštěv, více vážných kupujících. (Matterport)
- 3–6× delší čas strávený na inzerátu — Kupující si byt prochází celý, ne jen scrollují fotkami. (Zillow)
- 88 % prodávajících preferuje makléře s 3D — Moderní prezentace jako standard, ne bonus. (NAR)
- Přesnost měření do 1 % — Spolehlivá dokumentace pro pojistku, dědictví, rekonstrukci. (Matterport)', true);

-- ---- B2C USE CASES ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'B2C: Prodávající nemovitost',
'Cíl: Ukázat, že 3D sken urychlí prodej, zvýší cenu a ušetří nervy. Prodávající je emotivně zaangažovaný — chce prodat rychle, za dobrou cenu a bez stresu.

Klíčové argumenty:
- Prodej o 31 % rychleji (méně týdnů stresu)
- O 9 % vyšší cena (byt za 4 mil. = +360 000 Kč)
- O 49 % více kvalifikovaných zájemců (méně zbytečných prohlídek)
- 3D prohlídka funguje jako předfiltr — přijdou jen ti, kdo to myslí vážně
- Průměrný prodej v ČR: 15–20 prohlídek, většina s lidmi, kteří si byt „jen chtějí podívat"

Emocionální vrstva: Každá prohlídka = uklízení, přítomnost doma, ztracený čas. S 3D skenem tohle končí.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'B2C: Kupující nemovitost',
'Cíl: Ukázat, že 3D sken eliminuje nejistotu, šetří čas cestování a pomáhá se správně rozhodnout. Kupující má strach z největší životní investice — nechce litovat.

Klíčové argumenty:
- 71 % kupujících by koupilo bez fyzické prohlídky s kvalitní 3D tour
- Přesné měření každé místnosti přímo v prohlídce
- Dollhouse view (ptačí pohled na celou dispozici)
- Schématický půdorys s rozměry automaticky ze skenu
- Sdílení prohlídky s partnerem, rodiči, architektem
- Kupující po 3D prohlídce přicházejí s konkrétními otázkami — ne s pochybami

Emocionální vrstva: Fotky lžou. 3D prohlídka ukazuje skutečné rozměry, skutečný prostor. Žádné překvapení po příjezdu.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'B2C: Pronajímatel',
'Cíl: Ukázat, jak 3D sken urychlí obsazení, filtruje kvalitní nájemce a šetří čas. Pronajímatel je pragmatický — řeší výnos a spolehlivé nájemce.

Klíčové argumenty:
- Nájemce, který prošel celým bytem virtuálně a stále chce přijít, přichází s rozhodnutím
- Méně zbytečných prohlídek, méně nepřizpůsobivých zájemců
- Sken funguje 24/7 — prohlídka v noci, o víkendu, z jiného města
- Nájemce zná přesně co dostane — žádné stížnosti po nastěhování

Emocionální vrstva: „Kolikrát jste museli přijít kvůli prohlídce, která skončila za 5 minut větou ‚Dám vám vědět'?"', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'B2C: Dokumentace a pojistné události',
'Cíl: Ukázat hodnotu 3D skenu jako trvalé digitální dokumentace stavu nemovitosti — pro pojišťovny, dědictví, rekonstrukce, sousedské spory.

Klíčové argumenty:
- Kompletní digitální dokumentace každé místnosti s přesnými rozměry
- Časové razítko a nemanipulovatelná historie
- Dostupné kdykoli z internetu
- Využití: pojistná událost (stav před škodou), rekonstrukce (přesné rozměry), prodej (podklad pro cenu), dědické řízení

Scénář: Povodeň, požár nebo krádež — pojišťovna chce zdokumentovat stav před škodou. Kdo ho má?
Přesnost měření do 1 % — spolehlivá dokumentace.', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'case_study', 'B2C: Lifestyle a emocionální posty',
'Cíl: Budovat povědomí a sympatie ke značce Virtual View prostřednictvím témat blízkých každému — nový domov, vzpomínky, rodina. Nejsou to prodejní posty — jsou to posty, které se sdílejí.

Témata:
- Vzpomínky na dům: Domy nesou vzpomínky — a ty se dají digitálně zachovat. Někdo prodává dům, ve kterém vyrostl.
- Stěhování daleko: Ukázat nový domov rodičům nebo přátelům, kteří žijí daleko — pošlete link.
- Hrdost na domov: Váš byt je krásný — a zaslouží si víc než pár fotek. 3D prohlídka zachytí každý detail.

Tón: Nostalgický, teplý, lidský. Bez přímého prodeje v prvních větách.', true);

-- ---- B2C CONTENT PATTERNS ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'general', 'B2C Pattern: Emocionální příběh + statistika',
'Formát: Příběh → emoce → číslo → CTA. Struktura: 1. Situace (příběh, se kterým se čtenář ztotožní). 2. Problém (bolest, frustrace). 3. Řešení (3D prohlídka). 4. Důkaz (konkrétní statistika). 5. CTA (virtualview.cz). Příklad: „Byt na trhu 4 měsíce, každý týden prohlídka, každý týden zklamání — pak majitel přidal 3D prohlídku a prodal za 3 týdny."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'general', 'B2C Pattern: Číslo jako hook',
'Formát: Konkrétní číslo → vysvětlení → benefit → CTA. Struktura: 1. Hook: Překvapivé číslo (360 000 Kč, 31 %, 71 %). 2. Kontext: Co to číslo znamená v praxi. 3. Proč: Logické vysvětlení (kupující ví co kupuje → ochota zaplatit více). 4. CTA. Příklad: „360 000 Kč. Tolik navíc dostanete za průměrný byt s 3D prohlídkou."', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'general', 'B2C Pattern: Engagement / anketa / otázka',
'Formát: Otázka do diskuse → kontext → jemný brand. Cíl: Generovat komentáře, sdílení a interakci. Algoritmy sítí preferují posty s vysokým engagement. Tyto posty neprodávají přímo — sbírají publikum. Příklady: „Kolik prohlídek jste měli, než jste prodali svůj byt?" „Jak si procházíte nemovitosti online? A) Fotky + popis B) Chci 3D prohlídku"', true),

('17443720-68b7-460a-859e-28b1b5d66913', 'general', 'B2C Editorial kalendář — 4 týdny',
'Týden 1 — Awareness: IG: Žádná překvapení (kupující vs fotky), FB: Prodej rychleji (příběh), LI: Konec zbytečných prohlídek (data).
Týden 2 — Engagement: IG: Lepší nájemci (storytelling), FB: Otázka do diskuse, LI: Rozhodněte se jistě (due diligence).
Týden 3 — Consideration: IG: Ukažte svůj domov (hrdost), FB: Dokumentace (pojistná událost), LI: Rekonstrukce (praktický benefit).
Týden 4 — Decision/Action: IG: Věděli jste, že? (statistika), FB: Anketa (engagement), LI: Prodejte za víc (číslo jako hook).
Rytmus: 3 posty/týden (1 per platforma), rotace segmentů, střídání awareness → engagement → consideration → decision.', true);

-- ===========================================
-- 6. B2C PROMPT TEMPLATES
-- ===========================================

INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES

-- B2C GUARDRAIL
('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_guardrail_vv', 'guardrail',
$$B2C PRAVIDLA (doplněk k hlavním guardrails):
- JAZYK: Čeština, přístupný tón, bez odborného žargonu
- Nepište „digitální dvojče" — pište „projít si celý byt z gauče"
- Nepište „dollhouse view" — pište „ptačí pohled na celý byt"
- Jedna myšlenka na post — více = méně
- CTA je vždy konkrétní akce, ne „zjistěte více"
- Bez zmínky o realitních kancelářích — Virtual View je samostatná služba
- Statistiky vždy s kontextem pro běžného člověka (ne procenta, ale koruny/dny)
- Emocionální vrstva + racionální důkaz v každém postu
- Hook musí zastavit scrollování — otázka, číslo, situace$$,
'B2C guardrails Virtual View', 31),

-- B2C COMMUNICATION
('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_communication_vv', 'communication',
$$B2C KOMUNIKAČNÍ PRAVIDLA:
- TÓN: Důvěryhodný, přístupný, emocionálně rezonující, bez fluff
- EMOJI: Max 2 (Facebook, Instagram), 0 na LinkedIn
- HASHTAHY: 3–4 na Instagram, žádné na LinkedIn, volitelně 1–2 na Facebook
- FORMÁT: Krátké odstavce, jedna myšlenka = jeden odstavec
- HOOK: Vždy první věta zastaví scrollování
- ČÍSLA: Vždy přeložit do praxe (ne „9 %" ale „+360 000 Kč u bytu za 4 miliony")

PLATFORMY B2C:
- FACEBOOK: 100–160 slov, příběhy, emoce, otázky do diskuse, max 2 emoji
- INSTAGRAM: 60–120 slov, vizuální, krátké, hashtagy, max 2 emoji
- LINKEDIN: 150–200 slov, profesionální i pro B2C (prodávající manažeři, investoři), bez emoji$$,
'B2C komunikační pravidla', 21),

-- SKUPINA 1: PRODÁVAJÍCÍ NEMOVITOST
('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_prodej_rychleji_fb', 'examples',
$$Napište Facebook post pro Virtual View (virtualview.cz) zaměřený na lidi, kteří prodávají nebo plánují prodat svůj byt nebo dům v ČR. Začni příběhem: byt na trhu 4 měsíce, každý týden prohlídka, každý týden zklamání — a pak majitel přidal 3D prohlídku a prodal za 3 týdny. Nepoužívejte to jako faktuální case study, ale jako ilustrativní příběh ('Představte si...'). Přidejte statistiku: nemovitosti s 3D prohlídkou se prodávají o 31 % rychleji. Zdůrazněte, že zájemci přicházejí připraveni — 3D prohlídku si udělali sami, přišli na fyzickou prohlídku jen ti, kdo to myslí vážně. Tón: empatický, věcný, bez přehnaného prodejního tónu. Maximálně 1 emoji. Délka: 130–160 slov. CTA: 'Zjistěte, co pro váš byt může udělat 3D sken na virtualview.cz'. Čeština.$$,
'B2C: Prodej rychleji / Facebook / Awareness', 100),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_prodejte_za_vic_ig', 'examples',
$$Napište Instagram post pro Virtual View. Začněte konkrétním číslem jako hook: '360 000 Kč.' Pak vysvětlete: průměrný byt za 4 miliony se s 3D prohlídkou prodává o 9 % dráže — to je reálná částka navíc, ne procento na papíře. Vysvětlete proč: kupující, kteří prošli celým bytem virtuálně a rozhodli se ho chtít, jsou ochotni zaplatit více. Vědí, co kupují. Tón: přímý, bez zbytečných slov, respektující inteligenci čtenáře. Bez přehnaných výkřiků. 3–4 hashtagy (#prodejnemovitosti #3Dprohlidka #VirtualView #prodejbytu). Maximálně 1 emoji. Délka: 80–100 slov. Čeština.$$,
'B2C: Prodejte za víc / Instagram / Consideration', 101),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_konec_prohlidek_li', 'examples',
$$Napište LinkedIn post pro Virtual View pro lidi prodávající nemovitost, kteří jsou pracovně vytížení a nemají čas na desítky prohlídek. Popište problém: průměrný prodej v ČR zahrnuje 15–20 prohlídek, z nichž většina je s lidmi, kteří si byt 'jen chtějí podívat'. Každá prohlídka = uklízení, přítomnost doma, ztracený čas. Nabídněte řešení: 3D prohlídka funguje jako předfiltr. Lidé, kteří projdou celým bytem online a stále chtějí přijít, jsou kvalifikovaní zájemci. Přidejte statistiku: o 49 % více kvalifikovaných leadů, o 60 % méně zbytečných prohlídek. Tón: profesionální, věcný, respektující čas čtenáře. Bez emoji. Délka: 160–200 slov. CTA: 'Spočítejte si, kolik prohlídek vám 3D sken ušetří.' Čeština.$$,
'B2C: Konec zbytečných prohlídek / LinkedIn / Consideration', 102),

-- SKUPINA 2: KUPUJÍCÍ NEMOVITOST
('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_kup_driv_fb', 'examples',
$$Napište Facebook post pro Virtual View zaměřený na lidi hledající byt nebo dům k nákupu, kteří bydlí daleko od hledané lokality. Začněte situací: 'Našli jste vysněný byt v Plzni, bydlíte v Brně. Jet na prohlídku? 3 hodiny autem tam a zpět.' Vysvětlete, co 3D prohlídka umožňuje: procházet každou místností, měřit vzdálenosti, zkontrolovat sklepní kóje, balkón, vstup do budovy — vše bez nutnosti cestovat. Přidejte, že 71 % kupujících by koupilo nemovitost bez fyzické prohlídky, pokud má kvalitní 3D tour. Tón: přátelský, praktický, bez naléhání. Maximálně 2 emoji. Délka: 120–150 slov. CTA: 'Hledejte nemovitosti s 3D prohlídkou na virtualview.cz.' Čeština.$$,
'B2C: Kup byt dřív než přijedeš / Facebook / Awareness', 103),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_zadna_prekvapeni_ig', 'examples',
$$Napište Instagram post pro Virtual View pro lidi, kteří měli zkušenost s tím, že nemovitost na fotkách vypadá jinak než ve skutečnosti. Kontrastujte: 'Realitní fotka: prostorný obývák. Realita: 14 m² s nízkou výškou stropu.' Pak vysvětlete, jak 3D prohlídka funguje: vidíte skutečné rozměry, dostanete přesný půdorys, můžete si v prohlídce měřit vzdálenosti. Žádné zklamání po příjezdu. Tón: lehce ironický na začátku, pak věcný a uklidňující. 3–4 hashtagy (#kupbytu #3Dprohlidka #VirtualView #nemovitosti). Maximálně 2 emoji. Délka: 80–110 slov. Čeština.$$,
'B2C: Žádná překvapení / Instagram / Consideration', 104),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_rozhodnete_se_jiste_li', 'examples',
$$Napište LinkedIn post pro Virtual View pro lidi uvažující o koupi nemovitosti v hodnotě 5+ milionů Kč. Zdůrazněte, že při takové investici je informovanost klíčová. Popište, co 3D prohlídka nabízí nad rámec fotografií: přesné měření každé místnosti přímo v prohlídce, ptačí pohled na celou dispozici, schématický půdorys s rozměry automaticky generovaný ze skenu, možnost sdílet prohlídku s partnerem, rodiči nebo architektem. Přidejte, že kupující, kteří prošli 3D prohlídkou, přicházejí na fyzickou prohlídku s konkrétními otázkami — ne s pochybami. Tón: profesionální, respektující inteligenci čtenáře. Bez emoji. Délka: 150–180 slov. CTA: 'Podívejte se, jak vypadá 3D dokumentace nemovitosti na virtualview.cz.' Čeština.$$,
'B2C: Rozhodněte se jistě / LinkedIn / Decision', 105),

-- SKUPINA 3: PRONAJÍMATEL
('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_obsadte_byt_fb', 'examples',
$$Napište Facebook post pro Virtual View zaměřený na majitele pronajímaných nemovitostí. Začněte otázkou: 'Kolikrát jste museli přijít kvůli prohlídce, která skončila za 5 minut větou „Dám vám vědět"?' Vysvětlete řešení: nájemce, který prošel celým bytem virtuálně a stále chce přijít, přijde s rozhodnutím. Přidejte přínos: méně zbytečných prohlídek, méně nepřizpůsobivých zájemců, rychlejší obsazení. Zmiňte, že sken funguje 24/7 — potenciální nájemce si prohlídku udělá v noci, o víkendu, z jiného města. Tón: empatický vůči časové zátěži pronajímatele, věcný. Maximálně 1 emoji. Délka: 120–150 slov. CTA: 'Zjistěte víc na virtualview.cz.' Čeština.$$,
'B2C: Obsaďte byt za méně prohlídek / Facebook / Awareness', 106),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_lepsi_najemci_ig', 'examples',
$$Napište Instagram post pro Virtual View. Téma: 3D prohlídka jako způsob, jak přitáhnout seriózní nájemce. Použijte logiku: nájemce, který si prošel celý byt virtuálně, zná přesně co dostane. Nenapíše vám po nastěhování, že 'nevěděl o malé koupelně.' Sám si byt vybral se znalostí věci. Tón: přímý, praktický, mírně s nadhledem. Bez sentimentu. 3–4 hashtagy (#pronajem #pronajimatel #3Dprohlidka #VirtualView). 1 emoji max. Délka: 80–100 slov. Čeština.$$,
'B2C: Lepší nájemci / Instagram / Consideration', 107),

-- SKUPINA 4: DOKUMENTACE A POJISTNÉ UDÁLOSTI
('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_dokumentace_fb', 'examples',
$$Napište Facebook post pro Virtual View pro majitele rodinných domů a bytů. Téma: proč je 3D dokumentace nemovitosti chytrá ochrana. Začněte scénářem: povodeň, požár nebo krádež — a pojišťovna chce zdokumentovat stav před škodou. Kdo ho má? Vysvětlete, co 3D sken nabízí: kompletní digitální dokumentace každé místnosti s přesnými rozměry, časovým razítkem a nemanipulovatelnou historií. Sken je dostupný kdykoli z internetu. Zmiňte, že se hodí i při plánování rekonstrukce (přesné rozměry bez nutnosti měřit), při prodeji (podklad pro cenu), nebo při dědickém řízení. Tón: věcný, klidný, bez strašení. 1 emoji max. Délka: 130–160 slov. CTA: 'Zdokumentujte svůj domov jednou a mějte klid navždy. virtualview.cz.' Čeština.$$,
'B2C: Zdokumentujte svůj domov / Facebook / Awareness', 108),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_rekonstrukce_ig', 'examples',
$$Napište Instagram post pro Virtual View pro lidi, kteří plánují rekonstrukci. Začněte otázkou: 'Víte přesně, kolik metrů má vaše kuchyň? A výšku stropu v každém rohu?' 3D sken dá přesné rozměry každé místnosti — bez metru, bez papíru, bez chyby. Přidejte, že výstup (schématický půdorys s kótami) jde rovnou k architektovi nebo do designového studia. Ušetří hodiny zaměřování. Tón: praktický, přímý, mírně s humorem na začátku. 3–4 hashtagy (#rekonstrukce #interierdesign #3Dprohlidka #VirtualView). 1 emoji max. Délka: 80–110 slov. Čeština.$$,
'B2C: Rekonstrukce bez překvapení / Instagram / Consideration', 109),

-- SKUPINA 5: EMOCIONÁLNÍ A LIFESTYLE POSTY
('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_vzpominky_fb', 'examples',
$$Napište Facebook post pro Virtual View. Téma: domy nesou vzpomínky — a ty se dají digitálně zachovat. Nenapište prodejní text. Napište příběh: někdo prodává dům, ve kterém vyrůstal, a chce mít jeho každý kout uchován — ne jen na fotkách, ale průchozí, živou formou, kterou ukáže dětem. Bez jmenování produktu v prvních třech větách. Tón: nostalgický, teplý, lidský. Na konci jemně naváže na Virtual View: 'Víte, jak snadno dnes jde zachovat každý kout domova?' Bez významného CTA. 1 emoji max. Délka: 100–130 slov. Čeština.$$,
'B2C: Vzpomínky na dům / Facebook / Brand building', 110),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_stehujete_se_ig', 'examples',
$$Napište Instagram post pro Virtual View. Scénář: stěhujete se do nového bytu v jiném městě a nemůžete jet na prohlídku. Nebo si chcete ukázat nový domov rodičům nebo přátelům, kteří žijí daleko. 3D prohlídka to umožní — pošlete link, a oni si 'projdou' vaše nové bydlení sami, kdykoli chtějí. Tón: hřejivý, optimistický, životní. Bez přehnaného prodejního tónu. 3–4 hashtagy (#stehovani #novydomov #3Dprohlidka #VirtualView). 2 emoji max. Délka: 80–100 slov. Čeština.$$,
'B2C: Stěhujete se daleko? / Instagram / Awareness', 111),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_ukazte_domov_ig', 'examples',
$$Napište Instagram post pro Virtual View. Téma: váš byt je krásný — a zaslouží si víc než pár fotek. 3D prohlídka zachytí každý detail: materiály, světlo, dispozici, detaily, které na fotce zaniknou. A celý byt je možné sdílet jedním linkem. Tón: aspirativní, lehce prestižní, bez arogance. Cílí na lidi, kteří jsou na svůj domov hrdí a rádi ho ukazují. 3–4 hashtagy (#interier #bydleni #3Dprohlidka #VirtualView). 1–2 emoji. Délka: 70–90 slov. Čeština.$$,
'B2C: Ukažte svůj domov světu / Instagram / Brand building', 112),

-- SKUPINA 6: INTERAKTIVNÍ A ENGAGEMENTOVÉ POSTY
('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_otazka_prodavajici_fb', 'examples',
$$Napište Facebook post pro Virtual View, jehož primárním cílem je vyvolat diskusi. Položte otázku: 'Kolik prohlídek jste měli, než jste prodali svůj byt nebo dům?' Poproste lidi, ať napíší číslo do komentářů. Pak krátce zmiňte, co vidí Virtual View u svých klientů: průměr klesá výrazně, když má inzerát 3D prohlídku — protože zájemci přicházejí připraveni. Tón: konverzační, zvídavý, bez prodejního tlaku. Bez emoji v otázce. 1 emoji v závěru postu. Délka: 80–110 slov. Čeština.$$,
'B2C: Otázka pro prodávající / Facebook / Engagement', 113),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_vedeli_jste_ig', 'examples',
$$Napište Instagram post pro Virtual View ve formátu 'Věděli jste, že...?' Vyberte jednu překvapivou statistiku (např. '71 % kupujících by koupilo nemovitost bez fyzické prohlídky, pokud má kvalitní 3D tour') a dejte ji do kontextu: co to znamená pro prodávající, pro kupující, pro realitní trh v ČR. Konec: výzva k uložení nebo sdílení postu. Tón: informativní, překvapující, bez prodejního tónu. 3–4 hashtagy. 1 emoji. Délka: 60–80 slov. Čeština.$$,
'B2C: Věděli jste, že? / Instagram / Awareness', 114),

('17443720-68b7-460a-859e-28b1b5d66913', 'b2c_anketa_fb', 'examples',
$$Napište Facebook post pro Virtual View ve formátu ankety. Otázka: 'Jak si procházíte nemovitosti online?' Dvě možnosti: A) Procházím fotky a čtu popis, B) Chci 3D prohlídku — jinak mi inzerát nezajímá. Po otázce přidejte 1–2 věty, proč se ptáte — Virtual View sleduje, jak se mění chování kupujících v ČR. Tón: zvídavý, přátelský. 1 emoji. Délka: 60–80 slov + 2 možnosti ankety. Čeština.$$,
'B2C: Anketa / Facebook / Engagement', 115);

-- ===========================================
-- KONEC SEEDU Virtual View
-- ===========================================
