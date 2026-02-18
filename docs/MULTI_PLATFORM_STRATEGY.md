# Multi-Platform Content Strategy

## 🎯 Problém
Jeden příspěvek → více platforem → každá má jiná pravidla:
- **Rozměry obrázků** (LinkedIn 1200×627, Instagram 1080×1080, TikTok 1080×1920)
- **Délka textu** (X 280 znaků, LinkedIn 3000, Facebook 63k)
- **Formát** (Reels, Stories, Posts, Carousels)
- **Tón komunikace** (LinkedIn profesionální, TikTok casual)

## ✅ Řešení: Platform Variants System

### Koncept
1. **Master Content Brief** - jeden základ (téma, fakta, CTA)
2. **Platform Variants** - automatické adaptace pro každou síť
3. **Visual Variants** - různé rozměry a formáty obrázků

---

## 📊 Datový Model

### 1. Nová tabulka: `content_variants`

```sql
CREATE TABLE content_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Master content
  master_id UUID NOT NULL REFERENCES content_queue(id) ON DELETE CASCADE,
  
  -- Platform specifics
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'x', 'tiktok', 'youtube', 'threads', 'bluesky', 'pinterest', 'reddit', 'google-business', 'telegram', 'snapchat')),
  format_type TEXT NOT NULL CHECK (format_type IN ('post', 'story', 'reel', 'carousel', 'video')),
  
  -- Adapted content
  text_content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  
  -- Visual assets
  image_url TEXT,
  image_prompt TEXT,
  aspect_ratio TEXT, -- '1:1', '9:16', '16:9', '4:5'
  dimensions TEXT, -- '1080x1080', '1080x1920', '1200x627'
  
  -- Video specifics (for Reels, TikTok, YouTube Shorts)
  video_url TEXT,
  video_duration INTEGER, -- seconds
  video_script TEXT,
  
  -- Carousel specifics (Instagram, LinkedIn)
  carousel_slides JSONB, -- [{"image_url": "...", "text": "..."}, ...]
  
  -- AI metadata
  ai_adaptation_notes TEXT,
  tone_adjusted TEXT, -- 'professional', 'casual', 'playful'
  
  -- Status
  is_approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(master_id, platform, format_type)
);

CREATE INDEX idx_variants_master ON content_variants(master_id);
CREATE INDEX idx_variants_platform ON content_variants(platform);
```

### 2. Rozšíření `content_queue` (master content)

```sql
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT true;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS variant_count INTEGER DEFAULT 0;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS master_brief JSONB;
-- master_brief: {"topic": "...", "key_facts": [...], "cta": "...", "target_platforms": [...]}
```

---

## 🎨 Platform Specs & Adaptace

### Facebook
- **Post**: 1200×630, text 477 viditelných znaků, casual tón
- **Story**: 1080×1920, text overlay, 24h živost
- **Reel**: 1080×1920, 15-90s video

### Instagram
- **Post**: 1080×1080 (square), 1080×1350 (portrait), text 125 viditelných
- **Story**: 1080×1920, interaktivní prvky (polls, questions)
- **Reel**: 1080×1920, 15-90s, trending audio
- **Carousel**: 1080×1080, až 10 slides

### LinkedIn
- **Post**: 1200×627, text 210 viditelných, profesionální tón
- **Carousel**: 1080×1080, až 20 slides, PDF export
- **Video**: 1920×1080, 3-10 min

### X (Twitter)
- **Post**: 1200×675, text 280 znaků MAX, punchy
- **Thread**: série postů, každý 280 znaků

### TikTok
- **Video**: 1080×1920, 15-60s, casual/playful tón
- **Photo Carousel**: 1080×1920, až 35 fotek

### YouTube
- **Short**: 1080×1920, max 60s
- **Video**: 1920×1080, 1-10 min

---

## 🤖 AI Workflow: Generování Variant

### Krok 1: Master Content Brief
```typescript
interface MasterBrief {
  topic: string;
  key_facts: string[];
  cta: string;
  target_platforms: string[];
  content_type: 'educational' | 'soft_sell' | 'hard_sell';
  visual_concept: string; // "chart showing growth", "before/after comparison"
}
```

### Krok 2: Platform Adaptation Prompt
```
MASTER BRIEF:
Topic: {topic}
Facts: {key_facts}
CTA: {cta}

ADAPT FOR {PLATFORM}:
- Format: {format_type} (post/story/reel/carousel)
- Max chars: {maxChars}
- Visible chars: {visibleChars}
- Tone: {tone} (professional/casual/playful)
- Hashtags: max {maxHashtags}

RULES:
1. Hook musí být v prvních {visibleChars} znacích
2. Použij fakta z Master Brief
3. Přizpůsob tón platformě
4. CTA na konci

OUTPUT:
{adapted_text}
```

### Krok 3: Visual Adaptation
```typescript
interface VisualVariant {
  platform: string;
  format: 'post' | 'story' | 'reel' | 'carousel';
  dimensions: string; // '1080x1080'
  aspect_ratio: string; // '1:1'
  image_prompt: string; // adapted for dimensions
  style: 'photo' | 'graphic' | 'chart' | 'text_card';
}
```

