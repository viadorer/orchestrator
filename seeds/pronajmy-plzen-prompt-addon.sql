-- ============================================
-- Pronájmy Plzeň - Prompt Addon
-- Verze: 2026-02-22
-- Sekce: LEAD_MAGNETS, CTA_DISTRIBUTION, HOOK_LIBRARY
-- ============================================

-- UUID projektu Pronájmy Plzeň
-- c99fce94-ae19-4f6b-9777-6d2af28ff960

-- ============================================
-- LEAD MAGNETS
-- ============================================

INSERT INTO project_prompt_templates (project_id, slug, category, description, content, is_active) VALUES

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'lead_magnets_pronajmy_plzen', 'cta_rules', 'Definice lead magnetů Pronájmy Plzeň',
'DOSTUPNÉ LEAD MAGNETY (používej v CTA přesně tato pojmenování):

LM-01: CHECKLIST PROHLÍDKY BYTU
- Název v CTA: "Checklist: Na co nezapomenout při prohlídce bytu (8 bodů)"
- Formát: PDF ke stažení zdarma
- Obsah: Vlhkost a plíseň, okna, spotřebiče, voda, topení, elektroinstalace, hluk, fotodokumentace
- Pro koho: Hledající, prvobydlící, mladí lidé odcházející z domova
- Fáze: HLEDÁNÍ BYTU
- CTA formulace: "Stáhni si zdarma: Checklist na prohlídku bytu (8 věcí, které většina přehlédne)"

LM-02: PRŮVODCE SMLOUVOU
- Název v CTA: "Průvodce: Co si ohlídat ve smlouvě než ji podepíšeš"
- Formát: PDF ke stažení zdarma
- Obsah: Povinné náležitosti smlouvy, nebezpečné klauzule (6 konkrétních), co chybí v typické smlouvě z internetu
- Pro koho: Hledající před podpisem, lidé s pochybnostmi o smlouvě
- Fáze: PŘED PODPISEM
- CTA formulace: "Ke stažení zdarma: Průvodce smlouvou – 6 klauzulí, na které si dát pozor"

LM-03: PRŮVODCE VRÁCENÍM KAUCE
- Název v CTA: "Průvodce: Jak vymáhat kauce krok po kroku"
- Formát: PDF ke stažení zdarma
- Obsah: Zákonná lhůta (1 měsíc), písemná výzva vzor, co je přiměřené opotřebení, jak podat žalobu do 10 000 Kč bez advokáta
- Pro koho: Nájemníci při vystěhování nebo po problémech s kaucí
- Fáze: VYSTĚHOVÁNÍ / SPOR
- CTA formulace: "Stáhni si průvodce: Jak dostat kauce zpět – krok po kroku"

LM-04: PŘEHLED PRŮMĚRNÝCH NÁJMŮ V PLZNI
- Název v CTA: "Přehled nájmů Plzeň 2026 – průměrné ceny podle čtvrtí"
- Formát: PDF nebo infografika ke stažení zdarma
- Obsah: Orientační ceny (garsonka 9–12k, 2+kk 12–16k, 3+kk 15–20k), srovnání čtvrtí (Centrum/Slovany vs Lobzy/Doubravka), co cenu ovlivňuje
- Pro koho: Každý kdo hledá byt nebo neví jestli platí férovou cenu
- Fáze: HLEDÁNÍ BYTU / ORIENTACE
- CTA formulace: "Stáhni si přehled: Průměrné nájmy v Plzni podle čtvrtí (aktualizováno 2026)"

LM-05: ŠABLONA PŘEDÁVACÍHO PROTOKOLU
- Název v CTA: "Vzor předávacího protokolu – pro nastěhování i vystěhování"
- Formát: Word/PDF ke stažení zdarma
- Obsah: Protokol předání bytu, co zdokumentovat, stav měřičů, klíče, fotodokumentace
- Pro koho: Hledající před nastěhováním, nájemníci při vystěhování
- Fáze: NASTĚHOVÁNÍ / VYSTĚHOVÁNÍ
- CTA formulace: "Ke stažení zdarma: Vzor předávacího protokolu (ochraň svoji kauce)"

LM-06: DOTAZ DO KOMUNITY / KONZULTACE
- Název v CTA: "Máš otázku? Zeptej se v komunitě – odpovíme."
- Formát: Přesměrování do FB skupiny nebo formuláře
- Obsah: Bezplatná odpověď na konkrétní situaci od komunity nebo správce
- Pro koho: Kdokoli v akutní situaci (spor, smlouva, kauce)
- Fáze: JAKÁKOLI AKUTNÍ SITUACE
- CTA formulace: "Napiš svůj případ do komentářů – poradíme."

