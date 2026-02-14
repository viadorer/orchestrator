-- ===========================================
-- SEED: ČeskoSobě – Rozšíření KB o nové kategorie
-- Doplňuje data, market, legal, process
-- Spouštět PO 012_kb_categories_extend.sql migraci
-- ===========================================

-- Projekt ID
-- a1b2c3d4-0001-4000-8000-000000000001

-- ============================================
-- MARKET (Trh & Trendy) – rozšíření
-- ============================================

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Úrokové sazby hypoték 2024/2025',
'Průměrná úroková sazba hypoték v ČR: 5,0–5,5 % (2024). Historicky: 2020–2021 kolem 2 %. I při vyšších sazbách platí: nájem pokrývá splátku. Sazby jsou cyklické – kdo koupí dráž, refinancuje levněji.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Nájemní trh ČR – poptávka roste',
'Poptávka po nájemním bydlení v ČR roste. Důvody: nedostupnost vlastního bydlení, mobilita pracovní síly, singles domácnosti. V Praze je podíl nájemního bydlení přes 25 %. V krajských městech roste meziročně o 3–5 %.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Bytová výstavba nestačí',
'V ČR se ročně postaví cca 30 000–35 000 bytů. Odhadovaná potřeba: 50 000–60 000 bytů ročně. Deficit se prohlubuje. Méně bytů = vyšší ceny = vyšší nájmy. Pro vlastníky nájemních bytů je to strukturální výhoda.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Ceny nemovitostí – dlouhodobý trend',
'Ceny bytů v ČR za posledních 30 let nikdy dlouhodobě neklesly. Krátkodobé korekce (2008–2009, 2022–2023) trvaly 1–2 roky. Dlouhodobý trend: růst 5–10 % ročně. Nemovitost není spekulace – je to matematika.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Regionální rozdíly v cenách',
'Praha: průměrná cena bytu 120 000+ Kč/m². Brno: 85 000–95 000 Kč/m². Ostrava: 40 000–55 000 Kč/m². Olomouc, Plzeň, Liberec: 55 000–75 000 Kč/m². Mimo Prahu je poměr cena/nájem často výhodnější pro investora.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Výnosnost nájemního bytu',
'Hrubá výnosnost nájemního bytu v ČR: 3,5–5,5 % ročně (závisí na lokalitě). Praha: 3–4 %. Brno: 4–5 %. Menší města: 5–6 %. K tomu růst hodnoty nemovitosti 5–10 % ročně. Celková návratnost: 8–15 % ročně.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Demografický tlak na nájmy',
'Méně narozených dětí = méně pracujících za 20 let = vyšší daně = méně peněz na vlastní bydlení = vyšší poptávka po nájmech. Demografický pokles paradoxně zvyšuje hodnotu nájemních nemovitostí.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'market', 'Hypotéka jako finanční páka',
'Hypotéka je jediný úvěr, který za vás splácí někdo jiný (nájemník). Vlastní zdroje 20 % = kontrolujete 100 % aktiva. Finanční páka 5:1. Žádný jiný legální nástroj toto neumožňuje běžnému člověku.', true);

