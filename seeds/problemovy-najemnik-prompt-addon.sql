-- ============================================
-- Problémový nájemník - Prompt Addon
-- Verze: 2026-02-22
-- Sekce: LEAD_MAGNETS, CTA_DISTRIBUTION, HOOK_LIBRARY
-- ============================================

-- UUID projektu Problémový nájemník
-- 1a99f995-7572-44c8-80a1-dec63aca3e22

-- ============================================
-- LEAD MAGNETS
-- ============================================

INSERT INTO project_prompt_templates (project_id, slug, category, description, content, is_active) VALUES

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'lead_magnets_problemovy_najemnik', 'cta_rules', 'Definice lead magnetů Problémový nájemník',
'DOSTUPNÉ LEAD MAGNETY (používej v CTA přesně tato pojmenování):

LM-01: CHECKLIST PROVĚŘENÍ NÁJEMNÍKA
- Název v CTA: "Checklist prověření nájemníka (12 kroků)"
- Formát: PDF ke stažení
- Obsah: 12 kroků z KB (ověření identity → osobní pohovor), varovné signály, okamžitá zamítnutí
- Pro koho: Prvopronajímatel, Dědic, Investor před obsazením
- Fáze: PREVENCE
- CTA formulace: "Stáhněte si zdarma: Checklist prověření nájemníka (12 kroků)"

LM-02: VZOR PŘEDÁVACÍHO PROTOKOLU
- Název v CTA: "Vzor předávacího protokolu s fotodokumentací"
- Formát: PDF + Word ke stažení
- Obsah: Protokol předání/převzetí bytu, checklist fotodokumentace (co fotit, jak), stav měřičů
- Pro koho: Prvopronajímatel, Investor, kdokoli před novým nájmem
- Fáze: PREVENCE
- CTA formulace: "Ke stažení zdarma: Vzor předávacího protokolu s fotodokumentací"

LM-03: PRŮVODCE – NEPLATIČ
- Název v CTA: "Průvodce: Co dělat, když nájemník přestane platit"
- Formát: PDF ke stažení
- Obsah: Timeline Den 1–Měsíc 12, vzory dopisů (výzva, výpověď), právní lhůty, čísla nákladů
- Pro koho: Investor, Expat, kdokoli v akutní fázi
- Fáze: AKTIVNÍ PROBLÉM
- CTA formulace: "Stáhněte si průvodce: Co dělat, když nájemník přestane platit"

LM-04: KALKULÁTOR VLASTNÍ SPRÁVY
- Název v CTA: "Kalkulátor: Kolik vás skutečně stojí vlastní správa?"
- Formát: Online kalkulátor na webu (problemovynajemnik.cz)
- Obsah: Vstup = nájem/měs, počet bytů, počet let → výstup = hrubý příjem, vakance, čas správy, reálný čistý
- Pro koho: Investor (více bytů), Podnikatel, Expat
- Fáze: PREVENCE / POUČENÍ
- CTA formulace: "Spočítejte si to: Kolik vás skutečně stojí vlastní správa?"

LM-05: BEZPLATNÁ KONZULTACE
- Název v CTA: "Bezplatná 15minutová konzultace"
- Formát: Rezervace termínu (problemovynajemnik.cz/konzultace)
- Obsah: Individuální případ, akutní problém nebo prevence
- Pro koho: Dědic (neumí pronajímat), Rozvedený/á (emocionální zátěž), Expat (vzdálená správa)
- Fáze: AKTIVNÍ PROBLÉM, POUČENÍ Z CHYBY
- CTA formulace: "Nevíte si rady? Bezplatná 15minutová konzultace."

LM-06: PRŮVODCE – SMLOUVA
- Název v CTA: "Průvodce: Co musí obsahovat nájemní smlouva"
- Formát: PDF ke stažení
- Obsah: Povinné vs. doporučené klauzule, nejčastější chyby smluv z internetu, vzorové formulace
- Pro koho: Prvopronajímatel, Dědic
- Fáze: PREVENCE
- CTA formulace: "Ke stažení zdarma: Co musí obsahovat nájemní smlouva"

PRAVIDLA POUŽITÍ:
- Vždy použij přesný název z pole "CTA formulace" – ne vlastní vymýšlení.
- Nikdy neuvádět URL přímo v postu – jen obecně "na problemovynajemnik.cz" pokud nutné.
- Každý post = MAX 1 lead magnet.
- Páruj LM se segmentem a fází (viz "Pro koho" a "Fáze" výše).', true),

