-- ===========================================
-- ČeskoSobě – Taxonomie témat (addon)
-- Rozšíření KB o taxonomické záznamy pro kombinování
-- NEMAZŽE existující data – pouze přidává
-- UUID: a1b2c3d4-0001-4000-8000-000000000001
-- ===========================================

-- ============================================
-- CONTENT_TOPICS – Taxonomie pro kombinování
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'general', 'Fáze a tón obsahu',
'Témata: DEMOGRAFICKÉ MEMENTO (faktický, urgentní bez strachu). EDUKACE CESTY (praktický, konkrétní). KOMUNITA (podporující, inspirativní). ANTI-PŘÍBĚH (varovný, faktický). Fáze určuje tón, ne obsah.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'general', 'Dimenze kombinování',
'Témata: ČÍSLO (demografie, ekonomika, trh) + SEGMENT (25-35, 35-45, 45+) + FÁZE (memento, edukace, komunita) + ŘEŠENÍ (konkrétní krok). Hugo kombinuje dimenze, ne opakuje hotové posty.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'general', 'Rotace čísel',
'Témata: Střídej kategorie dat - demografie (porodnost, stárnutí), ekonomika (důchody, mzdy), trh (ceny, nájmy), proces (spoření, hypotéka). Max 1-2 čísla per post. Nepoužívej stejné číslo 2× za sebou.', true);

-- ============================================
-- AUDIENCE – Segmenty a bolesti (taxonomie)
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'audience', 'Segment 25-35: Mladí profesionálové',
'Témata: První práce, rostoucí příjem, bydlí v nájmu. Bolest: Platí cizí hypotéku. Motivace: Nezávislost. Bariéra: Nemám dost peněz. Řešení: Výjimka LTV 90%, menší byt, levnější město. Hook: Platíte nájem = platíte cizí hypotéku.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'audience', 'Segment 30-40: Rodiny s dětmi',
'Témata: Stabilní příjem, vlastní bydlení, přemýšlí o budoucnosti. Bolest: Strach z důchodu, chtějí zanechat dětem. Motivace: Zajištění rodiny. Bariéra: Nemám čas, mám hypotéku. Řešení: Druhý byt jako investice. Hook: Co zanecháte dětem?', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'audience', 'Segment 40-50: Blíží se důchod',
'Témata: Uvědomují si čas. Často vlastní bydlení. Bolest: Panika z blížícího se důchodu. Motivace: Urgence, poslední šance. Bariéra: Není už pozdě? Řešení: Stále 20-25 let do důchodu. Hook: Za 15 let půjdete do důchodu.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'audience', 'Psychografie: Co NECHCE slyšet',
'Témata: Příležitost života, finanční svoboda, pasivní příjem, bohatství. Zprofanované MLM pojmy. Chce: fakta, čísla, racionální řešení. Nedůvěřuje: finančním poradcům, MLM, prázdným slibům.', true);

-- ============================================
-- CASE_STUDY – Vzorce příběhů (taxonomie)
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'case_study', 'Vzorec: Úspěšný příběh',
'Témata: Jméno (anonymizované), věk, profese. Rok startu. Vlastní zdroje (částka). Byt (lokalita, cena). Hypotéka (částka, splátka). Nájem (částka). Dnes: hodnota bytu, hypotéka zbývá, vlastní kapitál. Plán: další kroky.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'case_study', 'Vzorec: Anti-příběh',
'Témata: Jméno, věk. Celý život čekal. V X letech měl Y Kč, byt stál Z. V X+10 měl 2Y, byt stál 2Z. Dnes má 3Y, byt stojí 4Z. Stále čeká. Za N let důchod. Poučení: Čekání není strategie.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'case_study', 'Vzorec: Modelový příklad',
'Témata: Lokalita (město). Typ bytu (2+kk). Cena (částka). Vlastní zdroje (%, částka). Hypotéka (částka, roky, splátka). Nájem (rozmezí). Cash flow (nájem - splátka). Za 30 let: splacený byt, hodnota, příjem.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'case_study', 'Vzorec: Srovnání scénářů',
'Témata: Scénář A (státní důchod): částka, závislost, žádná kontrola. Scénář B (vlastní byt): příjem z nájmu, splacený majetek, státní důchod jako bonus. Rozdíl: kontrola, důstojnost, soběstačnost.', true);

