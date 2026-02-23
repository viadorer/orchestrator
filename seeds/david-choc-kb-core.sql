-- ============================================
-- David Choc - Knowledge Base Core (část 1/3)
-- Osobní brand: realitní makléř, odhadce, investor
-- UUID: 2d6a84eb-fb59-416e-bcec-e2a39cee1181
-- Web: davidchoc.cz
-- Platformy: Facebook, Instagram, LinkedIn
-- ============================================

DELETE FROM knowledge_base WHERE project_id = '2d6a84eb-fb59-416e-bcec-e2a39cee1181';
DELETE FROM project_prompt_templates WHERE project_id = '2d6a84eb-fb59-416e-bcec-e2a39cee1181';

-- ============================================
-- AUDIENCE + PERSONAL BRAND (9)
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'audience', 'Kdo mě sleduje',
'Lidé z Plzně a okolí řešící nemovitosti — kupují, prodávají, pronajímají nebo investují. Věk 28-55. Mix: prvokupující (nervózní, potřebují průvodce), investoři (chtějí čísla a strategii), prodávající (chtějí nejlepší cenu), pronajímatelé (řeší správu). Hledají někoho, komu můžou věřit.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'audience', 'Co lidi trápí',
'1. Nevědí, kolik nemovitost stojí. 2. Bojí se špatného rozhodnutí. 3. Nerozumí hypotékám. 4. Nevědí, jestli je teď doba investovat. 5. Špatná zkušenost s makléřem. 6. Bojí se skrytých vad. 7. Neví, jak pronajímat. 8. Řeší dědictví. 9. Chtějí pasivní příjem, ale nevědí jak.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'audience', 'Proč mi věří',
'Jsem z Plzně, znám lokální trh. Mluvím srozumitelně. Ukazuji reálná čísla, ne sliby. Mám vlastní investiční portfolio — dělám to, co radím. Jsem transparentní i o chybách. Moje projekty (odhad.online, PTF, Quadrum) dokazují praxi, ne teorii.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'audience', 'Jak se mnou komunikovat',
'Tón: osobní, přátelský, přímý. Jako kamarád, který se vyzná v nemovitostech. Žádné formální fráze. Říkám věci na rovinu — i nepříjemné. Používám já a ty/vy. Sdílím vlastní zkušenosti. Humor ano, ale ne na úkor odbornosti. Čísla vždy. Příklady z praxe vždy.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'general', 'Kdo jsem',
'David Choc — realitní makléř, odhadce nemovitostí a investor z Plzně. Pomáhám lidem s prodejem, koupí, pronájmem a oceňováním nemovitostí. Sám investuji do nemovitostí a buduju projekty, které pomáhají ostatním dělat lepší rozhodnutí. Web: davidchoc.cz.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'general', 'Moje filozofie',
'Nemovitosti nejsou jen čísla — jsou to domovy, investice, životní rozhodnutí. Každý si zaslouží férového průvodce, který řekne pravdu. Ne to, co chce slyšet, ale to, co potřebuje vědět. Transparentnost, data a osobní přístup.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'general', 'Proč dělám to, co dělám',
'Začal jsem v realitách, protože mě fascinoval trh. Zjistil jsem, že většina lidí dělá rozhodnutí za miliony na základě emocí, ne dat. Proto jsem založil odhad.online, proto píšu, proto sdílím. Chci, aby lidi věděli, co kupují, za kolik a proč.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'general', 'Můj příběh s investicemi',
'Svůj první investiční byt jsem koupil v Plzni. Udělal jsem chyby — špatný odhad nákladů na rekonstrukci, podcenění správy. Ale naučil jsem se. Dnes mám portfolio nájemních nemovitostí a vím přesně, co funguje a co ne. Tyhle zkušenosti sdílím.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'general', 'Moje projekty — přehled',
'PTF reality (ptf.cz) — kompletní realitní služby. Quadrum (quadrum.cz) — finanční poradenství + reality. odhad.online — online odhad tržní ceny. InvestCzech (investczech.cz) — investiční poradenství. Česko sobě (cesko-sobe.cz) — finanční soběstačnost. Problémový nájemník (problemovynajemnik.cz) — pomoc majitelům. Pronájmy Plzeň — komunita nájemníků. ChciBýtMilionářem (chcibytmlionarem.cz) — vzdělávací platforma.', true),

