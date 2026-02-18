-- ============================================
-- SEED: ČeskoSobě - Lead Generation Obohacení
-- Nové KB záznamy + Prompt Templates pro lepší konverzi
-- ============================================

-- CLEANUP: Smazat případné duplicitní záznamy
DELETE FROM project_prompt_templates 
WHERE project_id = 'a1b2c3d4-0001-4000-8000-000000000001' 
AND slug IN (
  'storytelling_cesko_sobe',
  'urgence_cesko_sobe',
  'objections_cesko_sobe',
  'social_proof_cesko_sobe',
  'cta_optimization_cesko_sobe',
  'hook_formulas_cesko_sobe'
);

DELETE FROM knowledge_base 
WHERE project_id = 'a1b2c3d4-0001-4000-8000-000000000001' 
AND title IN (
  'Příběh: Petr, 32 let, IT specialista',
  'Příběh: Jana a Martin, 28 a 30 let, mladá rodina',
  'Příběh: Tomáš, 45 let, OSVČ',
  'Anti-příběh: Co se stane když nečiníte',
  'Mám jen 200 000 Kč - stačí to?',
  'Co když mi banka neschválí hypotéku?',
  'Co když nenajdu nájemníka?',
  'Jsem OSVČ - mám šanci?',
  'Mám 50 let - není pozdě?',
  'Kolik stojí čekání',
  'Náklady na důstojné stáří',
  'Síla složeného úroku v nemovitostech',
  'Průměrný věk prvního bytu v ČR',
  'Srovnání: Spoření vs Nemovitost',
  'První krok: Analýza vlastní situace',
  'Druhý krok: Stanovení cíle',
  'Třetí krok: Plán spoření',
  'Čtvrtý krok: Vzdělávání',
  'Pátý krok: Akce',
  'Segment: Mladí profesionálové 25-32',
  'Segment: Rodiny s dětmi 30-40',
  'Segment: Lidé 40-50 blížící se důchodu',
  'Proč ČeskoSobě vs finanční poradci',
  'Proč nemovitost vs fondy/ETF'
);

-- ===========================================
-- 1. NOVÉ KNOWLEDGE BASE ZÁZNAMY
-- ===========================================

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

-- ===== CASE STUDY - Konkrétní příběhy =====

('a1b2c3d4-0001-4000-8000-000000000001', 'case_study', 'Příběh: Petr, 32 let, IT specialista',
'Petr začal v roce 2019. Vlastní zdroje: 600 000 Kč (5 let spoření). Koupil 2+kk v Olomouci za 2,8 mil. Kč. Hypotéka: 2,2 mil. na 30 let, splátka 11 500 Kč. Nájem: 13 500 Kč. Po 5 letech: byt stojí 3,6 mil. Kč (+800 tis.), hypotéka klesla na 1,9 mil. Vlastní kapitál: 1,7 mil. Kč. Měsíční cash flow: +2 000 Kč. Petr teď kupuje druhý byt.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'case_study', 'Příběh: Jana a Martin, 28 a 30 let, mladá rodina',
'Jana a Martin měli dohromady 400 000 Kč. Využili výjimku pro mladé (LTV 90 %). Koupili 3+kk v Brně za 4 mil. Kč s hypotékou 3,6 mil. Splátka: 18 200 Kč, nájem: 19 500 Kč. Bydlí u rodičů a šetří rozdíl. Za 3 roky naspořili dalších 500 000 Kč. Plánují druhý byt nebo přestěhování do vlastního.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'case_study', 'Příběh: Tomáš, 45 let, OSVČ',
'Tomáš začal pozdě. V 42 letech koupil první 2+1 v Plzni za 2,5 mil. Kč. Splátka 13 000 Kč, nájem 14 500 Kč. Po 3 letech refinancoval na nižší sazbu (-1 800 Kč měsíčně). Ušetřené peníze investuje do druhého bytu. Cíl: 3 byty do 55 let = 45 000 Kč měsíčně v důchodu.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'case_study', 'Anti-příběh: Co se stane když nečiníte',
'Lukáš, 52 let. Celý život čekal na "správný moment". Ceny rostly rychleji než jeho úspory. V 35 měl našetřeno 300 000 Kč - tehdy stál byt 2 mil. V 45 měl 700 000 Kč - byt už stál 3,5 mil. Dnes má 1,2 mil. - byt stojí 5 mil. Stále čeká. Za 13 let půjde do důchodu s 20 736 Kč měsíčně. Bez vlastního bydlení.', true),

