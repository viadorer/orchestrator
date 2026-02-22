-- Pronájmy Plzeň - Taxonomie témat (dodatek, NEMAZŽE existující data)
-- UUID: c99fce94-ae19-4f6b-9777-6d2af28ff960
-- Spusť AŽ PO pronajmy-plzen-seed.sql

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

-- AUDIENCE
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'audience', 'Profil členů',
'Témata: Kdo hledá byt (věk, situace). Proč hledají. Jaké mají obavy. Priority (cena vs lokalita vs stav).', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'audience', 'Bolestivé body',
'Témata: Nejistota ceny. Strach ze smlouvy. Neznalost práv. Problémy s kaucí. Dlouhé hledání. Diskriminace.', true),

-- MARKET
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'market', 'Ceny a faktory',
'Témata: Rozdíly podle čtvrti. Rozdíly podle dispozice. Co ovlivňuje cenu. Jak poznat nadhodnocenou cenu.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'market', 'Lokality Plzně',
'Témata: Charakteristika čtvrtí. Pro koho je která vhodná. Dostupnost MHD. Infrastruktura. Bezpečnost.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'market', 'Dynamika trhu',
'Témata: Trendy růstu/poklesu. Poptávka vs nabídka. Rychlost pronájmu. Sezónnost. Vliv ekonomiky.', true),

-- LEGAL
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Nájemní smlouva',
'Témata: Povinné náležitosti. Doba určitá vs neurčitá. Nebezpečné klauzule. Předávací protokol.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Kauce',
'Témata: Maximální výše. Vrácení kauce. Oprávněné srážky. Jak vymáhat nevracenou kauce.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Práva nájemníka',
'Témata: Co může požadovat. Právo na opravu. Právo odmítnout vstup. Právo mít zvíře.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Výpověď',
'Témata: Jak dát výpověď. Výpovědní lhůty. Důvody pro výpověď. Předání bytu.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Opravy',
'Témata: Kdo platí drobné opravy. Kdo platí havárie. Jak nahlásit závadu. Když majitel nereaguje.', true),

-- PROCESS
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Hledání',
'Témata: Kde hledat. Jak rychle reagovat. První zpráva. Dokumenty. Příprava na prohlídku.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Prohlídka',
'Témata: Na co si dát pozor. Vlhkost. Spotřebiče. Voda a topení. Hluk. Fotodokumentace.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Nastěhování',
'Témata: Kontrola před podpisem. Předávací protokol. Hlášení pobytu. Přepis energií.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Vystěhování',
'Témata: Výpověď. Příprava na předání. Úklid. Fotodokumentace. Vrácení kauce.', true),

-- FAQ
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'faq', 'Domácí zvířata',
'Témata: Právo mít zvíře. Kdy může majitel zakázat. Jak vyjednat souhlas. Odpovědnost za škody.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'faq', 'Provize',
'Témata: Kdo platí provizi. Kdy je oprávněná. Jak se vyhnout neoprávněné provizi.', true),

-- USP
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'usp', 'Bez reklam',
'Témata: Proč nepublikujeme nabídky. Proč neodkazujeme na realitky. Zaměření na hodnotu.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'usp', 'Pohled nájemníka',
'Témata: Zaměření na práva nájemníků. Rozpoznání neférových praktik. Zákony lidskou řečí.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'usp', 'Lokální zaměření',
'Témata: Proč jsou lokální data důležitá. Specifika plzeňského trhu. Znalost čtvrtí.', true),

-- PRODUCT
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'product', 'Edukační obsah',
'Témata: Praktické tipy. Právní rady. Orientace na trhu. Vše zdarma bez reklam.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'product', 'Komunita',
'Témata: Sdílení zkušeností. Dotazy a odpovědi. Bezpečný prostor. Bez soudů.', true),

-- CASE_STUDY
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'case_study', 'Příběhy členů',
'Témata: Úspěšné vyřešení sporů. Jak se bránit neférové smlouvě. Vymáhání kauce. Hledání bytu s překážkami.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'case_study', 'Ponaučení z chyb',
'Témata: Co se může pokazit. Varovné signály. Jak se vyhnout problémům. Lessons learned.', true),

-- DATA
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'data', 'Statistiky trhu',
'Témata: Růst nájmů. Poměr poptávky/nabídky. Průměrná kauce. Doba hledání. Nejčastější spory.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'data', 'Benchmarky',
'Témata: Průměrné ceny per čtvrť. Průměrné ceny per dispozice. Srovnání s jinými městy. Trendy v čase.', true),

-- GENERAL
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'general', 'O komunitě',
'Témata: Kdo jsme. Proč vznikla. Hodnoty. Co nabízíme. Co nenabízíme.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'general', 'Jak používat',
'Témata: Co zde najdeš. Co zde nenajdeš. Jak se ptát. Pravidla komunity.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'general', 'Zdroje informací',
'Témata: Odkud čerpáme právní info. Disclaimer. Kdy konzultovat advokáta. Právní kliniky.', true);