-- ============================================
-- REALITY - PRODEJ (8)
-- ============================================
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Jak prodat nemovitost za nejlepší cenu',
'Správné ocenění (ne přestřelení). Home staging — první dojem prodává. Profesionální fotky a video. Právní příprava (LV, nabývací titul, věcná břemena). Timing — kdy prodat. Vyjednávání — jak reagovat na nabídky. Daňové dopady prodeje.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Nejčastější chyby při prodeji',
'Přestřelená cena (leží na trhu měsíce). Špatné fotky. Žádný home staging. Prodej bez makléře bez zkušeností. Podcenění právní stránky. Emocionální vyjednávání. Neznalost daní. Špatný timing (zima vs jaro).', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'data', 'Kolik stojí prodej nemovitosti',
'Provize makléře 2-5 %. Daň z příjmu (osvobození po 5/10 letech). Právní služby 5-15 tis. PENB 3-8 tis. Home staging 10-30 tis. Fotky a video 5-15 tis. Celkem: 3-7 % z prodejní ceny.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Home staging — proč funguje',
'Zvyšuje prodejní cenu o 5-15 %. Zkracuje dobu prodeje o 30-50 %. Stojí 10-30 tis., vrátí se mnohonásobně. Základy: declutter, neutrální barvy, světlo, čistota. Koupelna a kuchyň klíčové.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Jak vybrat správného makléře',
'Lokální znalost. Reference a recenze. Marketingový plán (ne jen Sreality). Komunikace. Provize vs. hodnota. Exkluzivita vs. neexkluzivita. Na co se ptát. Varovné signály.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'legal', 'Právní stránka prodeje',
'Kupní smlouva — co musí obsahovat. Úschova kupní ceny (advokátní, notářská, bankovní). Vklad do katastru. Předkupní právo. Věcná břemena a zástavní práva. Daň z příjmu při prodeji. Prohlášení prodávajícího o stavu.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'data', 'Realitní trh Plzeň 2026',
'Průměrné ceny bytů: 1+kk 2,5-3,5 mil., 2+kk 3,5-4,5 mil., 3+kk 4,5-6 mil. Domy: 5-12 mil. Růst 3-6 %/rok. Poptávka převyšuje nabídku. Nejžádanější: Slovany, centrum, Bory. Doba prodeje: 2-8 týdnů.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'data', 'Realitní trh ČR 2026',
'Průměrná cena bytu ČR: 85-95 tis./m2. Praha: 130-160 tis./m2. Brno: 90-110. Plzeň: 70-85. Hypoteční sazby: 4,5-5,5 %. Počet transakcí roste. Vliv úrokových sazeb na ceny.', true),

-- ============================================
-- REALITY - KOUPĚ (8)
-- ============================================
('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Jak koupit první nemovitost',
'Rozpočet (ne jen cena, ale poplatky, rekonstrukce, rezerva). Hypotéka — kolik dostanu. Lokace — doprava, vybavenost, plány rozvoje. Prohlídka. Právní kontrola (LV, věcná břemena). Vyjednávání. Rezervační smlouva. Kupní smlouva a úschova.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Na co se zaměřit při prohlídce',
'Nosné konstrukce (praskliny, vlhkost). Okna a izolace. Elektroinstalace. Rozvody vody. Topení (typ, stáří, náklady). SVJ (fond oprav, investice). Hluk. Parkování. Orientace. Energetická náročnost.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Skryté vady nemovitosti',
'Vlhkost a plíseň. Azbest (starší stavby). Radon. Statické problémy. Špatná elektroinstalace (hliník). Nelegální úpravy. Zatajené závady. Jak se bránit — znalecký posudek, prohlášení prodávajícího.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'legal', 'Právní kontrola před koupí',
'LV — zástavní práva, věcná břemena, předkupní práva, exekuce. Katastr — jak číst. Územní plán. SVJ — stanovy, fond oprav, zápisy. Stavební dokumentace. PENB.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Vyjednávání ceny nemovitosti',
'Kdy je prostor pro slevu (dlouho na trhu, vady, motivovaný prodávající). Kolik nabídnout pod cenu (5-15 %). Argumenty (znalecký posudek, opravy, srovnání). Kdy NEsmlouvat. Psychologie vyjednávání.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'data', 'Kolik stojí koupě navíc',
'Poplatky za hypotéku 0,5-1 %. Odhad pro banku 3-5 tis. Právní služby 10-20 tis. Stěhování 5-20 tis. Rekonstrukce. Fond oprav SVJ. Celkem: 3-8 % navíc k ceně.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Novostavba vs. starší byt',
'Novostavba: vyšší cena, nižší údržba, moderní dispozice, záruka. Starší: nižší cena, vyšší rekonstrukce, lepší lokace, charakter, riziko vad. Záleží na prioritách a rozpočtu.', true),

('2d6a84eb-fb59-416e-bcec-e2a39cee1181', 'process', 'Koupě v dražbě',
'Typy dražeb (dobrovolná, nedobrovolná, elektronická). Kde sledovat (portaldrazeb.cz). Prohlídka předem. Dražební jistota 10 %. Rizika (stav, nájemníci, právní komplikace). Úspora 10-30 %. Není pro začátečníky.', true);
