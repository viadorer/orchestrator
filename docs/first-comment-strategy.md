# First Comment Strategy

## Koncept

**First comment = CTA s odkazem mimo síť**

- Organický post: ČISTÝ text, žádné URL
- First comment: Krátké CTA + odkaz (web, landing page, lead magnet)
- Facebook best practice: odkaz v komentáři = lepší reach než URL v postu

## Pravidla pro Huga

### Kdy generovat first comment

✅ **ANO** - generuj first comment pokud:
- Post má CTA (lead magnet, checklist, průvodce, konzultace)
- Projekt má definovaný web/landing page v `project.website_url`
- Platform = Facebook, Instagram, nebo **LinkedIn**

❌ **NE** - negeneruj first comment pokud:
- Post je čistě edukační bez CTA
- Post je engagement (otázka, diskuze)
- Platform = X, TikTok, YouTube (nepodporují)

### Formát first comment

**Struktura:**
```
[Krátké CTA] [URL]
```

**Příklady:**
```
✅ Kompletní průvodce ke stažení: https://problemovynajemnik.cz/prirucka
✅ Checklist zdarma: https://investczech.cz/kalkulacka
✅ Více info: https://pronajmy-plzen.cz/sluzby
✅ Rezervace konzultace: https://vitalspace.cz/kontakt

❌ Klikněte na odkaz v bio (to je Instagram Stories, ne feed post)
❌ Dlouhý text v komentáři (max 1 věta)
❌ Více odkazů (max 1 URL)
```

### Prompt instrukce

```
OUTPUT FORMAT:
{
  "text": "Organický post text BEZ URL",
  "first_comment": "Krátké CTA: https://...",  // POUZE pokud post má CTA
  "image_prompt": "...",
  "scores": {...}
}

FIRST COMMENT PRAVIDLA:
- Generuj POUZE pokud post obsahuje CTA (lead magnet, checklist, konzultace)
- Max 1 věta + 1 URL
- URL = {{WEBSITE_URL}}/konkretni-stranka
- Pokud post nemá CTA → first_comment vynech (null)
```

## Implementace

### 1. DB migrace
```sql
ALTER TABLE content_queue ADD COLUMN first_comment TEXT;
```

### 2. GeneratedContent interface
```typescript
export interface GeneratedContent {
  text: string;
  first_comment?: string;  // ← přidáno
  // ...
}
```

### 3. Prompt builder
- Přidat `{{WEBSITE_URL}}` variable do substituteVariables()
- Načíst z `projects.website_url` nebo fallback na semantic_anchors

### 4. Agent orchestrator
- Uložit `first_comment` do content_queue při insertu

### 5. getLate.dev payload
```typescript
platforms: [{
  platform: 'facebook',
  accountId: '...',
  platformSpecificData: {
    firstComment: result.first_comment  // ← přidáno
  }
}]
```

## Per-project konfigurace

### Problémový nájemník
```
website_url: https://problemovynajemnik.cz
first_comment_templates:
  - "Kompletní průvodce: {{WEBSITE_URL}}/prirucka"
  - "Checklist zdarma: {{WEBSITE_URL}}/checklist"
  - "Právní poradna: {{WEBSITE_URL}}/konzultace"
```

### ČeskoSobě
```
website_url: https://investczech.cz
first_comment_templates:
  - "Kalkulačka zdarma: {{WEBSITE_URL}}/kalkulacka"
  - "Kompletní průvodce: {{WEBSITE_URL}}/prirucka"
  - "Konzultace: {{WEBSITE_URL}}/kontakt"
```

## Testování

1. Vygenerovat post s CTA → first_comment by měl být vyplněn
2. Vygenerovat čistě edukační post → first_comment = null
3. Publikovat na Facebook → ověřit že komentář se objevil
4. Publikovat na LinkedIn → first_comment ignorován (nepodporuje)
