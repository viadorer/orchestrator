-- ============================================
-- Pronájmy Plzeň - Dodatek KB (chybějící kategorie)
-- UUID: c99fce94-ae19-4f6b-9777-6d2af28ff960
-- ============================================
-- Přidává záznamy v kategoriích: product, usp, data, general

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

-- PRODUCT (3) - Co komunita nabízí
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'product', 'Edukační obsah o pronájmech',
'Komunita Pronájmy Plzeň poskytuje ověřené informace o nájemním bydlení v Plzni. Praktické tipy, právní rady, průměrné ceny, orientace v čtvrtích. Vše zdarma, bez reklam na realitky. Cíl: pomoct lidem zorientovat se na trhu a znát svá práva.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'product', 'Komunita hledajících a nájemníků',
'Sdílení zkušeností mezi členy. Dotazy a odpovědi od lidí, kteří to zažili. Bez soudů, bez úsudků. Bezpečný prostor pro dotazy typu: "Je tato cena férová?" nebo "Jak jste řešili konflikt s majitelem?"', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'product', 'Orientace na trhu Plzeň',
'Aktuální přehled průměrných nájmů podle čtvrtí a dispozic. Trendy trhu (růst cen, poptávka vs nabídka). Informace o čtvrtích (Centrum, Slovany, Bolevec, Doubravka, Lobzy, Skvrňany, Bory). Pomáháme rozpoznat férovou cenu a vhodnou lokalitu.', true),

-- USP (4) - Konkurenční výhody komunity
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'usp', 'Žádné reklamy na byty ani realitky',
'Na rozdíl od běžných FB skupin o pronájmech, kde 90 % obsahu jsou inzeráty, my publikujeme POUZE edukační obsah. Žádné nabídky bytů. Žádné odkazy na realitky. Jen užitečné informace.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'usp', 'Zaměření na práva nájemníků',
'Většina zdrojů o pronájmech je psána z pohledu majitelů nebo realitek. My se díváme očima nájemníka. Co máš právo požadovat. Jak se bránit neférové smlouvě. Kdy můžeš odmítnout zvýšení nájmu. Kdy ti musí vrátit kauce.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'usp', 'Lokální data pro Plzeň',
'Nejsou to obecné rady "jak hledat byt v ČR". Jsou to konkrétní data pro Plzeň: průměrné ceny per čtvrť, trendy plzeňského trhu, specifika jednotlivých lokalit. Informace, které jinde nenajdeš.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'usp', 'Bez právnické hantýrky',
'Právní informace vysvětlené lidskou řečí. Ne paragrafy, ale "co to znamená v praxi". Příklady ze života. Konkrétní kroky, co dělat. Srozumitelné i pro lidi bez právního vzdělání.', true),

-- DATA (5) - Statistiky a fakta
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'data', 'Růst nájmů v Plzni 2020-2026',
'Nájmy v Plzni rostly průměrně 5-8 % ročně v období 2020-2026. Nejvyšší růst: Centrum a Slovany (8-10 % ročně). Nejnižší růst: Doubravka a Lobzy (3-5 % ročně). Inflace za stejné období: průměr 6 % ročně. Reálný růst nájmů tedy mírně převyšuje inflaci.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'data', 'Poměr poptávky a nabídky',
'Na jeden slušný byt v přijatelné ceně se hlásí průměrně 5-15 zájemců. Dobrý byt zmizí z trhu do 1-3 dnů. Nabídka bytů v Plzni roste pomaleji než poptávka (nová výstavba cca 200-300 bytů/rok, poptávka roste o 500-700 domácností/rok).', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'data', 'Průměrná kauce v Plzni',
'Nejčastější výše kauce: 2 měsíční nájmy (cca 70 % případů). 1 měsíční nájem: 20 % případů. 3 měsíční nájmy (zákonné maximum): 10 % případů. Průměrná doba vrácení kauce: 2-4 týdny (zákon říká max 1 měsíc).', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'data', 'Nejčastější důvody sporů',
'Top 3 důvody konfliktů mezi nájemníky a majiteli v Plzni: 1. Nevrácení kauce nebo srážky z kauce (45 % sporů). 2. Opravy a údržba – kdo platí (30 % sporů). 3. Zvýšení nájmu nebo energií (15 % sporů). Ostatní: hluk, domácí zvířata, předčasné ukončení (10 %).', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'data', 'Průměrná doba hledání bytu',
'Průměrná doba hledání bytu v Plzni: 3-6 týdnů. Singles a páry bez dětí: 2-4 týdny. Rodiny s dětmi: 6-10 týdnů. Lidé s domácími zvířaty: 8-12 týdnů. Faktory prodlužující hledání: nízký příjem, špatná bonita, specifické požadavky (přízemí, bezbariérový přístup).', true),

-- GENERAL (3) - Obecné informace
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'general', 'O komunitě Pronájmy Plzeň',
'Komunita Pronájmy Plzeň sdružuje cca 1 700 členů na Facebooku a Instagramu. Zaměření: edukace o nájemním bydlení v Plzni, práva nájemníků, orientace na trhu. Založeno 2024. Bez komerčních zájmů – neprodáváme byty, neodkazujeme na realitky.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'general', 'Zdroje právních informací',
'Právní informace v komunitě vycházejí z: Občanský zákoník (zákon č. 89/2012 Sb., §2201-2310 o nájmu bytu). Judikatura Nejvyššího soudu ČR. Konzultace s právními kliniky (ZČU Plzeň). DISCLAIMER: Informace slouží k edukaci, nenahrazují právní poradenství. V konkrétním případě konzultuj advokáta.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'general', 'Jak používat komunitu',
'Co zde najdeš: Tipy pro hledání bytu. Vysvětlení práv a povinností. Průměrné ceny a trendy trhu. Rady, jak řešit konflikty. Co zde NENAJDEŠ: Nabídky bytů k pronájmu. Reklamy na realitky. Odkazy na weby s byty. Doporučení konkrétních majitelů. Ptej se v komentářích – odpovíme nebo ti poradí ostatní členové.', true);
