-- ============================================
-- PTF Reality - Knowledge Base & Prompt Templates Seed
-- Kompletní realitní služby Plzeň a okolí
-- UUID: 15a83244-d502-4407-8f90-c761170b1d9d
-- Web: ptf.cz
-- Platformy: Facebook, Instagram, LinkedIn
-- ============================================

DELETE FROM knowledge_base WHERE project_id = '15a83244-d502-4407-8f90-c761170b1d9d';
DELETE FROM project_prompt_templates WHERE project_id = '15a83244-d502-4407-8f90-c761170b1d9d';

-- ============================================
-- KNOWLEDGE BASE (60+ entries)
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

-- ============================================
-- AUDIENCE (4)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'audience', 'Kdo jsou naši klienti',
'Prodávající: majitelé nemovitostí v Plzni a okolí, chtějí prodat za nejlepší cenu, rychle a bez starostí. Kupující: hledají byt nebo dům, potřebují průvodce celým procesem. Investoři: hledají výnosné nemovitosti, chtějí čísla a analýzu. Pronajímatelé: majitelé hledající spolehlivé nájemníky nebo správu.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'audience', 'Co klienty trápí',
'1. Nevědí, za kolik prodat/koupit. 2. Bojí se špatného rozhodnutí za miliony. 3. Špatná zkušenost s makléřem (neplní sliby, špatná komunikace). 4. Nerozumí právní stránce (smlouvy, katastr, daně). 5. Nemají čas na desítky prohlídek. 6. Bojí se skrytých vad. 7. Neví, jak financovat (hypotéka, vlastní zdroje).', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'audience', 'Proč si vybrat PTF reality',
'Lokální znalost Plzně a okolí — víme, co se kde staví, jaké jsou ceny, kdo kupuje. Osobní přístup — nejsme velká korporace, každý klient má svého makléře. Transparentní komunikace — pravidelné reporty, žádné překvapení. Kompletní servis — od odhadu přes marketing po právní servis. Propojení s Quadrum (finance) a odhad.online (ocenění).', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'audience', 'Segmenty klientů',
'Prvokupující (28-40): nervózní, potřebují vysvětlit každý krok, citliví na cenu. Rodiny (30-45): hledají větší byt/dům, školky, parky, bezpečí. Investoři (35-55): chtějí čísla, výnos, ROI, rychlé rozhodování. Senioři (55-75): prodávají velký dům, stěhují se do menšího, citliví na důvěru. Rozvedení (30-50): rychlý prodej, vypořádání, emocionálně zatížení. Dědici (40-65): zdědili nemovitost, nevědí co s ní.', true),

-- ============================================
-- SLUŽBY (8)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'product', 'Prodej nemovitosti — kompletní servis',
'Co děláme: Bezplatné ocenění nemovitosti. Profesionální fotografie a video (dron, 3D prohlídka). Home staging konzultace. Inzerce na 15+ portálech (Sreality, Bezrealitky, iDNES, FB marketplace). Organizace prohlídek. Vyjednávání s kupujícími. Právní servis (smlouvy, úschova, katastr). Předání nemovitosti.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'product', 'Koupě nemovitosti — průvodce',
'Co děláme: Analýza požadavků a rozpočtu. Vyhledání vhodných nemovitostí (i mimo veřejnou nabídku). Organizace prohlídek s odborným komentářem. Kontrola právního stavu (LV, věcná břemena, SVJ). Vyjednávání ceny. Zajištění financování (spolupráce s Quadrum). Právní servis až po předání klíčů.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'product', 'Pronájem — služby pro majitele',
'Co děláme: Stanovení optimálního nájmu (analýza trhu). Profesionální fotografie a inzerce. Prověření nájemníků (registry, příjem, reference). Příprava nájemní smlouvy. Předávací protokol s fotodokumentací. Volitelně: průběžná správa nemovitosti.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'product', 'Odhad a ocenění nemovitosti',
'Tržní odhad pro prodej/koupi — orientační cena na základě srovnání s trhem. Znalecký posudek pro banku, soud, dědictví. Online odhad přes odhad.online — rychlý a zdarma. Metody: porovnávací, výnosová, nákladová. Doba: online minuty, tržní odhad 1-3 dny, znalecký 1-2 týdny.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'product', 'Investiční poradenství',
'Analýza investičních příležitostí v Plzni a okolí. Kalkulace výnosnosti (hrubý/čistý výnos, ROE, cash flow). Pomoc s výběrem nemovitosti, financováním, správou. Propojení s InvestCzech pro širší investiční strategie. Pro začínající i zkušené investory.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'product', 'Home staging',
'Konzultace a doporučení pro přípravu nemovitosti k prodeji. Zvyšuje prodejní cenu o 5-15 %. Zkracuje dobu prodeje o 30-50 %. Základy: declutter, neutrální barvy, světlo, čistota, vůně. Koupelna a kuchyň jsou klíčové. Spolupráce s profesionálními stagery.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'product', 'Právní servis',
'Příprava a kontrola kupních/nájemních smluv. Zajištění úschovy kupní ceny (advokátní, notářská, bankovní). Zastoupení při vkladu do katastru. Kontrola právního stavu nemovitosti (LV, věcná břemena, exekuce). Spolupráce s advokáty specializovanými na nemovitostní právo.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'product', 'Správa nemovitostí',
'Kompletní správa pronajímaných nemovitostí. Hledání a prověřování nájemníků. Komunikace s nájemníky. Řešení oprav a údržby. Měsíční reporting majiteli. Inkaso nájmu. Pro majitele, kteří nemají čas nebo bydlí daleko.', true),