-- ============================================
-- CTA DISTRIBUTION
-- ============================================

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'cta_distribution_problemovy_najemnik', 'cta_rules', 'Distribuce typů CTA napříč obsahem',
'POVINNÁ DISTRIBUCE CTA (z každých 10 postů):

4× ENGAGEMENT CTA
- Funkce: Buduje komunitu, komentáře, dosah (organický algoritmus)
- Kdy použít: Příběhy, statistiky, srovnání scénářů, témata s emocí
- Formulace (střídej):
  "Zažili jste podobnou situaci? Jak jste to řešili?"
  "Co byste udělali jinak?"
  "Jaká je vaše zkušenost s prověřováním nájemníků?"
  "Kolik měsíců jste čekali, než jste začali jednat?"

3× LEAD MAGNET CTA
- Funkce: Zachytává email / kontakt, buduje databázi
- Kdy použít: Návody krok po kroku, checklisty, právní FAQ, prevence
- Párování se segmentem (POVINNÉ):
  Prvopronajímatel → LM-01 nebo LM-06
  Dědic → LM-05 nebo LM-06
  Investor → LM-04 nebo LM-03
  Expat → LM-03 nebo LM-05
  Senior → LM-05
  Rozvedený/á → LM-05
  Podnikatel → LM-04

2× WEB CTA
- Funkce: Buduje autoritu webu, SEO traffic, opakované návštěvy
- Kdy použít: Datové posty, trendy, legislativní novinky, delší analýzy
- Formulace:
  "Celý postup najdete na problemovynajemnik.cz"
  "Více o právních lhůtách na problemovynajemnik.cz"

1× KONZULTACE CTA
- Funkce: Přímý lead pro složité/akutní případy
- Kdy použít: Akutní problémové posty (neplatič, odmítá odejít, škoda)
- Formulace: "Nevíte si rady? Bezplatná 15minutová konzultace." (LM-05)

PRAVIDLO STŘÍDÁNÍ:
- Nikdy 2× stejný typ CTA za sebou.
- Nikdy 2× stejná formulace za sebou.
- Po 3 engagement CTA musí následovat lead magnet nebo konzultace.

FÁZE → TYP CTA (automatické párování):
- PREVENCE → Lead magnet (LM-01, LM-02, LM-06) nebo Web
- AKTIVNÍ PROBLÉM → Konzultace (LM-05) nebo Lead magnet (LM-03)
- POUČENÍ Z CHYBY → Engagement nebo Lead magnet (LM-04)
- PRÁVNÍ UVĚDOMĚNÍ → Web nebo Lead magnet (LM-03, LM-06)
- PŘÍBĚH → Engagement
- DATA/TRENDY → Web nebo Engagement', true),

-- ============================================
-- HOOK LIBRARY
-- ============================================