-- ===== FAQ - Překážky a řešení =====

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Mám jen 200 000 Kč - stačí to?',
'Ne na celý byt. Ale: 1) Pokračuj ve spoření - při 15 000 Kč/měsíc máš za 3 roky 740 000 Kč. 2) Pokud jsi do 36 let, stačí 10 % vlastních zdrojů. 3) Začni menším bytem v levnějším městě. 4) Zvažte spoluvlastnictví s rodinou. Klíč: ZAČÍT spořit s konkrétním cílem, ne čekat na zázrak.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Co když mi banka neschválí hypotéku?',
'Důvody zamítnutí: nízký příjem, existující dluhy, špatná bonita. Řešení: 1) Splatit drobné dluhy. 2) Přidat spolužadatele (partner, rodič). 3) Zkusit jinou banku - každá má jiné podmínky. 4) Snížit požadovanou částku. 5) Počkat a zlepšit bonitu. Hypoteční poradce pomůže najít cestu.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Co když nenajdu nájemníka?',
'Statistika: V krajských městech je obsazenost nájmů 95-98 %. Průměrná doba hledání: 2-4 týdny. Jak minimalizovat riziko: 1) Správná lokalita (MHD, školy, práce). 2) Konkurenceschopný nájem (ne nejvyšší v okolí). 3) Kvalitní inzerce s fotkami. 4) Rezervní fond 3 měsíční splátky. Prázdný byt je výjimka, ne pravidlo.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Jsem OSVČ - mám šanci?',
'Ano. Banky vyžadují: 2 daňová přiznání (průměr příjmů), nižší zadluženost než zaměstnanci, často vyšší vlastní zdroje (25-30 %). Některé banky jsou OSVČ-friendly. Hypoteční poradce zná které. OSVČ v ČeskoSobě: cca 30 % členů.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Mám 50 let - není pozdě?',
'Není. Hypotéku můžete splácet do 70-75 let. To je 20-25 let. Stačí na splacení. Navíc: čím dřív začnete, tím víc let budete mít příjem z nájmu. Tomáš z našeho příběhu začal v 42. Dnes má 2 byty. Pozdě je až když nejednáte.', true),

-- ===== DATA - Nová čísla pro hooks =====

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Kolik stojí čekání',
'Příklad: V roce 2015 stál průměrný byt v Brně 2,1 mil. Kč. V roce 2025: 4,2 mil. Kč. Nárůst: 100 %. Průměrná mzda za stejné období: +35 %. Kdo čekal 10 let, potřebuje dnes 2× víc úspor. Čekání není strategie - je to ztráta.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Náklady na důstojné stáří',
'Průměrný senior v ČR potřebuje měsíčně: bydlení 8 000 Kč (pokud vlastní), jídlo 6 000 Kč, léky 3 000 Kč, energie 4 000 Kč, ostatní 3 000 Kč. Celkem: 24 000 Kč. Průměrný důchod: 20 736 Kč. Deficit: -3 264 Kč měsíčně. Bez vlastního bydlení (+10 000 Kč nájem): deficit -13 264 Kč. Matematika je neúprosná.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Síla složeného úroku v nemovitostech',
'Byt za 3 mil. Kč při růstu 6 % ročně: Za 10 let: 5,4 mil. (+2,4 mil.). Za 20 let: 9,6 mil. (+6,6 mil.). Za 30 let: 17,2 mil. (+14,2 mil.). Navíc měsíční nájem 30 let = 5,4 mil. Kč (při 15 000 Kč). Celkový benefit: 20 mil. Kč. Investice: 600 000 Kč vlastních zdrojů. ROI: 3 233 %.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Průměrný věk prvního bytu v ČR',
'Průměrný Čech koupí první byt ve 35 letech. V roce 2000 to bylo 28 let. Důvod: rostoucí ceny, stagnující mzdy, student loans. Důsledek: méně let na splacení, méně let s příjmem z nájmu. Kdo začne v 30, má 35 let do důchodu. Kdo v 40, má 25 let. Každý rok čekání je ztracený rok výnosu.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Srovnání: Spoření vs Nemovitost',
'Scénář A (spoření): 15 000 Kč/měsíc × 30 let při 3 % úroku = 8,7 mil. Kč.
Scénář B (nemovitost): 600 000 Kč vlastní zdroje + hypotéka 2,4 mil. Byt za 30 let: splacený + hodnota 9 mil. + nájem 30 let = 5,4 mil. Celkem: 14,4 mil. Kč.
Rozdíl: +5,7 mil. Kč. A to nemovitost ještě generuje měsíční příjem.', true),