PRAVIDLA POUŽITÍ:
- Vždy použij přesnou CTA formulaci z pole "CTA formulace" – nevymýšlej vlastní.
- Každý post = MAX 1 lead magnet.
- Páruj LM se situací a fází čtenáře (viz "Pro koho" a "Fáze" výše).
- LM-01 až LM-05 zachytávají email přes landing page – nikdy neuvádět URL přímo v postu.
- LM-06 je engagement CTA zároveň lead – funguje i bez externího odkazu.', true),

-- ============================================
-- CTA DISTRIBUTION
-- ============================================

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'cta_distribution_pronajmy_plzen', 'cta_rules', 'Distribuce typů CTA napříč obsahem',
'POVINNÁ DISTRIBUCE CTA (z každých 10 postů):

4× ENGAGEMENT CTA
- Funkce: Komentáře, dosah, budování komunity, FB algoritmus
- Kdy použít: Příběhy, situace z života, ankety, diskuzní témata
- Formulace (střídej):
  "Zažili jste to taky? Napište do komentářů."
  "Co byste poradili? Máte podobnou zkušenost?"
  "Jak dlouho jste hledali? Podělte se."
  "Byla taková situace i u vás? Jak jste ji vyřešili?"
  "Napiš svůj případ – poradíme."

3× LEAD MAGNET CTA
- Funkce: Zachycuje email / kontakt mimo FB skupinu, buduje databázi
- Kdy použít: Tipy, checklisty, právní FAQ, návody krok po kroku
- Párování se situací čtenáře (POVINNÉ):
  Hledá byt → LM-01 nebo LM-04
  Řeší smlouvu → LM-02
  Stěhuje se / vystěhovává se → LM-05
  Problém s kaucí → LM-03
  Akutní spor → LM-06
  Nezná ceny → LM-04

2× SAVE/SHARE CTA
- Funkce: Organický dosah, opakované zhlédnutí
- Kdy použít: Praktické checklisty, přehledy čísel, právní přehledy
- Formulace:
  "Uložte si post – může se hodit."
  "Pošlete kamarádovi, který teď hledá byt."
  "Uložit = mít po ruce, až to budete potřebovat."

1× VZDĚLÁVACÍ WEB CTA
- Funkce: Buduje autoritu, SEO, přesměrování mimo FB
- Kdy použít: Složitější právní témata, srovnání čtvrtí, trendové posty
- Formulace: Jen obecně, bez přímého URL v postu.

PRAVIDLO STŘÍDÁNÍ:
- Nikdy 2× stejný typ CTA za sebou.
- Po 2 engagement CTA musí následovat lead magnet nebo save/share.
- LM-06 (dotaz do komunity) lze použít jako náhradu engagement CTA i lead magnet CTA.

FÁZE ČTENÁŘE → TYP CTA (automatické párování):
- HLEDÁ BYT → Lead magnet (LM-01, LM-04)
- ŘEŠÍ SMLOUVU → Lead magnet (LM-02)
- STĚHUJE SE → Lead magnet (LM-05) nebo Engagement
- PROBLÉM S KAUCÍ → Lead magnet (LM-03)
- AKUTNÍ SPOR → LM-06 (dotaz/konzultace)
- PRÁVNÍ INFORMACE → Save/Share nebo Web
- SITUACE Z ŽIVOTA → Engagement

KONVERZNÍ MOST – KLÍČOVÉ PRAVIDLO:
Skupina je komunita, ne přistávací stránka. Lead se zachytí přes PDF ke stažení
(výměna za email), ne přímou registrací. Proto každý lead magnet (LM-01 až LM-05)
musí mít landing page mimo FB skupinu. LM-06 zachytí kontakt přímo v komentářích.', true),

-- ============================================
-- HOOK LIBRARY
-- ============================================

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'hook_library_pronajmy_plzen', 'examples', 'Hook knihovna Pronájmy Plzeň',
'PRAVIDLO: První věta = 80 % rozhodnutí, jestli někdo čte dál.
Na Facebooku jsou viditelné jen první 2 řádky bez rozbalení.
Nikdy nezačínej obecně. Vždy konkrétní situace nebo číslo.

────────────────────────────────────────
HOOK VZOREC 1: ČÍSLO + SITUACE
Vzorec: "[Číslo] [konkrétní situace z trhu nebo ze života]."
Kdy: Statistiky, přehledy cen, trendové posty
Příklady:
  "Na jeden slušný byt v Plzni se hlásí 5 až 15 zájemců."
  "Dobrý byt zmizí z trhu do 3 dnů. Takhle se připravit předem."
  "45 % sporů mezi nájemníky a majiteli je kvůli kauci."
  "Nájmy v Plzni rostou 5–8 % ročně. V centru ještě víc."