-- ============================================
-- TRH PLZEŇ (6)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'data', 'Ceny bytů Plzeň 2026',
'Průměrné ceny: 1+kk 2,5-3,5 mil. (65-80 tis./m2). 2+kk 3,5-4,5 mil. (70-85 tis./m2). 3+kk 4,5-6 mil. (65-80 tis./m2). 4+kk 5,5-7,5 mil. Novostavby: +10-20 % oproti průměru. Centrum a Slovany nejdražší. Doubravka, Lobzy, Skvrňany dostupnější.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'data', 'Ceny domů Plzeň 2026',
'Rodinné domy: 5-12 mil. podle lokality a stavu. Řadové domy: 4-7 mil. Novostavby na klíč: 8-15 mil. Pozemky: 3-8 tis./m2 (Plzeň-město), 1,5-4 tis./m2 (okolí). Nejžádanější: Černice, Lhota, Útušice, Starý Plzenec.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'data', 'Čtvrti Plzně — přehled pro kupující',
'CENTRUM (Plzeň 1): nejdražší, dobrá dostupnost, méně zeleně, historické budovy. SLOVANY: oblíbené, dobrá infrastruktura, vyšší ceny, rodiny. BOLEVEC: klidné, rodinné, přehrada, dostupnější. DOUBRAVKA: průmyslová oblast, levnější, méně atraktivní. LOBZY: klidné, starší zástavba, nižší ceny. BORY: nová zástavba, roste poptávka, dobrá doprava. SKVRŇANY: smíšená oblast, dostupné ceny, blízko centra.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'data', 'Trendy trhu Plzeň 2026',
'Ceny rostou 3-6 %/rok. Poptávka převyšuje nabídku. Doba prodeje kvalitní nemovitosti: 2-8 týdnů. Novostavby: Bory, Černice, Sylván. Investoři z Prahy kupují v Plzni (nižší ceny, slušný výnos). Remote work zvyšuje zájem o větší byty a domy v okolí.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'data', 'Nájemní trh Plzeň',
'Průměrné nájmy: 1+kk 10-13 tis., 2+kk 13-17 tis., 3+kk 16-21 tis. Růst 5-8 %/rok. Poptávka vysoká (univerzita, Škoda, průmysl). Doba pronájmu kvalitního bytu: 1-2 týdny. Hrubý výnos z pronájmu: 4-6 %.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'data', 'Proč Plzeň pro investice',
'Stabilní ekonomika (Škoda, průmysl, univerzita). Nižší vstupní ceny než Praha (-40-50 %). Vyšší výnos z pronájmu (4-6 % vs. 3-4 % Praha). Dobrá dopravní dostupnost (D5, vlak do Prahy 1:20). Rostoucí populace. Nová výstavba (Bory, Černice).', true),