('1a99f995-7572-44c8-80a1-dec63aca3e22', 'hook_library_problemovy_najemnik', 'examples', 'Hook knihovna Problémový nájemník',
'PRAVIDLO: První věta postu rozhoduje. Bez silného hooku čte dál méně než 5 % lidí.
Používej tyto vzorce a příklady. Nikdy nezačínej obecně.

────────────────────────────────────────
HOOK VZOREC 1: ČÍSLO + ŠOK
Vzorec: "[Číslo] [nepříjemný fakt]. [Krátká otázka nebo prohlášení]."
Kdy: Statistiky, data, náklady
Příklady:
  "280 000 Kč ztráta. 14 měsíců čekání. Jeden nájemník."
  "40 % majitelů nemá předávací protokol. Škodu pak neprokáží."
  "8 z 10 soudních vystěhování trvá déle než 6 měsíců."
  "Průměrná škoda po problémovém nájemníkovi: 30–80 tis. Kč. Kauce nepokryje."

────────────────────────────────────────
HOOK VZOREC 2: PŘÍMÁ SITUACE
Vzorec: "[Situace v přítomném čase]. Tady je přesný postup:"
Kdy: Akutní problémy, návody, FAQ
Příklady:
  "Nájemník neplatí druhý měsíc. Tady je přesný postup:"
  "Nájemník odmítá odejít. Co smíte a nesmíte udělat:"
  "Zjistili jste, že váš nájemník podnajímá na Airbnb. Co teď:"
  "Byt vrátil s dírou ve zdi. Jak uplatnit náhradu:"

────────────────────────────────────────
HOOK VZOREC 3: NEPŘÍJEMNÁ PRAVDA
Vzorec: "[Běžná představa] [kontrast]. [Fakt]."
Kdy: Odvážné posty, právní uvědomění, USP "říkáme pravdu"
Příklady:
  "Smlouva z internetu vás nechrání. Zjistíte to až u soudu."
  "Kauce dvou měsíců nestačí. Průměrná škoda je 30–80 tis. Kč."
  "Vystěhování neplatiče trvá průměrně 6–12 měsíců. Ne týdny."
  "Vlastní správa bytu vás stojí víc, než si myslíte. Čísla níže."

────────────────────────────────────────
HOOK VZOREC 4: PŘÍBĚH – ČÍSLO PRVNÍ
Vzorec: "[Částka nebo čas]. [Segment]. [Jedna věta co se stalo]."
Kdy: Case studies, příběhy, poučení z chyby
Příklady:
  "190 000 Kč. Jeden dědic. Žádné prověření, žádný protokol."
  "11 měsíců čekání. Investor se dvěma byty. Výpověď s formální chybou."
  "60 000 Kč právní náklady. Expat. Spravoval byt z Amsterdamu přes kamaráda."

────────────────────────────────────────
HOOK VZOREC 5: OTÁZKA – SEBEIDENTIFIKACE SEGMENTU
Vzorec: "[Přímá otázka cílená na segment]?"
Kdy: FB engagement posty, prevence, onboarding nových sledujících
Příklady:
  "Pronajímáte byt poprvé? Toto jsou 3 chyby, které dělá každý."
  "Zdědili jste nemovitost a nevíte, jak na pronájem? Tady začněte."
  "Spravujete byt z dálky? Toto jsou varovné signály, které přehlížíte."
  "Máte pocit, že vaše smlouva vás nechrání? Pravděpodobně máte pravdu."

────────────────────────────────────────
HOOK VZOREC 6: TIMELINE – PRVNÍ ŘÁDEK
Vzorec: "Den 1: [akce]. Den 7: [akce]. Měsíc 6: [důsledek]."
Kdy: Timeline posty, akutní problémy, krok po kroku návody
Příklady:
  "Den 1: nájemník nezaplatil. Den 14: stále nic. Měsíc 8: stále v bytě."
  "Týden 1: přátelský email. Týden 3: doporučený dopis. Měsíc 7: soud."

────────────────────────────────────────
HOOK VZOREC 7: SROVNÁNÍ A vs. B
Vzorec: "Majitel A [co neudělal] → [výsledek A]. Majitel B [co udělal] → [výsledek B]."
Kdy: Srovnávací posty, ROI prevence, case studies
Příklady:
  "Majitel A: žádné fotky při předání → 0 Kč náhrady za škodu. Majitel B: 50 fotek → 45 000 Kč zpět."
  "Majitel A: smlouva z internetu → soud 9 měsíců. Majitel B: smlouva od advokáta → dohoda do 30 dnů."

────────────────────────────────────────
HOOK VZOREC 8: VAROVNÉ SIGNÁLY
Vzorec: "[Počet] varovných signálů, které [segment] přehlíží. [Nejsilnější příklad]."
Kdy: Prevence, výběr nájemníka, prověření
Příklady:
  "5 varovných signálů při prohlídce. Nejčastěji přehlížený: platí jen hotově."
  "Odmítl prověření v registrech. To je jediný signál, který potřebujete."

────────────────────────────────────────
PRAVIDLA POUŽITÍ HOOKŮ:
- Nikdy nezačínaj slovem "Je", "Problematika", "Důležité", "Dnes".
- Nikdy nezačínaj otázkou "Víte, že..." – příliš opotřebované.
- Nejsilnější hooky jsou vzorce 1, 2 a 3 – prioritizuj je.
- Na Facebooku: hook musí fungovat i bez rozbalení textu (první 2 řádky viditelné).
- Na LinkedIn: hook může být delší, ale první věta stále rozhoduje.
- Na Instagramu: hook je vizuál + první věta v caption – musí se doplňovat.
- Nikdy nepoužívej stejný vzorec 2× za sebou v publikačním kalendáři.', true);