-- ============================================
-- PROCESS (Jak to funguje) – rozšíření
-- ============================================

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Jak vybrat lokalitu',
'Klíčové metriky: 1) Poměr cena bytu / roční nájem (ideálně pod 20). 2) Obsazenost nájmů v lokalitě (nad 95 %). 3) Dostupnost MHD a občanské vybavenosti. 4) Plánovaná výstavba a rozvoj. Krajská města mimo Prahu často nabízejí nejlepší poměr.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Vlastní zdroje – kolik a jak',
'Banky vyžadují min. 20 % vlastních zdrojů (LTV 80 %). Na byt za 3,5 mil. Kč potřebujete 700 000 Kč. Cesty: spoření, stavební spoření, rodinná půjčka, prodej nepotřebného majetku. Klíč: začít spořit TEĎ, ne "až budu mít víc".', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Jak funguje hypotéka na investiční byt',
'Hypotéka na investiční byt: úrok o 0,3–0,5 % vyšší než na vlastní bydlení. Banka posuzuje vaše příjmy + potenciální nájem (obvykle 60–80 % nájmu započítá). Doba splácení: 25–30 let. Možnost mimořádných splátek a refinancování.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Správa nájemního bytu',
'Dvě cesty: 1) Vlastní správa – komunikace s nájemníkem, drobné opravy, účetnictví. Časová náročnost: 2–5 hodin měsíčně. 2) Správcovská firma – stojí 5–10 % z nájmu, ale ušetří čas. Pro první byt doporučujeme vlastní správu – naučíte se.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Rizika a jak je řídit',
'Hlavní rizika: 1) Neplatící nájemník → řešení: kvalitní výběr, kauce 2 měsíce, pojištění nájmu. 2) Prázdný byt → řešení: správná lokalita, konkurenceschopný nájem. 3) Nečekané opravy → řešení: rezervní fond 10 % z nájmu. 4) Pokles cen → řešení: dlouhodobý horizont (min. 10 let).', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Daňové aspekty pronájmu',
'Příjem z nájmu se daní 15 % (fyzická osoba). Dva způsoby: 1) Skutečné výdaje – odpisy, opravy, pojištění, úroky z hypotéky. 2) Paušální výdaje 30 % z příjmu. Pro většinu začátečníků je paušál jednodušší. Odpisy nemovitosti: 30 let, rovnoměrně.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Časová osa: od rozhodnutí k prvnímu nájmu',
'Realistický harmonogram: Měsíc 1–3: Vzdělávání, analýza trhu, spoření. Měsíc 4–6: Výběr lokality, prohlídky. Měsíc 7–8: Hypoteční proces, koupě. Měsíc 9–10: Drobné úpravy, inzerce. Měsíc 11: První nájemník. Celkem: cca 1 rok od rozhodnutí.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'process', 'Refinancování hypotéky',
'Po fixaci (3–5 let) můžete refinancovat u jiné banky za lepší sazbu. Úspora: i 0,5 % znamená tisíce Kč ročně. Pravidlo: vždy porovnat min. 3 nabídky. Refinancování je zdarma po konci fixace. Aktivní správa hypotéky šetří statisíce za dobu splácení.', true);