-- ============================================
-- PROCES PRODEJE (6)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'process', 'Jak probíhá prodej s PTF reality',
'1. Bezplatná schůzka a ocenění. 2. Podpis zprostředkovatelské smlouvy. 3. Příprava nemovitosti (staging, fotky, video). 4. Spuštění inzerce na 15+ portálech. 5. Organizace prohlídek. 6. Vyjednávání s kupujícími. 7. Rezervační smlouva + záloha. 8. Kupní smlouva + úschova. 9. Vklad do katastru. 10. Předání nemovitosti.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'process', 'Jak probíhá koupě s PTF reality',
'1. Analýza požadavků a rozpočtu. 2. Vyhledání nemovitostí. 3. Prohlídky s odborným komentářem. 4. Kontrola právního stavu. 5. Vyjednávání ceny. 6. Zajištění financování (Quadrum). 7. Rezervační smlouva. 8. Kupní smlouva + úschova. 9. Vklad do katastru. 10. Předání klíčů.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'process', 'Marketing nemovitosti',
'Profesionální fotografie (DSLR, wide angle, HDR). Video prohlídka (dron pro domy). 3D virtuální prohlídka (Matterport). Floor plan (půdorys). Copywriting inzerátu (emoce + fakta). Distribuce: Sreality, Bezrealitky, iDNES Reality, FB Marketplace, Instagram, vlastní databáze kupujících.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'process', 'Příprava nemovitosti k prodeji',
'Declutter — odstranit osobní věci, přebytečný nábytek. Drobné opravy — kapající kohoutek, prasklá dlaždice, nefunkční zásuvka. Malování — neutrální barvy (bílá, světle šedá). Čistota — profesionální úklid. Vůně — čerstvé květiny, káva. Zahrada — posekat, uklidit. Fotky PŘED a PO.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'process', 'Vyjednávání — jak získáme nejlepší cenu',
'Správné ocenění na začátku (ne přestřelení). Kvalitní marketing = více zájemců = silnější pozice. Organizace prohlídek ve vlnách (vytvoření konkurence). Transparentní komunikace s kupujícími. Znalost motivace kupujícího. Trpělivost — nespěchat na první nabídku. Data z trhu jako argument.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'process', 'Právní bezpečnost transakce',
'Kontrola LV (zástavní práva, věcná břemena, exekuce). Kupní smlouva připravená advokátem. Úschova kupní ceny (advokátní nebo bankovní). Vklad do katastru — sledování průběhu. Předávací protokol s fotodokumentací. Daňové povinnosti — upozornění a poradenství.', true),

-- ============================================
-- FAQ (8)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'faq', 'Kolik stojí služby PTF reality?',
'Prodej: provize 2-4 % z prodejní ceny (záleží na typu nemovitosti a rozsahu služeb). Koupě: zastoupení kupujícího — individuální dohoda. Pronájem: 1 měsíční nájem. Odhad: bezplatný při zprostředkování, jinak od 3 000 Kč. Konzultace: první schůzka vždy zdarma.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'faq', 'Jak dlouho trvá prodej?',
'Kvalitní nemovitost se správnou cenou: 2-8 týdnů. Průměr: 4-6 týdnů od spuštění inzerce po podpis kupní smlouvy. + 1-3 měsíce na vklad do katastru a předání. Faktory: cena, stav, lokace, sezóna (jaro/podzim nejlepší).', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'faq', 'Proč exkluzivní smlouva?',
'Exkluzivita = plný marketing (investujeme do fotek, videa, stagingu). Neexkluzivita = nemovitost na 5 portálech od 5 makléřů za různé ceny = chaos. Exkluzivita neznamená závislost — smlouva má výpovědní lhůtu. Výsledek: rychlejší prodej, vyšší cena.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'faq', 'Můžu prodat sám bez makléře?',
'Ano, ale zvažte: Umíte ocenit nemovitost? (Přestřelení = měsíce na trhu, podstřelení = ztráta statisíců.) Máte čas na prohlídky, vyjednávání, právní přípravu? Znáte právní náležitosti (smlouvy, úschova, katastr)? Dobrý makléř se zaplatí — získá vyšší cenu a ušetří čas.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'faq', 'Jak poznám správnou cenu nemovitosti?',
'Srovnání s realizovanými cenami (ne nabídkovými). Analýza lokality, stavu, dispozice. Online odhad na odhad.online (zdarma, orientační). Tržní odhad od makléře (bezplatný při spolupráci). Znalecký posudek (pro banku, soud). Pozor: nabídková cena ≠ prodejní cena (rozdíl 5-15 %).', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'faq', 'Co je úschova a proč ji potřebuji?',
'Úschova = bezpečné uložení kupní ceny u třetí strany (advokát, notář, banka). Peníze se uvolní prodávajícímu až po vkladu do katastru. Chrání obě strany — kupující nepřijde o peníze, prodávající má jistotu platby. Náklady: 5-15 tis. Kč. VŽDY doporučujeme.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'faq', 'Potřebuji PENB při prodeji?',
'Ano — energetický průkaz je povinný při prodeji i pronájmu. Třídy A-G. Platnost 10 let. Náklady: 3-8 tis. Kč. Sankce za chybějící: až 100 tis. Kč. Zajistíme v rámci služeb.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'faq', 'Jak funguje spolupráce s Quadrum?',
'Quadrum (quadrum.cz) je naše sesterská společnost pro finanční poradenství. Zajistí: hypotéku za nejlepší podmínky, pojištění nemovitosti, investiční poradenství. Výhoda: vše pod jednou střechou — nemovitost + financování. Konzultace zdarma.', true),