-- ============================================
-- DATA – Kategorie čísel pro rotaci
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Kategorie: Demografie',
'Témata: Porodnost (1,37 dítěte, pokles z 1,83). Stárnutí (30% nad 65 v 2050). Poměr pracujících (2:1 v 2050). Věk dožití (muži 76, ženy 82). Doba v důchodu (24 let). Singles domácnosti (1,5 mil).', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Kategorie: Ekonomika důchodů',
'Témata: Průměrný důchod (20 736 Kč). Minimální důchod (5 500 Kč). Životní minimum (4 860 Kč). Náklady seniora (24 000 Kč). Deficit bez vlastního bydlení (-13 264 Kč). Průměrná mzda vs medián.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Kategorie: Trh nemovitostí',
'Témata: Ceny bytů (Praha 120k/m², Brno 85-95k, Ostrava 40-55k). Růst cen (5-10% ročně). Bytová výstavba (30-35k ročně, potřeba 50-60k). Nájemní trh (poptávka roste 3-5% ročně).', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Kategorie: Proces investice',
'Témata: Vlastní zdroje (20%, LTV 80%). Hypotéka (úrok 5-5,5%). Nájem vs splátka (14-18k vs 12-16k). Výnosnost (3,5-5,5% hrubá + růst 5-10%). Časová osa (1 rok od rozhodnutí).', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Kategorie: Čekání stojí',
'Témata: 2015 vs 2025 (byt Brno 2,1 mil → 4,2 mil). Růst cen vs mzdy (100% vs 35%). Každý rok čekání = rok ztracených výnosů. Compound effect (10 let = 1,8 mil ztráty).', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Statistické kotvy pro hooky',
'Témata: Pokles porodnosti 2021-2024 (1,83 → 1,37, -25% za 3 roky). Věk dožití vs důchod (24 let v důchodu). Reálná hodnota důchodu (klesá s inflací). Průměrný věk prvního bytu (35 let, dřív 28).', true);

-- ============================================
-- FAQ – Námitky a řešení (taxonomie)
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Námitka: Nemám dost peněz',
'Témata: Většina začínala s 200-400 tis. Plán spoření: při 15k/měsíc = 740k za 3 roky. Výjimka pro mladé (10% vlastních). Menší byt, levnější město. Klíč: začít spořit s cílem.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Námitka: Je to riskantní',
'Témata: Každá investice má riziko. Ale: nemovitosti v ČR 30 let neklesly. Nájem pokrývá splátku. Alternativa - důchod 20 736 Kč - je riskantnější. Řízení rizik: kvalitní výběr, kauce, rezervní fond.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Námitka: Nemám čas',
'Témata: Správa bytu: 2-5 hodin měsíčně. Nebo správcovská firma za 5-10% z nájmu. První byt: vlastní správa = naučíte se. Později delegovat.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Námitka: Není už pozdě (40-50 let)',
'Témata: Hypotéka do 70-75 let = 20-25 let. Stačí na splacení. Tomáš začal v 42, dnes má 2 byty. Pozdě je až když nejednáte. Každý rok čekání = rok ztracených výnosů.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'faq', 'Námitka: Počkám na lepší čas',
'Témata: 2015 byt Brno 2,1 mil, dnes 4,2 mil. Kdo čekal 10 let, potřebuje 2× víc úspor. Ideální moment byl včera. Druhý nejlepší je dnes. Čekání není strategie - je to ztráta.', true);

-- ============================================
-- PROCESS – Kroky jako taxonomie
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Krok 1: Analýza situace',
'Témata: Kolik máte našetřeno? Kolik můžete měsíčně spořit? Čistý příjem? Existující dluhy? Věk (výjimka LTV 90% do 36)? Spolužadatel? Odpovědi určí strategii.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Krok 2: Stanovení cíle',
'Témata: Konkrétní cíl: lokalita, typ bytu, cenový strop, deadline. Ne: "Jednou si koupím byt." Ano: "Do 18 měsíců koupím 2+kk v Brně za max 3,5 mil."', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Krok 3: Plán spoření',
'Témata: Kalkulace: byt 3,5 mil → potřeba 700k (20%) + 200k rezerva = 900k. Máte X, chybí Y. Při spoření Z/měsíc = N měsíců. Každý měsíc navíc = o měsíc dřív k cíli.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Krok 4: Vzdělávání',
'Témata: Jak funguje hypotéka (LTV, DSTI, fixace). Jak vybrat lokalitu (poměr cena/nájem). Jak vybrat nájemníka (smlouva, kauce). Daně a účetnictví. Správa nemovitosti. ČeskoSobě sdílí zkušenosti.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Krok 5: Akce',
'Témata: Máte našetřeno 20%? Jděte k hypotečnímu poradci. Nečekejte na ideální moment. Ideální moment byl včera. Druhý nejlepší je dnes. Každý měsíc čekání = měsíc placení nájmu.', true);

