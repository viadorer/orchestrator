-- ===========================================
-- Photography Visual Identity Updates
-- Adds photography-specific fields to visual_identity JSONB
-- + visual_style prompt templates for each project
-- ===========================================

-- ============================================
-- 1. ČeskoSobě (a1b2c3d4-0001-4000-8000-000000000001)
-- ============================================
-- Styl: Dokumentární, stoický, faktický. Žádné stock photos.
-- Inspirace: Česká dokumentární fotografie, ČT reportáže.

UPDATE projects
SET visual_identity = COALESCE(visual_identity, '{}'::jsonb) || '{
  "primary_color": "#1a1a2e",
  "secondary_color": "#16213e",
  "accent_color": "#e94560",
  "text_color": "#ffffff",
  "font": "Inter",
  "style": "minimal",
  "photography_style": "documentary, candid, editorial",
  "photography_mood": "contemplative, grounded, quietly urgent — like a thoughtful documentary about real life",
  "photography_subjects": "real Czech people aged 30-55, ordinary families at home, hands working with documents or calculators, Prague and Brno cityscapes, apartment buildings, kitchen tables with paperwork, elderly people in modest apartments",
  "photography_avoid": "no stock photo poses, no fake smiles, no corporate handshakes, no luxury lifestyle, no gold coins or money piles, no motivational speaker aesthetics, no MLM vibes, no overly polished models, no American-looking settings",
  "photography_lighting": "natural window light, overcast daylight, early morning or late afternoon, no harsh flash",
  "photography_color_grade": "slightly desaturated, cool undertones with warm highlights, muted palette reminiscent of Czech cinema, subtle film grain",
  "photography_reference": "Czech New Wave cinema aesthetic, Markéta Luskačová street photography, ČT documentary style, Humans of Prague",
  "brand_visual_keywords": "demographics, mathematics, dignity, self-reliance, Czech reality, apartment buildings, ordinary people, quiet determination, future planning"
}'::jsonb
WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001';

-- Visual style prompt template for ČeskoSobě
INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order)
VALUES (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'visual_style_cesko_sobe',
  'visual_style',
  'VIZUÁLNÍ STYL PRO IMAGE PROMPT (ČeskoSobě):

FILOZOFIE: Obrázky musí vypadat jako záběry z českého dokumentu, ne jako stock fotky.

SCÉNY, KTERÉ CHCEME:
- Ruce starší ženy počítající mince na kuchyňském stole, okno v pozadí
- Mladý pár sedící nad papíry s kalkulačkou, večerní světlo z lampy
- Pohled z okna panelového bytu na město za svítání
- Detail důchodového výměru nebo hypoteční smlouvy na dřevěném stole
- Starší muž sedící sám v malém bytě, dívající se z okna
- Rodina s dětmi u jídelního stolu, běžný český byt
- Pohled na české sídliště nebo vilovou čtvrť za různého počasí
- Prázdná lavička v parku s výhledem na panelové domy

SCÉNY, KTERÉ NECHCEME:
- Usmívající se lidé v oblecích podávající si ruce
- Luxusní interiéry nebo penthouse byty
- Hromady peněz, zlaté mince, grafy směřující nahoru
- Motivační citáty na pozadí západu slunce
- Americky vypadající předměstí nebo kanceláře
- Jakékoliv stock photo klišé

TECHNICKÉ POKYNY:
- Preferuj close-up a medium shot před wide shot
- Hloubka ostrosti: mělká (bokeh v pozadí)
- Barvy: tlumené, chladnější tóny s teplými akcenty
- Žádný text v obrázku, žádné loga, žádné watermarky',
  'Vizuální styl ČeskoSobě – dokumentární, autentický, český', 85
)
ON CONFLICT (project_id, slug) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description;


-- ============================================
-- 2. Invest Czech (a1b2c3d4-0002-4000-8000-000000000002)
-- ============================================
-- Styl: Profesionální, moderní, důvěryhodný. Real estate platforma.

UPDATE projects
SET visual_identity = COALESCE(visual_identity, '{}'::jsonb) || '{
  "primary_color": "#0f172a",
  "secondary_color": "#1e293b",
  "accent_color": "#3b82f6",
  "text_color": "#ffffff",
  "font": "Inter",
  "logo_url": null,
  "style": "corporate",
  "photography_style": "editorial real estate, architectural, lifestyle",
  "photography_mood": "confident, trustworthy, modern — like a premium real estate magazine",
  "photography_subjects": "Czech apartment buildings and interiors, modern renovated flats, property viewings with real people, city neighborhoods from above, building facades with character, keys in door locks, signed contracts on desks, property management scenes",
  "photography_avoid": "no luxury mansions or villas (we focus on investment apartments), no American-style houses, no overly staged interiors, no stock photo real estate agents, no fake handshakes, no gold or money imagery",
  "photography_lighting": "clean natural light, golden hour for exteriors, bright and airy for interiors, architectural lighting",
  "photography_color_grade": "clean and modern, slight cool tint with warm accent lighting, high clarity, minimal grain",
  "photography_reference": "Dezeen magazine photography, Airbnb listing photography style but more editorial, Czech architectural photography",
  "brand_visual_keywords": "investment property, Czech real estate, apartment management, rental income, modern living, platform, all-in-one service, trust, professionalism"
}'::jsonb
WHERE id = 'a1b2c3d4-0002-4000-8000-000000000002';