-- ============================================
-- LEGAL (4)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'legal', 'Kupní smlouva — klíčové body',
'Identifikace stran a nemovitosti. Kupní cena a způsob úhrady. Prohlášení prodávajícího o stavu. Způsob předání. Smluvní pokuty. Odstoupení od smlouvy. Úschova kupní ceny. Vklad do katastru. Vždy připravuje advokát — nikdy vzor z internetu.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'legal', 'Rezervační smlouva',
'Závazek kupujícího i prodávajícího. Rezervační záloha (obvykle 3-5 % z ceny). Lhůta pro uzavření kupní smlouvy. Co se stane při odstoupení (propadnutí zálohy). Podmínky (schválení hypotéky). Vždy písemně, vždy s advokátem.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'legal', 'Daně při prodeji nemovitosti',
'Daň z příjmu: osvobozeno po 5 letech bydlení nebo 10 letech vlastnictví. Pokud ne — 15 % z rozdílu (prodejní cena - nabývací cena - náklady). Daň z nemovitých věcí: platí nový vlastník od 1.1. následujícího roku. Daň z nabytí: ZRUŠENA od 2020.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'legal', 'Věcná břemena a zástavní práva',
'Věcné břemeno: právo třetí osoby (průchod, průjezd, vedení sítí). Zástavní právo: hypotéka banky — musí být vymazáno při prodeji. Předkupní právo: spoluvlastník má přednost. Exekuce: STOP — nelze prodat. Vše kontrolujeme na LV před zahájením prodeje.', true),

-- ============================================
-- CASE STUDIES (4)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'case_study', 'Vzorec: Úspěšný prodej',
'Struktura: Typ nemovitosti a lokace. Výchozí stav (co jsme převzali). Co jsme udělali (staging, fotky, marketing). Výsledek (cena, doba prodeje, počet zájemců). Klíč k úspěchu. Anonymizováno, reálná čísla.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'case_study', 'Vzorec: Spokojený kupující',
'Struktura: Co klient hledal. Jaké měl obavy. Jak jsme pomohli (vyhledání, prohlídky, vyjednávání, financování). Výsledek (co koupil, za kolik, úspora). Zpětná vazba klienta. Anonymizováno.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'case_study', 'Vzorec: Investiční případ',
'Struktura: Investor (profil). Nemovitost (typ, lokace, cena). Financování (vlastní/hypotéka). Rekonstrukce (náklady). Pronájem (nájem, nájemník). Výnos (ROE, cash flow). Celkový výsledek. Reálná čísla.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'case_study', 'Vzorec: Before/After',
'Struktura: Nemovitost před (stav, fotky, cena). Co jsme udělali (staging, opravy, marketing). Nemovitost po (stav, fotky, prodejní cena). Rozdíl (navýšení ceny, zkrácení doby prodeje). Investice do přípravy vs. výsledek.', true),