-- ============================================
-- MARKET – Trendy a mechanismy (taxonomie)
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Mechanismus: Demografický tlak',
'Témata: Méně dětí → méně pracujících → vyšší daně → méně na bydlení → vyšší poptávka po nájmech. Demografický pokles paradoxně zvyšuje hodnotu nájemních nemovitostí.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Mechanismus: Bytový deficit',
'Témata: Výstavba 30-35k/rok, potřeba 50-60k. Deficit se prohlubuje. Méně bytů = vyšší ceny = vyšší nájmy. Strukturální výhoda pro vlastníky.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Mechanismus: Inflační hedge',
'Témata: Nemovitosti rostou s inflací (8-10% ročně). Inflace průměr 3-5%. Nájem roste s inflací. Hypotéka fixní. Reálná hodnota dluhu klesá. Nemovitost = přirozený hedge.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Mechanismus: Finanční páka',
'Témata: Vlastní zdroje 20% = kontrola 100% aktiva. Páka 5:1. Hypotéka = jediný úvěr, který splácí někdo jiný. Žádný jiný legální nástroj pro běžného člověka.', true);

-- ============================================
-- USP – Diferenciace (taxonomie)
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'usp', 'Diferenciace: Matematika ne marketing',
'Témata: Neříkáme "investujte a zbohatněte". Říkáme: Podívejte se na čísla. 1,37 dítěte. 2 pracující na 1 důchodce v 2050. Průměrný důchod 20 736 Kč. Co uděláte? Žádné sliby. Jen fakta a cesta.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'usp', 'Diferenciace: Komunita ne produkt',
'Témata: Neprodáváme nemovitosti. Sdružujeme lidi, kteří si chtějí pomoct sami. Sdílíme zkušenosti, čísla, příběhy. Pomáháme udělat první krok. Nejde o víc bytů - jde o důstojné stáří.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'usp', 'Diferenciace: Nad politikou',
'Témata: Nejsme proti státu. Jsme vedle něj. Nikomu nic nevyčítáme. Matematika je neúprosná. Řešení má jen ten, kdo je aktivní. Pro sebe, ne proti někomu.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'usp', 'Diferenciace: Nemovitost vs fondy',
'Témata: Fondy: musíte mít celou částku, volatilita, žádný měsíční příjem, daň z prodeje. Nemovitost: stačí 20%, splácí nájemník, stabilní příjem, roste s inflací, po 5 letech bez daně, fyzický majetek.', true);

-- ============================================
-- GENERAL – Koncepty a filozofie
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'general', 'Koncept: Průběžný systém',
'Témata: PAYG = dnešní pracující platí dnešní důchody. Žádné spoření, žádný fond. Funguje jen při dostatku pracujících. Při 2:1 (2050) matematicky neudržitelné. Není to kritika - je to fakt.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'general', 'Koncept: Hypotéka splácená nájmem',
'Témata: Nájem 2+kk krajské město: 14-18k. Splátka hypotéky 2+kk: 12-16k. Nájem pokryje splátku. Po splacení: byt + čistý měsíční příjem. Není to magie - je to matematika.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'general', 'Koncept: Compound effect',
'Témata: Byt 3 mil při růstu 6%/rok. Za 10 let: 5,4 mil (+2,4). Za 20 let: 9,6 mil (+6,6). Za 30 let: 17,2 mil (+14,2). Plus nájem 30 let = 5,4 mil. Celkem 20 mil. Investice: 600k. ROI: 3233%.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'general', 'Koncept: Čekání stojí',
'Témata: Každý rok čekání = rok ztracených výnosů. 10 let čekání = 1,8 mil ztráty. Ideální moment byl včera. Druhý nejlepší je dnes. Čekání není strategie - je to ztráta.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'general', 'Filozofie: Důstojnost ne bohatství',
'Témata: Nejde o hromadění majetku. Jde o to, abychom jako občané nebyli zátěží pro příští generace. Důstojné stáří. Soběstačnost. Odpovědnost. Ne bohatství - zajištění.', true);