-- Visual style prompt template for Invest Czech
INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order)
VALUES (
  'a1b2c3d4-0002-4000-8000-000000000002',
  'visual_style_invest_czech',
  'visual_style',
  'VIZUÁLNÍ STYL PRO IMAGE PROMPT (Invest Czech):

FILOZOFIE: Obrázky musí vypadat jako z prémiového realitního magazínu – profesionální, ale autenticky české.

SCÉNY, KTERÉ CHCEME:
- Fasády českých bytových domů s charakterem (secese, funkcionalismus, moderní novostavby)
- Interiéry zrekonstruovaných bytů 2+kk – čisté, světlé, moderní
- Letecký pohled na českou rezidenční čtvrť za golden hour
- Detail klíčů v zámku nových dveří
- Člověk prohlížející si byt při prohlídce (přirozená póza, ne stock)
- Správce nemovitosti kontrolující byt (reálná situace)
- Pohled z balkonu na české město
- Detail hypoteční smlouvy nebo katastru nemovitostí na stole

SCÉNY, KTERÉ NECHCEME:
- Luxusní vily nebo penthouse (cílíme na investiční byty)
- Americké předměstí s trávníky
- Generičtí real estate agenti s úsměvem a klíči
- Grafy a čísla v obrázku (to řeší textové karty)
- Staveniště nebo demolice

TECHNICKÉ POKYNY:
- Exteriéry: wide shot nebo aerial, golden hour preferováno
- Interiéry: wide angle, přirozené světlo z oken, čistý prostor
- Detail shots: klíče, smlouvy, dveře – mělká hloubka ostrosti
- Barvy: čisté, moderní, lehce chladný základ s teplými akcenty',
  'Vizuální styl Invest Czech – editorial real estate, profesionální', 85
)
ON CONFLICT (project_id, slug) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description;


-- ============================================
-- 3. VitalSpace (ab968db8-40df-4115-8a2d-4d634cbd60ed)
-- ============================================
-- Styl: Vědecký, čistý, wellness/longevity. Ozonová sanitace.

UPDATE projects
SET visual_identity = COALESCE(visual_identity, '{}'::jsonb) || '{
  "primary_color": "#0d1b2a",
  "secondary_color": "#1b2838",
  "accent_color": "#00d4aa",
  "text_color": "#ffffff",
  "font": "Inter",
  "style": "scientific-minimal",
  "photography_style": "scientific editorial, clean wellness, medical-grade aesthetic",
  "photography_mood": "pristine, futuristic yet approachable, clinical but warm — like a high-end wellness clinic brochure",
  "photography_subjects": "clean modern interiors with purified air feeling, medical facilities and clinics, ozone equipment in professional settings, scientists or technicians at work, families in clean bright homes, close-ups of air purification technology, wellness spaces, laboratory environments",
  "photography_avoid": "no dirty or cluttered spaces, no sick people, no before/after shock imagery, no cartoon germs or bacteria illustrations, no overly clinical cold hospital aesthetic, no stock photo doctors with stethoscopes",
  "photography_lighting": "clean bright lighting, slight blue-white tint suggesting purity, soft diffused light, laboratory-style even illumination",
  "photography_color_grade": "cool clean tones, slight teal/cyan accent, high clarity, minimal shadows, pristine white balance",
  "photography_reference": "Dyson product photography, Apple Health app imagery, high-end medical device marketing, Scandinavian wellness interior design",
  "brand_visual_keywords": "ozone, purity, clean air, longevity, biohacking, science, health, sanitization, wellness, Czech technology, ČVUT, certification"
}'::jsonb
WHERE id = 'ab968db8-40df-4115-8a2d-4d634cbd60ed';

-- Visual style prompt template for VitalSpace
INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order)
VALUES (
  'ab968db8-40df-4115-8a2d-4d634cbd60ed',
  'visual_style_vitalspace',
  'visual_style',
  'VIZUÁLNÍ STYL PRO IMAGE PROMPT (VitalSpace):

FILOZOFIE: Obrázky musí evokovat čistotu, vědu a budoucnost zdraví – jako z katalogu prémiové wellness technologie.

SCÉNY, KTERÉ CHCEME:
- Čistý, světlý interiér ordinace nebo kliniky s ozonizačním zařízením
- Detail ozonizátoru OZON CLEANER v moderním prostředí (strop, stěna)
- Vědec nebo technik v bílém plášti kontrolující zařízení
- Rodina v čistém, světlém bytě – pocit čerstvého vzduchu
- Mikroskopický/abstraktní pohled na molekuly O₃ (umělecký, ne cartoon)
- Hotelový pokoj s certifikátem "Ozonized Room" na dveřích
- Školní třída po sanitaci – čistá, prázdná, slunce svítí dovnitř
- Close-up kapky vody nebo čistého vzduchu (abstraktní čistota)
- Laboratorní prostředí s vědeckými přístroji

SCÉNY, KTERÉ NECHCEME:
- Nemocní lidé, kašlající, s rouškami (nechceme strašit)
- Špinavé prostory "před sanitací" (nechceme odpudivé obrázky)
- Cartoon bakterie nebo viry
- Generičtí doktoři se stetoskopem a úsměvem
- Příroda bez kontextu (les, květiny – to není náš brand)

TECHNICKÉ POKYNY:
- Preferuj čisté, světlé kompozice s hodně bílé a světle modré
- Accent barva: #00d4aa (tyrkysová/teal) – může se objevit jako světelný efekt
- Hloubka ostrosti: mělká pro detail produktu, široká pro interiéry
- Barvy: chladné, čisté, s nádechem futurismu
- Žádný text v obrázku',
  'Vizuální styl VitalSpace – vědecký, čistý, wellness', 85
)
ON CONFLICT (project_id, slug) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description;