-- ============================================
-- USP & BRAND (4)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'usp', 'Lokální expert na Plzeň',
'Známe každou čtvrť, každou ulici. Víme, kde se staví, kde jsou plány na rozvoj, kde jsou nejlepší školy. Máme databázi kupujících, kteří aktivně hledají. Lokální znalost = rychlejší prodej za lepší cenu.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'usp', 'Kompletní servis pod jednou střechou',
'Prodej, koupě, pronájem, odhad, investice — vše na jednom místě. Propojení s Quadrum (finance) a odhad.online (ocenění). Klient nemusí hledat dalšího makléře, poradce, odhadce. Šetříme čas a peníze.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'usp', 'Transparentní komunikace',
'Pravidelné reporty o průběhu prodeje/hledání. Zpětná vazba z každé prohlídky. Reálné ocenění — neříkáme vyšší cenu, abychom získali zakázku. Upřímnost i o nevýhodách nemovitosti. Žádné skryté poplatky.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'usp', 'Profesionální marketing',
'Profesionální fotografie (DSLR, HDR, wide angle). Video a dron. 3D virtuální prohlídky. Home staging konzultace. Distribuce na 15+ portálech. Cílená reklama na sociálních sítích. Vlastní databáze kupujících.', true),

-- ============================================
-- MARKET — TRENDY A ANALÝZY (8)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'market', 'Realitní trh ČR 2026 — přehled',
'Ceny nemovitostí rostou 3-6 %/rok. Hypoteční sazby 4,5-5,5 % (fixace 5 let), mírný pokles z maxima 2023. Poptávka převyšuje nabídku — málo se staví. Novostavby +10-20 % oproti starším. Investoři se vrací na trh. Regionální rozdíly se prohlubují.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'market', 'Plzeň vs. Praha — srovnání trhu',
'Praha: průměr 120-140 tis./m2, výnos 3-4 %, nejstabilnější růst. Plzeň: průměr 65-85 tis./m2, výnos 4-6 %, nižší vstup, vyšší výnos. Plzeň roste rychleji procentuálně. Investoři z Prahy kupují v Plzni. Dostupnost bydlení: Praha 14x roční příjem, Plzeň 10x.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'market', 'Nová výstavba Plzeň',
'Hlavní rozvojové lokality: Bory (Bory Mall okolí, nová zástavba), Černice (rodinné domy, klidná lokalita), Sylván (prémiová lokace). Developeři: JRD, Daramis, lokální. Doba výstavby: 2-4 roky od povolení. Ceny novostaveb: 85-110 tis./m2. Pozemky: 3-8 tis./m2.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'market', 'Sezónnost realitního trhu',
'Jaro (březen-květen): nejvíce prodejů, nejvíce kupujících, nejlepší doba pro prodej. Léto (červen-srpen): zpomalení, dovolené, méně prohlídek. Podzim (září-listopad): druhá vlna aktivity, investoři. Zima (prosinec-únor): nejméně prodejů, ale motivovaní kupující. Tip: inzerovat v únoru, prodat na jaře.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'market', 'Vliv úrokových sazeb na trh',
'Nižší sazby = vyšší poptávka = rostoucí ceny. Vyšší sazby = nižší poptávka = stagnace/pokles. ČNB repo sazba ovlivňuje hypoteční sazby s 3-6 měsíčním zpožděním. Aktuální trend: mírný pokles sazeb → oživení poptávky. Pro prodávající: prodávat při nízké sazbě. Pro kupující: kupovat při vysoké sazbě (nižší konkurence).', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'market', 'Proptech a digitalizace realit',
'Online prohlídky a 3D modely (Matterport). AI oceňování nemovitostí (odhad.online). Digitální podpisy a smlouvy. Virtuální staging. Dronové záběry jako standard. Automatizovaný marketing. PTF reality využívá všechny moderní nástroje pro rychlejší a efektivnější prodej.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'market', 'Dostupnost bydlení — problém a řešení',
'Plzeň: price-to-income ratio 10x (průměrný byt = 10 ročních příjmů). Příčiny: málo stavíme, pomalá povolení, rostoucí náklady. Řešení pro klienty: investiční byt na hypotéku (nájemník splácí), menší byt jako start, okolí Plzně (nižší ceny, 15-20 min dojezd).', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'market', 'Energetická náročnost a ceny',
'PENB třída A-B: premium +5-10 % k ceně. Třída E-G: sleva 5-15 %. Nová zelená úsporám — dotace na zateplení, okna, FVE. Náklady na energie rostou → PENB stále důležitější. Novostavby: téměř nulová spotřeba (nZEB). Starší panelák po revitalizaci: třída C-D.', true),