-- ============================================
-- LEGAL (Legislativa) – nová kategorie
-- ============================================

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'legal', 'Důchodová reforma ČR – stav',
'Důchodová reforma se v ČR odkládá desítky let. Každá vláda slibuje řešení, žádná ho nedotáhla. Mezitím demografická křivka pokračuje dolů. Reforma může přinést: zvýšení věku odchodu do důchodu, snížení valorizace, zavedení povinného spoření. Jisté je jedno: stát nebude schopen vyplácet důchody v dnešní výši.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'legal', 'Průběžný důchodový systém – jak funguje',
'ČR má průběžný (PAYG) systém: dnešní pracující platí důchody dnešním seniorům. Žádné spoření, žádný fond. Funguje jen pokud je dost pracujících na jednoho důchodce. Při poměru 2:1 (2050) je systém matematicky neudržitelný bez dramatických změn.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'legal', 'Daň z nemovitosti a pronájmu',
'Daň z nemovitosti: řádově stovky až nízké tisíce Kč ročně (závisí na lokalitě a velikosti). Daň z příjmu z nájmu: 15 %. Sociální a zdravotní pojištění: neplatí se z nájmu (pokud není hlavní činnost). Nemovitost je daňově efektivní forma příjmu.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'legal', 'Nájemní smlouva – základy',
'Nájemní smlouva musí obsahovat: identifikaci stran, popis bytu, výši nájmu, dobu nájmu, práva a povinnosti. Doporučení: smlouva na dobu určitou (1 rok s prolongací), kauce 2–3 měsíce, energetický protokol. Občanský zákoník chrání nájemníka – proto je kvalitní smlouva klíčová.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'legal', 'Výpověď nájemníka – pravidla',
'Pronajímatel může dát výpověď jen ze zákonných důvodů (neplacení nájmu, hrubé porušení povinností, potřeba bytu pro sebe). Výpovědní lhůta: 3 měsíce. Nájemník může vypovědět kdykoliv s 3měsíční lhůtou. Soudní vystěhování: měsíce až roky. Proto je prevence (kvalitní výběr nájemníka) lepší než řešení problémů.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'legal', 'Pojištění nemovitosti a odpovědnosti',
'Povinné: pojištění nemovitosti (požár, povodeň, vandalismus). Doporučené: pojištění odpovědnosti pronajímatele, pojištění nájmu (proti neplacení). Cena: 2 000–5 000 Kč ročně. Malá investice, která chrání majetek v hodnotě milionů.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'legal', 'DPH a nemovitosti',
'Prodej bytu po 5 letech vlastnictví je osvobozen od daně z příjmu. Prodej do 5 let: daní se zisk 15 %. Pro investiční strategii ČeskoSobě (dlouhodobé držení 25–30 let) je toto irelevantní – cílem není prodej, ale měsíční příjem z nájmu.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'legal', 'Stavební spoření jako nástroj',
'Stavební spoření: státní podpora 10 % z vkladu (max 2 000 Kč/rok). Po 6 letech nárok na úvěr ze stavebního spoření (nižší úrok než hypotéka). Lze kombinovat s hypotékou. Pro mladé lidi: ideální start spoření na vlastní zdroje.', true);

-- ============================================
-- DATA (Čísla & Statistiky) – doplnění
-- ============================================

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Počet singles domácností',
'V ČR žije přes 1,5 milionu jednočlenných domácností. Trend roste. Singles potřebují bydlení, ale nemají dvojí příjem. Výsledek: vyšší poptávka po menších bytech (1+kk, 2+kk) = ideální segment pro nájemní investici.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Zadluženost českých domácností',
'Celkový dluh českých domácností: přes 2,2 bilionu Kč. Z toho hypotéky: cca 1,6 bilionu Kč. Průměrná hypotéka: 3,2 mil. Kč. Hypotéka na investiční byt je dluh, který za vás splácí někdo jiný. To je zásadní rozdíl.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Důchodový věk – kam směřuje',
'Aktuální důchodový věk: 65 let. Trend v EU: postupné zvyšování na 67–68 let. Dánsko: navázáno na věk dožití. Pokud ČR následuje trend: generace dnešních třicátníků půjde do důchodu v 67–68 letech. O důvod víc mít vlastní příjem dřív.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Minimální důchod vs životní náklady',
'Minimální důchod v ČR: cca 5 500 Kč/měsíc. Životní minimum jednotlivce: 4 860 Kč. Průměrné náklady na bydlení seniora v nájmu: 8 000–12 000 Kč. Minimální důchod nepokryje ani nájem. Bez vlastního bydlení nebo příjmu je senior v existenční pasti.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Finanční gramotnost Čechů',
'Pouze 38 % Čechů rozumí základním finančním pojmům (inflace, úrok, diverzifikace). 62 % nemá žádnou investiční strategii pro důchod. 45 % spoléhá výhradně na státní důchod. Vzdělávání je první krok – proto ČeskoSobě začíná čísly.', true),

('a1b2c3d4-0001-4000-8000-000000000001', 'data', 'Průměrná mzda vs medián',
'Průměrná mzda ČR: 43 967 Kč (2024). Medián: 37 000 Kč. Většina lidí vydělává MÉNĚ než průměr. Důchod 45 % z mediánu = cca 16 650 Kč. To je realita většiny budoucích důchodců.', true);