---

## 🔄 Workflow v Hugo Orchestrator

### Scénář A: Generuj Master + Varianty najednou
```
1. Hugo dostane task: "Vytvoř post o ozonu pro LinkedIn, Instagram, Facebook"
2. Vygeneruje Master Brief (téma, fakta, CTA)
3. Pro každou platformu:
   - Adaptuje text (délka, tón, hashtags)
   - Vygeneruje image prompt (rozměry, aspect ratio)
   - Vytvoří variant v DB
4. Admin schválí/upraví varianty
5. Publikace na všechny platformy najednou
```

### Scénář B: Master → Varianty později
```
1. Hugo vygeneruje Master content (univerzální)
2. Admin schválí Master
3. Klikne "Generate Platform Variants"
4. Hugo vytvoří adaptace pro vybrané platformy
5. Admin schválí jednotlivé varianty
6. Publikace
```

---

## 🎯 Příklad: Jeden Post → 5 Platforem

### Master Brief
```json
{
  "topic": "Ozon likviduje 99,9 % bakterií za 15 minut",
  "key_facts": [
    "Ozon je 3000× rychlejší než chlor",
    "Certifikováno MZ ČR",
    "Žádné chemické rezidua"
  ],
  "cta": "Zjistěte, jak to funguje",
  "target_platforms": ["linkedin", "instagram", "facebook", "x", "tiktok"],
  "visual_concept": "before/after comparison - dirty vs clean room"
}
```

### LinkedIn Variant (profesionální)
```
Text (1200 znaků):
99,9 % bakterií, virů a plísní. Za 15 minut.

Ozonová sanitace je 3 000× rychlejší než chlor. Proč?

Ozon (O₃) je nestabilní molekula kyslíku s extrémním oxidačním potenciálem. Ničí patogeny na molekulární úrovni – oxiduje buněčnou stěnu a poškozuje DNA/RNA.

Po sanitaci se ozon přirozeně rozloží na kyslík. Žádné chemické rezidua. Žádné toxické zbytky.

Certifikováno Ministerstvem zdravotnictví ČR. Validováno dle EN 17272:2020.

Ideální pro:
→ Zdravotnictví (ordinace, nemocnice)
→ Školy a školky
→ Hotely a ubytování
→ Kanceláře

Zjistěte, jak ozonová sanitace funguje: vitalspace.cz

#ozon #sanitace #dezinfekce #zdravotnictví #certifikace

Image: 1200×627, professional chart comparing ozon vs chlor effectiveness
```

### Instagram Variant (vizuální + casual)
```
Text (500 znaků):
🧬 99,9 % bakterií pryč za 15 minut

Ozon = přírodní dezinfekce bez chemie 🌿

✅ 3000× rychlejší než chlor
✅ Certifikováno MZ ČR
✅ Žádné toxické zbytky
✅ Rozloží se na kyslík

Ideální pro domácnosti, ordinace, hotely 🏠🏥🏨

Víc na vitalspace.cz 👆

#ozon #sanitace #dezinfekce #zdraví #wellness #longevity #biohacking #čistývzduch #domácnost #zdravotnictví #ekologie #bezchemie #bakterie #viry #plísně

Image: 1080×1080, before/after split screen - dirty room vs sparkling clean
Carousel: 5 slides (jak to funguje, výhody, použití, certifikace, kontakt)
```

### X (Twitter) Variant (punchy)
```
Text (270 znaků):
Ozon likviduje 99,9 % bakterií za 15 minut.

3 000× rychlejší než chlor.
Certifikováno MZ ČR.
Žádné chemické rezidua.

Přírodní dezinfekce, která se rozloží na kyslík.

Více: vitalspace.cz

#ozon #sanitace #dezinfekce

Image: 1200×675, simple graphic with key stat "99.9% in 15 min"
```

### Facebook Variant (storytelling)
```
Text (800 znaků):
Představte si dezinfekci, která po sobě nezanechá žádné chemické rezidua. 🌿

Ozonová sanitace likviduje 99,9 % bakterií, virů a plísní za pouhých 15 minut. Jak je to možné?

Ozon (O₃) je nestabilní molekula kyslíku s obrovským oxidačním potenciálem. Je 3 000× rychlejší než chlor a 1,5-5× účinnější než UV záření.

Nejlepší na tom? Po sanitaci se ozon přirozeně rozloží na kyslík. Žádné toxické zbytky, žádné dráždění dýchacích cest.

Certifikováno Ministerstvem zdravotnictví ČR ✅
Validováno dle EN 17272:2020 ✅

Používají ho nemocnice, školy, hotely i domácnosti po celé ČR.

Chcete vědět víc? 👉 vitalspace.cz

#ozon #sanitace #dezinfekce #zdraví #domácnost #ekologie

Image: 1200×630, infographic showing ozon process (O2 → O3 → sanitization → O2)
```