-- ============================================
-- GENERAL — O PTF REALITY (6)
-- ============================================
('15a83244-d502-4407-8f90-c761170b1d9d', 'general', 'O PTF reality',
'Lokální realitní kancelář v Plzni. Kompletní služby: prodej, koupě, pronájem, odhady, investiční poradenství, správa nemovitostí. Osobní přístup — každý klient má svého makléře. Propojení s Quadrum (finance) a odhad.online (ocenění). Web: ptf.cz.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'general', 'Náš tým',
'Zkušení makléři s lokální znalostí Plzně. Každý makléř se specializuje na konkrétní segment (byty, domy, investice, pronájem). Pravidelné vzdělávání a certifikace. Spolupráce s advokáty, odhadci, finančními poradci. Osobní přístup — nejsme call centrum.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'general', 'Jak se liší dobrý makléř od špatného',
'Dobrý: reálné ocenění (ne přestřelení pro získání zakázky), profesionální marketing (fotky, video, staging), pravidelná komunikace, zpětná vazba z prohlídek, právní bezpečnost. Špatný: slibuje nereálnou cenu, fotky z mobilu, nereaguje na dotazy, tlačí na rychlý podpis. PTF reality = standard dobrého makléře.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'general', 'Spolupráce s partnery',
'Quadrum (quadrum.cz): finanční poradenství, hypotéky, pojištění. odhad.online: online odhad ceny nemovitosti. Advokátní kanceláře: smlouvy, úschova, katastr. Odhadci: znalecké posudky. Stageři: příprava nemovitosti. Fotografové: profesionální fotky a video. Řemeslníci: drobné opravy před prodejem.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'general', 'Proč pracujeme jen v Plzni a okolí',
'Lokální znalost je naše největší výhoda. Známe každou čtvrť, každou ulici, každý developerský projekt. Víme, kde jsou dobré školy, kde je problém s parkováním, kde se plánuje nová výstavba. Tuto znalost nelze nahradit — a proto se soustředíme na region, který známe nejlépe.', true),

('15a83244-d502-4407-8f90-c761170b1d9d', 'general', 'Naše hodnoty',
'Transparentnost — říkáme pravdu, i když není příjemná. Profesionalita — každý detail má význam (fotky, smlouvy, komunikace). Osobní přístup — klient není číslo. Výsledky — měříme se prodejní cenou a dobou prodeje, ne počtem zakázek. Vzdělávání — sdílíme znalosti, protože informovaný klient je spokojený klient.', true);

-- ============================================
-- PROMPT TEMPLATES
-- ============================================
INSERT INTO project_prompt_templates (project_id, slug, category, description, content, is_active) VALUES