-- ===== PROCESS - Konkrétní kroky =====

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'První krok: Analýza vlastní situace',
'Než začnete hledat byt, spočítejte si: 1) Kolik máte našetřeno? 2) Kolik můžete měsíčně spořit? 3) Jaký je váš čistý měsíční příjem? 4) Máte existující dluhy? 5) Jste do 36 let (výjimka LTV 90 %)? 6) Máte partnera/rodiče jako spolužadatele? Odpovědi určí vaši strategii.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Druhý krok: Stanovení cíle',
'Konkrétní cíl: "Do 18 měsíců koupím 2+kk v Brně za max 3,5 mil. Kč." Ne: "Jednou si koupím byt." Konkrétní cíl má: lokalitu, typ bytu, cenový strop, deadline. Bez konkrétního cíle je spoření jen přání.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Třetí krok: Plán spoření',
'Kalkulace: Byt 3,5 mil. → potřeba 700 000 Kč (20 %) + 200 000 Kč rezerva = 900 000 Kč. Máte: 200 000 Kč. Chybí: 700 000 Kč. Při spoření 15 000 Kč/měsíc = 47 měsíců (4 roky). Při 20 000 Kč/měsíc = 35 měsíců (3 roky). Při 25 000 Kč/měsíc = 28 měsíců (2,3 roku). Každý měsíc navíc = o měsíc dřív k cíli.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Čtvrtý krok: Vzdělávání',
'Než koupíte, naučte se: 1) Jak funguje hypotéka (LTV, DSTI, fixace). 2) Jak vybrat lokalitu (poměr cena/nájem). 3) Jak vybrat nájemníka (smlouva, kauce). 4) Daně a účetnictví. 5) Správa nemovitosti. ČeskoSobě sdílí zkušenosti členů. Investczech.cz bude mít vzdělávací sekci.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Pátý krok: Akce',
'Máte našetřeno 20 %? Jděte k hypotečnímu poradci. Nečekejte na "ideální moment". Ideální moment byl včera. Druhý nejlepší je dnes. Každý měsíč čekání = měsíc placení nájmu místo budování majetku.', true),

-- ===== AUDIENCE - Detailnější segmentace =====

('a1b2c3d4-0001-4000-8000-000000000001', 'audience', 'Segment: Mladí profesionálové 25-32',
'Charakteristika: První práce, rostoucí příjem, bydlí v nájmu nebo u rodičů. Bolest: Platí nájem = platí cizí hypotéku. Motivace: Nezávislost, vlastní místo. Bariéra: "Nemám dost peněz." Řešení: Výjimka pro mladé (10 % vlastních zdrojů), menší byt, levnější město. Hook: "Platíte 15 000 Kč nájem? To je splátka hypotéky na vlastní byt."', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'audience', 'Segment: Rodiny s dětmi 30-40',
'Charakteristika: Stabilní příjem, vlastní bydlení, přemýšlí o budoucnosti dětí. Bolest: Strach z důchodu, chtějí zanechat něco dětem. Motivace: Zajištění rodiny, dědictví. Bariéra: "Nemám čas, mám hypotéku na vlastní byt." Řešení: Druhý byt jako investice, refinancování stávající hypotéky. Hook: "Co zanecháte dětem? Dluh nebo majetek?"', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'audience', 'Segment: Lidé 40-50 blížící se důchodu',
'Charakteristika: Uvědomují si, že čas běží. Často vlastní bydlení. Bolest: Panika z blížícího se důchodu. Motivace: Urgence, poslední šance. Bariéra: "Není už pozdě?" Řešení: Stále je 20-25 let do důchodu. Stačí na splacení. Hook: "Za 15 let půjdete do důchodu. Jaký bude váš měsíční příjem?"', true),

-- ===== USP - Nové argumenty =====