────────────────────────────────────────
HOOK VZOREC 2: PŘÍMÁ SITUACE (sebeidentifikace)
Vzorec: "Hledáte byt v Plzni a [konkrétní problém]? Tady je [řešení]."
Kdy: Tipy, checklisty, praktické návody
Příklady:
  "Hledáte byt v Plzni a nevíte, jestli je ta cena férová?"
  "Dostali jste smlouvu a nevíte, co si v ní ohlídat?"
  "Majitel vám nechce vrátit kauce? Tady je přesný postup."
  "Stěhujete se a chcete mít jistotu, že kauce přijde zpět?"

────────────────────────────────────────
HOOK VZOREC 3: NEPŘÍJEMNÁ PRAVDA
Vzorec: "[Věc, co většina neví nebo nechce slyšet]."
Kdy: Právní uvědomění, odvážné posty, USP "pohled nájemníka"
Příklady:
  "Majitel vám může zakázat psa. Ale zákon říká, kdy to nemůže."
  "Zvýšení nájmu můžete odmítnout. Málokdo to ví."
  "Kauce se vrací do 1 měsíce. Pokud nereaguje, máte právo jít k soudu."
  "Provizi makléři platí ten, kdo si ho objednal. Tedy většinou majitel, ne vy."

────────────────────────────────────────
HOOK VZOREC 4: PŘÍBĚH – PRVNÍ VĚTA JE VÝSLEDEK
Vzorec: "[Výsledek příběhu – číslo nebo situace]. [Kdo to byl a co udělal]."
Kdy: Case studies, situace z života, ponaučení
Příklady:
  "Kauce zpět až po soudu. Jana to nevzdala a vyhrála."
  "6 měsíců platil nájem za byt, kde nebydlel. Smlouva ho zradila."
  "Fotky při nastěhování ho zachránily. Majitel kauce nestrhli."

────────────────────────────────────────
HOOK VZOREC 5: OTÁZKA – KONKRÉTNÍ SITUACE
Vzorec: "[Konkrétní otázka, na kterou hledá odpověď cílový čtenář]?"
Kdy: FAQ posty, diskuzní posty, právní témata
Příklady:
  "Musíte malovat byt při odchodu? Záleží na smlouvě."
  "Smíte mít v bytě psa, i když to majitel nechce?"
  "Jak zjistíte, že byt nemá dluhy ještě před podpisem?"
  "Co dělat, když majitel zvyšuje nájem a vy nesouhlasíte?"

────────────────────────────────────────
HOOK VZOREC 6: VAROVÁNÍ / SIGNÁL
Vzorec: "[Varovný signál] = [co to znamená]. Tady je co dělat."
Kdy: Posty o solidním majiteli, nebezpečné klauzule, prohlídka bytu
Příklady:
  "Majitel tlačí na okamžité rozhodnutí? To je varovný signál."
  "Kauce předem a hotově bez dokladů? Nepodepisujte nic."
  "Smlouva zakazuje návštěvy? Taková klauzule je neplatná."

────────────────────────────────────────
HOOK VZOREC 7: SROVNÁNÍ ČTVRTÍ / CEN
Vzorec: "[Čtvrť A] vs [Čtvrť B]: [konkrétní rozdíl v ceně nebo životě]."
Kdy: Přehledy cen, orientace v Plzni, lokální data
Příklady:
  "Centrum vs Bolevec: rozdíl v nájmu 2+kk je až 4 000 Kč měsíčně."
  "Slovany nebo Doubravka? Záleží co hledáte. Tady je srovnání."
  "Lobzy a Skvrňany jsou teď nejdostupnější. Ale ne na dlouho."

────────────────────────────────────────
HOOK VZOREC 8: CHECKLIST TEASE
Vzorec: "[Počet] věcí, které [segment] [přehlíží / dělá špatně / by měl vědět]."
Kdy: Checklisty, tipy před prohlídkou, tipy před podpisem
Příklady:
  "8 věcí, na které se při prohlídce zaměřit. Většina lidí přehlédne 3 z nich."
  "5 klauzulí ve smlouvě, na které si dát pozor. Čtvrtá je nejčastější past."
  "6 věcí, co udělat při vystěhování. Jinak přijdete o část kauce."

────────────────────────────────────────
PRAVIDLA POUŽITÍ HOOKŮ:
- Nikdy nezačínej: "Je důležité", "Věděli jste, že", "Dnes si povíme", "Pronájmy jsou..."
- Na Facebooku: hook musí fungovat i bez rozbalení textu (viditelné 2 řádky).
- Na Instagramu: hook je vizuál + první věta caption – musí dávat smysl samostatně.
- Nejsilnější pro tuto skupinu: vzorce 2, 3 a 5 – přímá situace nájemníka.
- Střídej vzorce – nikdy stejný vzorec 2× za sebou v publikačním kalendáři.
- Tón zůstává přátelský a lidský i v silném hooku – ne alarmistický.', true);