-- COMMUNICATION
('15a83244-d502-4407-8f90-c761170b1d9d', 'communication_ptf', 'communication', 'Komunikační pravidla PTF reality',
'PRAVIDLA KOMUNIKACE — PTF REALITY:

IDENTITA:
- PTF reality — lokální realitní kancelář v Plzni. Osobní přístup, profesionální servis.
- Tón: profesionální ale přátelský. Žádný korporátní jazyk. Mluvíme jako lidé, ne jako firma.
- Používáme "my" (tým PTF) a občas "já" (osobní příběh makléře).
- Důraz na lokální znalost Plzně — jsme odtud, známe to tady.

JAZYK:
- Česky s háčky a čárkami.
- Konkrétní čísla vždy: "prodáno za 4,2 mil. za 3 týdny" — ne "rychle a za dobrou cenu".
- Příklady z praxe — reálné příběhy (anonymizované).
- Krátké věty, jasné myšlenky.

POVINNÁ STRUKTURA:
1. HOOK: Číslo, otázka, nebo příběh z praxe
2. TĚLO: Konkrétní obsah s hodnotou pro čtenáře
3. LOKÁLNÍ PRVEK: Zmínka Plzně, čtvrti, nebo lokálního kontextu
4. CTA: Otázka nebo nabídka konzultace

ZAKÁZANÉ:
- Agresivní prodej ("Prodejte s námi TEĎ!")
- Přehnané sliby ("Garantujeme nejvyšší cenu!")
- Negativní zmínky o konkurenci
- Obecné fráze bez obsahu

CROSS-PROMOTION:
- Quadrum: u témat financování, hypotéky
- odhad.online: u témat ocenění
- David Choc: osobní příběhy makléře
- Vždy přirozeně v kontextu', true),

-- CONTENT STRATEGY
('15a83244-d502-4407-8f90-c761170b1d9d', 'content_strategy_ptf', 'content_strategy', 'Strategie obsahu PTF reality',
'STRATEGIE OBSAHU — PTF REALITY:

Content mix: 60 % edukace/hodnota, 25 % social proof/case studies, 15 % nabídka služeb.

PILÍŘE:
A) EDUKACE (30 %): Tipy pro prodávající/kupující, právní rady, trh Plzeň, home staging
B) SOCIAL PROOF (25 %): Úspěšné prodeje (before/after, čísla), reference, příběhy klientů
C) TRH A DATA (20 %): Ceny v Plzni, trendy, statistiky, novinky z trhu
D) BEHIND THE SCENES (15 %): Jak pracujeme, prohlídky, příprava nemovitosti, tým
E) NABÍDKA (10 %): Aktuální nemovitosti v nabídce, nové služby

PRAVIDLA:
- Každý post = hodnota pro čtenáře (ne jen reklama)
- Čísla z Plzně vždy aktuální
- Case studies min 1x týdně
- Nabídka nemovitostí max 2x týdně
- Lokální kontext v každém postu', true),