### TikTok Variant (video script)
```
Format: Reel 1080×1920, 30s

SCRIPT:
[0-3s] Hook: "99,9 % bakterií pryč za 15 minut? 🤯"
[3-8s] Visual: Time-lapse ozon machine working
[8-15s] Text overlay: "Ozon = 3000× rychlejší než chlor"
[15-20s] Before/After comparison
[20-25s] "Rozloží se na kyslík. Žádná chemie. ✅"
[25-30s] CTA: "Víc na vitalspace.cz 👆"

Audio: Trending sound (upbeat, science-y)
Hashtags: #ozon #sanitace #dezinfekce #science #biohacking #wellness #lifehack #čistota

Text caption (150 znaků):
Ozonová sanitace = přírodní dezinfekce bez chemie 🧬 99,9 % bakterií pryč za 15 min. Certifikováno MZ ČR ✅ #ozon #sanitace #dezinfekce
```

---

## 🛠️ Implementace v Kódu

### API Endpoint: Generate Variants
```typescript
POST /api/content/generate-variants

Body:
{
  "master_id": "uuid",
  "platforms": ["linkedin", "instagram", "facebook", "x", "tiktok"],
  "formats": {
    "instagram": ["post", "carousel", "reel"],
    "linkedin": ["post"],
    "facebook": ["post"],
    "x": ["post"],
    "tiktok": ["video"]
  }
}

Response:
{
  "master_id": "uuid",
  "variants": [
    {
      "id": "uuid",
      "platform": "linkedin",
      "format": "post",
      "text": "...",
      "image_url": "...",
      "dimensions": "1200x627"
    },
    // ... more variants
  ]
}
```

### UI: Variant Manager
```
┌─────────────────────────────────────────┐
│ Master Content Brief                     │
│ Topic: Ozon likviduje 99,9 % bakterií   │
│ Platforms: LinkedIn, Instagram, X        │
│                                          │
│ [Generate Variants] [Edit Master]       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ LinkedIn Post (1200×627)          [✓]   │
│ 99,9 % bakterií, virů a plísní...       │
│ [Edit] [Preview] [Approve]              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Instagram Post (1080×1080)        [✓]   │
│ 🧬 99,9 % bakterií pryč za 15 min...    │
│ [Edit] [Preview] [Approve]              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Instagram Carousel (5 slides)     [ ]   │
│ Slide 1: Jak to funguje                 │
│ [Edit] [Preview] [Generate]             │
└─────────────────────────────────────────┘

[Publish All Approved Variants]
```

---

## 📐 Visual Dimensions Reference

| Platform | Post | Story | Reel/Video | Carousel |
|----------|------|-------|------------|----------|
| Facebook | 1200×630 | 1080×1920 | 1080×1920 | 1080×1080 |
| Instagram | 1080×1080 | 1080×1920 | 1080×1920 | 1080×1080 |
| LinkedIn | 1200×627 | - | 1920×1080 | 1080×1080 |
| X | 1200×675 | - | 1280×720 | - |
| TikTok | - | - | 1080×1920 | 1080×1920 |
| YouTube | - | - | 1080×1920 (Shorts) | - |
| Threads | 1080×1080 | 1080×1920 | 1080×1920 | 1080×1080 |
| Pinterest | 1000×1500 | - | 1080×1920 | 1000×1500 |

---

## 🎯 Benefits

### Pro Admina
✅ Jeden brief → všechny platformy najednou
✅ Automatická adaptace textu (délka, tón, hashtags)
✅ Automatická adaptace vizuálů (rozměry, aspect ratio)
✅ Bulk approval/editing
✅ Konzistentní messaging napříč platformami

### Pro Hugo AI
✅ Jasná pravidla pro každou platformu
✅ Reusable Master Brief
✅ Efektivnější generování (1× téma → N variant)
✅ Lepší kvalita (specializace per platform)

### Pro Publikum
✅ Native content pro každou platformu
✅ Optimalizované pro engagement
✅ Správné formáty a rozměry

---

## 🚀 Fáze Implementace

### Fáze 1: Databáze + Basic Variants
- [ ] Migrace: `content_variants` tabulka
- [ ] API: `POST /api/content/generate-variants`
- [ ] AI: Platform adaptation prompts
- [ ] UI: Variant manager (basic)

### Fáze 2: Visual Variants
- [ ] Image generation per platform (dimensions)
- [ ] Carousel generator
- [ ] Video script generator (Reels, TikTok)

### Fáze 3: Bulk Publishing
- [ ] Publish all variants at once
- [ ] Schedule variants independently
- [ ] Analytics per variant

### Fáze 4: Smart Optimization
- [ ] A/B testing variants
- [ ] Auto-optimize based on performance
- [ ] Learn best practices per platform

---

## 📝 Poznámky

- **getLate.dev** podporuje všech 13 platforem → můžeme publikovat všude
- **Gemini Vision** umí generovat obrázky → různé rozměry na požádání
- **pgvector dedup** funguje na Master level → varianty jsou OK
- **Platform rules** už máme v `platforms.ts` → použijeme pro validaci