('a1b2c3d4-0001-4000-8000-000000000001', 'usp', 'Proč ČeskoSobě vs finanční poradci',
'Finanční poradci: Prodávají produkty (fondy, pojištění, spoření). Berou provize. Mají konflikt zájmů.
ČeskoSobě: Neprodává nic. Sdílí zkušenosti. Žádné provize. Žádný konflikt zájmů. Jen lidé, kteří to už udělali a pomáhají ostatním.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'usp', 'Proč nemovitost vs fondy/ETF',
'Fondy/ETF: Musíte mít celou částku. Volatilita. Žádný měsíční příjem (musíte prodávat). Daň z prodeje.
Nemovitost: Stačí 20 % (banka dá zbytek). Splácí nájemník. Stabilní měsíční příjem. Hodnota roste s inflací. Po 5 letech prodej bez daně. Fyzický majetek.', true);

-- ===========================================
-- 2. NOVÉ PROMPT TEMPLATES
-- ===========================================

INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES
('a1b2c3d4-0001-4000-8000-000000000001', 'storytelling_cesko_sobe', 'examples',
$$STORYTELLING PRO LEAD GENERATION:

STRUKTURA PŘÍBĚHU:
1. SITUACE: Kdo je člověk, kolik let, co dělá
2. PROBLÉM: Co řešil, jaká byla bariéra
3. ROZHODNUTÍ: Co udělal, jak začal
4. ČÍSLA: Konkrétní data - cena, splátka, nájem, časová osa
5. VÝSLEDEK: Kde je dnes, co má, co plánuje
6. POUČENÍ: Co se z toho dá vzít

VZOR:
Petr, 32 let, IT specialista. V roce 2019 měl našetřeno 600 000 Kč. Bál se, že to nestačí. Koupil 2+kk v Olomouci za 2,8 mil. Hypotéka 2,2 mil., splátka 11 500 Kč. Nájem: 13 500 Kč. Dnes: Byt stojí 3,6 mil. (+800 tis.). Hypotéka klesla na 1,9 mil. Vlastní kapitál: 1,7 mil. Kč. Petr teď kupuje druhý byt. Poučení: Nejlepší čas začít byl včera. Druhý nejlepší je dnes. Více na investczech.cz

PRAVIDLA:
- Vždy reálný příběh (anonymizovaný)
- Vždy konkrétní čísla
- Vždy časová osa
- Vždy poučení na konci
- Anti-příběhy (co se stane když nečiníte) jsou stejně silné$$, 'Storytelling pro lead generation', 50),

('a1b2c3d4-0001-4000-8000-000000000001', 'urgence_cesko_sobe', 'business_rules',
$$PRAVIDLA PRO VYTVÁŘENÍ URGENCE:

ZAKÁZANÉ (strašení):
- Jste v problémech
- Skončíte v bídě
- Stát vás nechá umřít

POVOLENÉ (faktická urgence):
- Za 15 let půjdete do důchodu. Kolik let vám zbývá na přípravu?
- Každý rok čekání = rok ztracených výnosů
- Ceny rostou rychleji než vaše úspory
- Čas je jediné, co si nekoupíte zpátky

TECHNIKY:
1. ČASOVÁ OSA: Za X let půjdete do důchodu. Zbývá Y let.
2. ZTRACENÁ PŘÍLEŽITOST: V roce 2015 stál byt 2 mil. Dnes 4 mil. Kolik bude stát za 10 let?
3. COMPOUND EFFECT: Každý rok čekání = o rok méně výnosů
4. SROVNÁNÍ: Petr začal v 30. Lukáš čeká. Dnes má Petr 2 byty. Lukáš stále čeká.

DŮLEŽITÉ:
- Urgence musí být podložená čísly
- Vždy nabídnout řešení, ne jen problém
- Tón: Čas běží. Ale ještě není pozdě. Tady je první krok.$$, 'Pravidla urgence v obsahu', 55),

('a1b2c3d4-0001-4000-8000-000000000001', 'objections_cesko_sobe', 'business_rules',
$$PŘEKONÁVÁNÍ NÁMITEK V OBSAHU:

NÁMITKA: Nemám dost peněz
ODPOVĚĎ: Většina lidí v ČeskoSobě začínala s 200-400 tis. Kč. Klíč je plán spoření. Při 15 000 Kč/měsíc máte za 3 roky 740 000 Kč. Pokud jste do 36 let, stačí 10 % vlastních zdrojů.

NÁMITKA: Je to riskantní
ODPOVĚĎ: Každá investice má riziko. Ale: nemovitosti v ČR za 30 let nikdy dlouhodobě neklesly. Nájem pokrývá splátku. Alternativa - spoléhat na důchod 20 736 Kč - je riskantnější.

NÁMITKA: Nemám čas
ODPOVĚĎ: Správa nájemního bytu: 2-5 hodin měsíčně. Nebo správcovská firma za 5-10 % z nájmu.

NÁMITKA: Není už pozdě? (40-50 let)
ODPOVĚĎ: Hypotéku můžete splácet do 70-75 let. To je 20-25 let. Stačí na splacení. Tomáš začal v 42. Dnes má 2 byty.

NÁMITKA: Počkám na lepší čas
ODPOVĚĎ: V roce 2015 stál byt v Brně 2,1 mil. Dnes 4,2 mil. Kdo čekal 10 let, potřebuje 2x víc úspor. Čekání není strategie.

FORMÁT V POSTU:
- Začni námitkou jako otázkou
- Dej faktickou odpověď s čísly
- Nabídni konkrétní první krok
- CTA: Více na investczech.cz$$, 'Překonávání námitek v obsahu', 60),

('a1b2c3d4-0001-4000-8000-000000000001', 'social_proof_cesko_sobe', 'content_strategy',
$$SOCIAL PROOF PRO DŮVĚRYHODNOST:

TYPY SOCIAL PROOF:
1. KONKRÉTNÍ PŘÍBĚHY: Petr, 32 let, koupil první byt v roce 2019...
2. STATISTIKY KOMUNITY: Průměrný člen ČeskoSobě vlastní 1,4 bytu
3. ČASOVÁ OSA: ČeskoSobě vzniklo v roce 2023. Dnes má X členů.
4. VÝSLEDKY: Průměrný ROI členů za 5 let: 180 %

PRAVIDLA:
- Vždy anonymizované příběhy (ne celá jména)
- Vždy konkrétní čísla
- Vždy ověřitelné (ne vymyšlené)
- Střídej úspěšné příběhy s příběhy typu ještě není pozdě

VZOR POSTU:
Petr začal v 32. Dnes má 2 byty.
Jana začala v 28. Dnes má 1 byt a šetří na druhý.
Tomáš začal v 42. Dnes má 2 byty.
Co mají společného? Začali. Nečekali na ideální moment.
Kdy začnete vy?
investczech.cz$$, 'Social proof strategie', 65),

('a1b2c3d4-0001-4000-8000-000000000001', 'cta_optimization_cesko_sobe', 'cta_rules',
$$OPTIMALIZOVANÉ CTA PRO LEAD GENERATION:

SLABÉ CTA (současné):
- Jaký je váš plán? - příliš obecné
- Co uděláte za 20 let? - příliš vzdálené
- Více na investczech.cz - bez důvodu

SILNÉ CTA (nové):
- Spočítejte si první krok na investczech.cz
- Nechte kontakt na investczech.cz - budete mezi prvními
- Stáhněte si kalkulačku vlastních zdrojů: investczech.cz
- Přidejte se k X lidem, kteří už začali: investczech.cz
- První krok: analýza vaší situace. Zdarma na investczech.cz

STRUKTURA SILNÉHO CTA:
1. KONKRÉTNÍ AKCE: Spočítejte si, Stáhněte, Nechte kontakt
2. BENEFIT: První krok, Budete mezi prvními, Zdarma
3. ODKAZ: investczech.cz

PRAVIDLA:
- Vždy konkrétní akce (ne obecná otázka)
- Vždy benefit (co z toho má)
- Vždy odkaz na investczech.cz
- Střídej typy CTA (ne pořád stejné)$$, 'CTA optimalizace pro leady', 70),

('a1b2c3d4-0001-4000-8000-000000000001', 'hook_formulas_cesko_sobe', 'content_strategy',
$$FORMULE PRO SILNÉ HOOKY:

FORMULE 1 - ŠOKUJÍCÍ ČÍSLO + KONTEXT:
1,37 dítěte na ženu. Za 3 roky pokles z 1,83. Nejrychlejší demografický propad v historii ČR.

FORMULE 2 - SROVNÁNÍ PŘED/PO:
2015: Byt v Brně 2,1 mil. Kč. 2025: Stejný byt 4,2 mil. Kč. Kdo čekal, potřebuje 2x víc úspor.

FORMULE 3 - ČASOVÁ BOMBA:
Za 15 let půjdete do důchodu. Zbývá 180 měsíců. Kolik z nich využijete?

FORMULE 4 - ANTI-PŘÍBĚH:
Lukáš čekal na správný moment. V 35 měl 300 tis., byt stál 2 mil. V 45 měl 700 tis., byt stál 3,5 mil. Dnes má 1,2 mil., byt stojí 5 mil. Stále čeká.

FORMULE 5 - NÁKLADY NEČINNOSTI:
Každý rok čekání = rok ztracených výnosů. 10 let čekání = 1,8 mil. Kč ztráty. Čekání není strategie. Je to ztráta.

PRAVIDLA:
- První věta max 10 slov
- Vždy konkrétní číslo
- Vyvolat wow nebo sakra reakci
- Pak teprve kontext a řešení$$, 'Formule pro silné hooky', 75);

-- ===========================================
-- 3. RSS FEEDY PRO ČeskoSobě
-- ===========================================

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- DEMOGRAFIE & DŮCHODY (hlavní téma - každých 6 hodin)
('a1b2c3d4-0001-4000-8000-000000000001', 'ČSÚ - Demografie', 'https://www.czso.cz/csu/czso/rss_demografie', 'demografie', true, 6),
('a1b2c3d4-0001-4000-8000-000000000001', 'Ministerstvo práce - Důchody', 'https://www.mpsv.cz/rss', 'duchody', true, 6),
('a1b2c3d4-0001-4000-8000-000000000001', 'Peníze.cz - Důchody', 'https://www.penize.cz/duchody/rss', 'duchody', true, 12),

-- NEMOVITOSTI & INVESTICE (nájemní byty jako řešení)
('a1b2c3d4-0001-4000-8000-000000000001', 'Hospodářské noviny - Reality', 'https://reality.ihned.cz/?m=rss', 'nemovitosti', true, 6),
('a1b2c3d4-0001-4000-8000-000000000001', 'iDNES.cz - Bydlení', 'https://www.idnes.cz/bydleni/rss', 'bydleni', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'Peníze.cz - Nemovitosti', 'https://www.penize.cz/nemovitosti/rss', 'nemovitosti', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'Kurzy.cz - Reality', 'https://www.kurzy.cz/rss/reality/', 'nemovitosti', true, 24),

-- HYPOTÉKY (nástroj pro nákup nájemních bytů)
('a1b2c3d4-0001-4000-8000-000000000001', 'Hypoindex.cz', 'https://www.hypoindex.cz/feed/', 'hypoteky', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'Peníze.cz - Hypotéky', 'https://www.penize.cz/hypoteky/rss', 'hypoteky', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'Finparáda.cz', 'https://finparada.cz/rss/', 'hypoteky', true, 24),

-- EKONOMIKA & INFLACE (kontext pro investice)
('a1b2c3d4-0001-4000-8000-000000000001', 'ČNB - Tiskové zprávy', 'https://www.cnb.cz/cs/rss/rss_tz.xml', 'cnb', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'Hospodářské noviny - Ekonomika', 'https://ekonomika.ihned.cz/?m=rss', 'ekonomika', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'E15.cz - Finance', 'https://www.e15.cz/rss', 'ekonomika', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'ČSÚ - Ekonomika', 'https://www.czso.cz/csu/czso/rss_ekonomika', 'ekonomika', true, 24),

-- OSOBNÍ FINANCE & INVESTICE
('a1b2c3d4-0001-4000-8000-000000000001', 'Peníze.cz - Osobní finance', 'https://www.penize.cz/osobni-finance/rss', 'finance', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'Měšec.cz - Finance', 'https://www.mesec.cz/rss/clanky/', 'finance', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'Novinky.cz - Finance', 'https://www.novinky.cz/rss/sekce/10', 'finance', true, 12),
('a1b2c3d4-0001-4000-8000-000000000001', 'Patria.cz - Investice', 'https://www.patria.cz/rss/akcie.xml', 'investice', true, 24),

-- SOCIÁLNÍ POLITIKA & LEGISLATIVA
('a1b2c3d4-0001-4000-8000-000000000001', 'Ministerstvo financí ČR', 'https://www.mfcr.cz/cs/rss', 'legislativa', true, 24),
('a1b2c3d4-0001-4000-8000-000000000001', 'České noviny - Ekonomika', 'https://www.ceskenoviny.cz/sluzby/rss2/?id=250', 'ekonomika', true, 24),
('a1b2c3d4-0001-4000-8000-000000000001', 'Aktuálně.cz - Ekonomika', 'https://www.aktualne.cz/rss/ekonomika/', 'ekonomika', true, 24);

-- ===========================================
-- KONEC OBOHACENÍ
-- ===========================================