-- CTA RULES
('15a83244-d502-4407-8f90-c761170b1d9d', 'cta_ptf', 'cta_rules', 'CTA pravidla PTF reality',
'CTA PRAVIDLA — PTF REALITY:

1. ENGAGEMENT (40 %): "Jaká je vaše zkušenost?", "Co byste udělali?", "Souhlasíte?"
2. KONZULTACE (30 %): "Bezplatná konzultace — napište nám.", "Chcete vědět cenu vaší nemovitosti? Ozvěte se."
3. WEB (20 %): "Více na ptf.cz", "Aktuální nabídka na ptf.cz"
4. SDÍLENÍ (10 %): "Sdílejte, ať to vidí víc lidí"

PRAVIDLA:
- Max 1 CTA per post
- Konzultace CTA jen u relevantních témat (prodej, koupě, odhad)
- Nikdy agresivní prodej
- Nabídka nemovitostí: odkaz na detail, ne na hlavní stránku', true),

-- GUARDRAILS
('15a83244-d502-4407-8f90-c761170b1d9d', 'guardrail_ptf', 'guardrail', 'Guardrails PTF reality',
'BEZPEČNOSTNÍ PRAVIDLA — PTF REALITY:

- NIKDY garantovat prodejní cenu nebo dobu prodeje
- NIKDY negativně o konkurenčních realitních kancelářích
- NIKDY zveřejňovat osobní údaje klientů
- NIKDY právní radu jako závaznou — vždy "doporučujeme konzultaci s advokátem"
- Čísla z trhu jako orientační — "přibližně", "v rozmezí"
- Ceny nemovitostí v nabídce vždy aktuální (ne staré inzeráty)
- Fotky vždy aktuální stav nemovitosti
- Reference pouze se souhlasem klienta', true),

-- HOOK LIBRARY
('15a83244-d502-4407-8f90-c761170b1d9d', 'hook_library_ptf', 'examples', 'Hook knihovna PTF reality',
'HOOK KNIHOVNA — PTF REALITY:

PRODEJ:
"Prodáno za 3 týdny, o 200 tisíc nad nabídkovou cenu. Tady je, jak jsme to udělali:"
"5 chyb, které stojí prodávající statisíce. Děláte je taky?"
"Tenhle byt ležel na trhu 4 měsíce. Převzali jsme ho a prodali za 3 týdny."
"Home staging za 15 tisíc zvýšil prodejní cenu o 350 tisíc. Tady jsou fotky:"

KOUPĚ:
"Klient hledal byt v Plzni 6 měsíců sám. S námi ho našel za 2 týdny."
"Na prohlídce jsem si všiml 3 věcí, které by vás stály 200 tisíc. Tady jsou:"
"Kupujete první nemovitost? 10 kroků, které vám ušetří nervy a peníze:"

TRH:
"Průměrný byt 2+kk v Plzni stojí 4,1 mil. Před rokem to bylo 3,8 mil."
"V Plzni se letos prodalo o 15 % více bytů než loni. Co to znamená pro vás:"
"Bory, Černice, Sylván — kde v Plzni rostou ceny nejrychleji?"

BEHIND THE SCENES:
"Takhle vypadá příprava bytu k prodeji — before/after za 2 dny:"
"Dnes jsme měli 8 prohlídek jednoho bytu. Tady je, proč to funguje:"
"Co všechno děláme, než se nemovitost objeví na Sreality:"', true),

-- PLATFORM: FACEBOOK
('15a83244-d502-4407-8f90-c761170b1d9d', 'platform_facebook_ptf', 'platform_rules', 'Facebook pravidla PTF reality',
'FACEBOOK — PTF REALITY:

FORMÁT:
- Delší posty (800-2000 znaků)
- Fotky nemovitostí vždy profesionální
- Before/after posty = vysoký engagement
- Video prohlídky = vysoký dosah

TYPY POSTŮ:
1. VZDĚLÁVACÍ (25 %): Tipy, návody, checklisty
2. CASE STUDY (25 %): Úspěšný prodej/koupě s čísly
3. NABÍDKA (20 %): Nemovitosti v prodeji (fotky + popis + cena)
4. BEHIND THE SCENES (15 %): Příprava, prohlídky, tým
5. TRH (15 %): Data, trendy, novinky z Plzně

PRAVIDLA:
- Odkaz do komentáře (ne do textu)
- Fotky vždy profesionální (ne mobil)
- Otázka na konci = komentáře = dosah
- Žádné hashtagy v textu', true),

-- PLATFORM: INSTAGRAM
('15a83244-d502-4407-8f90-c761170b1d9d', 'platform_instagram_ptf', 'platform_rules', 'Instagram pravidla PTF reality',
'INSTAGRAM — PTF REALITY:

VIZUÁLNÍ:
- Profesionální fotky nemovitostí = základ
- Carousel pro before/after a tipy (5-10 slidů)
- Reels pro video prohlídky a behind the scenes
- Stories pro denní behind the scenes

CAPTION:
1. HOOK (první řádek)
2. Krátké odstavce
3. CTA
4. Hashtagy (8-15)

HASHTAGY:
- #realityplzen #nemovitostiplzen #ptfreality #prodejbytu #kupbytu
- #plzen #plzensko #realitnitrh #investice #nemovitosti
- #homestaging #prohlídka #novybyt #realitnimaklér
- Mix: 3-4 niche + 3-4 střední + 2-3 lokální + 1-2 branded

PRAVIDLA:
- Odkaz v bio (ne v caption)
- Carousel > single image pro edukaci
- Reels: 15-60 sekund
- Stories: behind the scenes, ankety', true),

-- PLATFORM: LINKEDIN
('15a83244-d502-4407-8f90-c761170b1d9d', 'platform_linkedin_ptf', 'platform_rules', 'LinkedIn pravidla PTF reality',
'LINKEDIN — PTF REALITY:

FORMÁT:
- Profesionální tón (ale stále osobní)
- Data a analýzy trhu
- Case studies s čísly
- 1200-1800 znaků optimální

TYPY POSTŮ:
1. INSIGHT (30 %): Analýza trhu Plzeň, data, trendy
2. CASE STUDY (25 %): Úspěšné transakce s čísly
3. NETWORKING (20 %): Spolupráce, partneři, tým
4. EDUKACE (15 %): Investiční tipy, právní rady
5. NÁZOR (10 %): Komentář k trhu, legislativě

PRAVIDLA:
- NIKDY odkaz v těle postu
- Max 3 hashtagy
- Konkrétní čísla vždy
- Osobní hlas (ne korporátní)
- Reagovat na komentáře do 1 hodiny', true);
