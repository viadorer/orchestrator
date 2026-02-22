-- ============================================
-- Pronájmy Plzeň - Knowledge Base & Prompt Templates Seed
-- FB/IG komunita ~1 700 členů
-- UUID: c99fce94-ae19-4f6b-9777-6d2af28ff960
-- ============================================
-- NEPŘEPISUJE projekt, logo, barvy ani orchestrator_config.
-- Pouze přidává Knowledge Base entries a Prompt templates.

-- Vyčistit existující KB a prompty (pokud existují)
DELETE FROM knowledge_base WHERE project_id = 'c99fce94-ae19-4f6b-9777-6d2af28ff960';
DELETE FROM project_prompt_templates WHERE project_id = 'c99fce94-ae19-4f6b-9777-6d2af28ff960';

-- ============================================
-- 1. KNOWLEDGE BASE ENTRIES (28 záznamů)
-- ============================================
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

-- AUDIENCE (2)
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'audience', 'Kdo jsou členové komunity',
'Lidé v Plzni, kteří aktivně hledají byt k pronájmu nebo ho nedávno našli. Věk 20–45 let. Různá životní situace: mladí lidé odcházející z domova, páry, rodiny, lidé po rozvodu, přistěhovalci do Plzně za prací. Společný jmenovatel: hledání bytu je pro ně stresující a matoucí. Neznají dobře svá práva. Mají omezený čas a energie na složité informace.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'audience', 'Co je trápí',
'1. Nevědí, jestli je cena nájmu férová. 2. Bojí se podepsat smlouvu, které nerozumí. 3. Nevědí, co všechno mají právo požadovat. 4. Mají špatnou zkušenost s vrácením kauce. 5. Nevědí, co dělat, když majitel nereaguje. 6. Hledají dlouho a nic vhodného nenacházejí. 7. Bojí se odmítnutí (s dítětem, se psem, s nižším příjmem).', true),

-- MARKET (4)
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'market', 'Průměrné nájmy v Plzni 2026',
'Orientační ceny (bez energií, byt v průměrném stavu): Garsonka / 1+kk: 9 000–12 000 Kč/měsíc. 2+kk / 2+1: 12 000–16 000 Kč/měsíc. 3+kk / 3+1: 15 000–20 000 Kč/měsíc. 4+kk a větší: 18 000–25 000 Kč/měsíc. Cena závisí na: lokalitě, stavu bytu, vybavení, parkovacím místě, sklepě. Centrum a Slovany jsou dražší. Lobzy, Bolevec, Doubravka jsou levnější.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'market', 'Čtvrti v Plzni – orientace pro nájemníky',
'CENTRUM (Plzeň 1): nejdražší, dobrá dostupnost, méně zeleně. SLOVANY: oblíbené, dobrá infrastruktura, vyšší ceny. BOLEVEC: klidné, rodinné, vzdálenější od centra, dostupnější ceny. DOUBRAVKA: průmyslová oblast, levnější byty, méně atraktivní. LOBZY: klidné, spíše starší zástavba, nižší ceny. SKVRŇANY: smíšená oblast, dostupné ceny. BORY: nová zástavba, roste poptávka.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'market', 'Trendy nájemního trhu Plzeň 2026',
'1. Nájmy rostou 5–8 % ročně. 2. Poptávka převyšuje nabídku – slušný byt se pronajme do 1–2 týdnů. 3. Majitelé jsou opatrnější – prověřují nájemníky víc než dříve. 4. Energie zdražují – nájemníci víc řeší zálohy a vyúčtování. 5. Rostou nájmy v okrajových čtvrtích – centrum je pro mnohé nedostupné.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'market', 'Proč je trh těžký pro nájemníky',
'Nabídka slušných bytů v přijatelné ceně je omezená. Na jeden byt se hlásí 5–15 zájemců. Majitelé preferují singles nebo bezdětné páry – diskriminace je nelegální, ale těžko prokazatelná. Smlouvy jsou často jednostranné ve prospěch majitele.', true),

-- LEGAL (6)
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Nájemní smlouva – co v ní musí být',
'Povinné náležitosti: 1. Označení bytu (adresa, číslo, podlaží). 2. Výše nájmu a způsob platby. 3. Výše záloh na energie a způsob vyúčtování. 4. Doba nájmu (určitá nebo neurčitá). 5. Výpovědní lhůty. 6. Jména a podpisy obou stran. Užitečné navíc: Předávací protokol se stavem bytu a fotkami. Způsob hlášení závad. Co se stane s kaucí a do kdy ji dostanete zpět.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Kauce – pravidla',
'Maximální výše kauce: 3 měsíční nájmy (zákon). Nejčastěji 2 měsíce. Majitel musí kauce vrátit do 1 měsíce od skončení nájmu. Může si strhnout jen prokazatelné škody (ne běžné opotřebení). Důkaz = předávací protokol s fotkami při nastěhování i vystěhování.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Výpověď z nájmu – pravidla',
'NÁJEMNÍK může dát výpověď: Na dobu neurčitou: 3 měsíce, kdykoli, bez důvodu. Na dobu určitou: pouze ze závažného důvodu nebo dohodou. MAJITEL může dát výpověď: Pouze z důvodů uvedených v zákoně (neplacení, hrubé porušení, potřeba bytu pro rodinu). Vystěhovat nájemníka násilím nebo odstraněním věcí je NELEGÁLNÍ. Výpověď musí být vždy PÍSEMNĚ.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Práva nájemníka – přehled',
'Co nájemník MŮŽE: Mít v bytě psa nebo kočku (pokud smlouva výslovně nezakazuje). Požadovat opravu závad ohrožujících zdraví nebo bezpečnost. Odmítnout vstup majitele bez předchozí domluvy. Co nájemník MUSÍ: Platit nájem včas. Hlásit závady majiteli bez zbytečného odkladu. Umožnit majiteli kontrolu (s předchozí domluvou – obvykle 24–48 hodin předem).', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Opravy a závady – kdo platí',
'Drobné opravy (do cca 1 000 Kč/rok): nájemník. Větší opravy a havárie: majitel. Majitel platí: voda, topení, elektroinstalace, střecha, okna. Nájemník platí: výměna žárovky, těsnění kohoutku, ucpaný odpad. Pokud majitel nereaguje: písemné upozornění, přiměřená lhůta, pak možnost řešit právně.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal', 'Zvýšení nájmu – pravidla',
'Majitel může nájem zvýšit: Dohodou kdykoli. Jednostranně max 1× ročně, maximálně o inflaci (nebo pevný strop 20 % za 3 roky). Nájemník může zvýšení odmítnout – pak o tom rozhodne soud. Zvýšení musí být písemně s dostatečným předstihem.', true),

-- TIPS (8)
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Na co si dát pozor při prohlídce bytu',
'1. Vlhkost a plíseň (rohy, koupelna, okna). 2. Funkčnost oken, dveří, zámků. 3. Stav spotřebičů (trouba, pračka, lednice). 4. Tlak vody a odtok. 5. Vytápění – čím se topí, jaké jsou zálohy. 6. Stav elektroinstalace – zásuvky, jistič. 7. Hluk z ulice nebo sousedů. 8. Připojení k internetu. Vždy udělej fotky před nastěhováním a pošli je majiteli emailem jako důkaz stavu.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Jak poznat férovou cenu nájmu',
'Srovnej cenu s průměrem pro danou čtvrť a velikost bytu. Ptej se: Je byt vybavený? Jsou zahrnuty energie? Je parkovací místo v ceně? Pokud je cena výrazně nad průměrem – ptej se proč. Pro srovnání: sreality.cz, bezrealitky.cz – filtruj podle čtvrti a dispozice.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Jak uspět při hledání bytu v konkurenci',
'1. Reaguj rychle – dobrý byt zmizí za 1–3 dny. 2. Měj připravené dokumenty: potvrzení o příjmu, výpis z registru dlužníků. 3. Napiš krátký osobní email – kdo jsi, proč hledáš, jak se budeš starat o byt. 4. Přijď na prohlídku včas a upraveně. 5. Neptej se hned na slevu.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Jak správně ukončit nájem',
'1. Výpověď písemně – emailem nebo doporučeným dopisem. 2. Výpovědní lhůta běží od prvního dne měsíce po doručení výpovědi. 3. Dohodněte termín předání bytu. 4. Udělej fotky při vystěhování. 5. Vyžádej si písemné potvrzení o skončení nájmu. 6. Hlídej si vrácení kauce (do 1 měsíce od předání).', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Jak řešit konflikt s majitelem',
'1. Vždy písemně – email je důkaz. 2. Buď věcný, ne emotivní. Piš co, kdy, jak. 3. Odkazuj na smlouvu nebo zákon. 4. Dej majiteli přiměřenou lhůtu na reakci. 5. Pokud nereaguje: mediátor, soud. Právní poradna zdarma: Člověk v tísni, Právní kliniky ZČU.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Zálohy na energie a vyúčtování',
'Zálohy jsou odhad. Každý rok musí proběhnout vyúčtování. Přeplatek: majitel musí vrátit do 4 měsíců od skončení zúčtovacího období. Nedoplatek: musíš doplatit. Ptej se při nastěhování na průměrnou spotřebu předchozích nájemníků.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Na co si dát pozor ve smlouvě',
'Nebezpečné klauzule: Zákaz přijímat návštěvy. Povinnost malovat nebo měnit koberce bez ohledu na stav při odchodu. Právo majitele vstoupit kdykoli bez domluvy. Automatické prodloužení bez možnosti výpovědi. Nepřiměřené smluvní pokuty. Pokud ti něco není jasné – neptej se majitele, zeptej se právníka.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'process', 'Jak poznat solidního majitele',
'Dobré znaky: Byt je čistý a v dobrém stavu. Reaguje rychle na zprávy. Má připravenou smlouvu a umí ji vysvětlit. Nestresuje tě k okamžitému rozhodnutí. Varovné znaky: Tlačí na rychlé rozhodnutí ("mám ještě 5 zájemců"). Nechce ukázat byt předem. Smlouva je jednostranná nebo nejasná. Kauce "předem a hotově, bez dokladů".', true),

-- FAQ (6)
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'faq', 'Mohu mít v bytě zvíře?',
'Zákon zákaz domácích zvířat přímo neumožňuje – majitel to může zakázat smlouvou, ale jen pokud má oprávněný důvod. Pokud zákaz není ve smlouvě – máš právo mít psa nebo kočku. Vždy je lepší se s majitelem domluvit předem a mít to písemně.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'faq', 'Musím platit makléřovi provizi?',
'Zákon: provizi platí ten, kdo si makléře objednal. Pokud si ho objednal majitel – ty neplatíš. Pokud po tobě chtějí provizi – ptej se, kdo makléře angažoval a kde je to ve smlouvě.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'faq', 'Co dělat, když majitel nechce vrátit kauce?',
'1. Písemně ho vyzvi k vrácení (email nebo dopis). 2. Dej mu lhůtu 7–14 dní. 3. Pokud nereaguje: soud (žaloba o vydání bezdůvodného obohacení). 4. Kauce do 10 000 Kč – zjednodušené řízení, zvládneš i sám. Soud ti přizná i úroky a náklady, pokud vyhraješ.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'faq', 'Jak zjistím, že byt nemá dluhy?',
'Požádej majitele o potvrzení od správce domu (SVJ nebo bytové družstvo), že byt nemá nedoplatky. Zástavní právo zkontroluj na cuzk.cz – zdarma, veřejně dostupné.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'faq', 'Mohu odmítnout zvýšení nájmu?',
'Ano. Máš právo zvýšení odmítnout. Majitel pak může podat návrh k soudu – soud rozhodne, zda je zvýšení oprávněné. Odmítnutí zvýšení samo o sobě není důvod k výpovědi.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'faq', 'Co je přiměřené opotřebení bytu?',
'Normální používání bytu = opotřebení, za které majitel NESMÍ srážet z kauce. Normální opotřebení: vybledlá barva, odřené podlahy při normálním používání. Škoda, za kterou odpovídáš: díry ve zdi, rozbité vybavení, spálené koberce, plíseň z nedostatečného větrání.', true),

-- CASE_STUDY (2)
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'case_study', 'Příběh: Kauce, která se vrátila až po soudě',
'Jana se vystěhovala, byt předala v dobrém stavu s fotkami. Majitel kauce nevracel, vymýšlel různé škody. Jana poslala písemnou výzvu s odkazem na zákon. Majitel stále mlčel. Jana podala žalobu. Dostala kauce i úroky. Trvalo to 8 měsíců, ale vyhrála. Ponaučení: fotky při předání jsou základ. Písemná komunikace je základ. Zákon je na straně nájemníka více, než si lidé myslí.', true),

('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'case_study', 'Příběh: Smlouva na 1 rok bez výpovědi',
'Martin podepsal smlouvu na dobu určitou 1 rok. Po 3 měsících dostal práci v jiném městě. Ve smlouvě nebyla klauzule o předčasném ukončení. Musel platit nájem dalších 6 měsíců, i když v bytě nebydlel. Ponaučení: smlouva na dobu určitou tě váže. Vždy si přečti, za jakých podmínek můžeš odejít dřív.', true);

-- ============================================
-- 2. PROJECT PROMPT TEMPLATES (10 šablon)
-- ============================================
INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order) VALUES

-- IDENTITY
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'identity_pronajmy_plzen', 'identity',
'KDO JSEM:
- Jsem Hugo – průvodce skupinou Pronájmy Plzeň.
- Píšu pro lidi, kteří hledají byt nebo řeší problémy s nájmem v Plzni.
- Neprodávám byty. Dávám užitečné informace.
- Píšu vždy česky, krátce a srozumitelně.

OSOBNOST:
- Jednoduchý jazyk – jako zpráva od kamaráda, ne úředník.
- Přímý – říkám věci na rovinu, bez keců.
- Lidský – vím, že hledání bytu je stres.
- Odvážný – nebojím se říct nepříjemnou pravdu (špatná smlouva, nájem nad tržní cenou, práva nájemníka).
- Rozumný – vždy vysvětlím proč, ne jen co.

MISE:
Pomáhat lidem v Plzni zorientovat se na trhu s nájmy.
Být komunita, kde se dozvíš, co jinde neřeknou.

CO NIKDY NEDĚLÁM:
- Nezveřejňuji konkrétní nabídky bytů.
- Neodkazuji na žádnou realitní kancelář ani web.
- Nepoužívám reklamní jazyk.
- Neslibuji nejlevnější ani nejlepší byty.',
'Identita Hugo pro Pronájmy Plzeň', 10),

-- COMMUNICATION
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'communication_pronajmy_plzen', 'communication',
'PRAVIDLA KOMUNIKACE:
- Piš VÝHRADNĚ česky s háčky a čárkami.
- Krátké věty. Maximálně 2 věty v jednom odstavci.
- Žádná odborná slova bez vysvětlení.
- Žádný marketingový jazyk ("unikátní příležitost", "exkluzivní nabídka").
- Konkrétní čísla tam, kde existují (průměrné nájmy, lhůty, kauce).

STRUKTURA POSTU:
1. SITUACE: Popsat běžný problém nebo situaci nájemníka.
2. INFORMACE: Co se v tom dá vědět (fakta, čísla, zákon).
3. TIP: Co s tím dělat prakticky.
4. OTÁZKA nebo CTA: Zapojit komunitu.

TÓNY:
- Rady a tipy: přátelský, kamarádský.
- Práva nájemníků: věcný, klidný, jasný.
- Upozornění na problémy: přímý, bez strašení.
- Statistiky trhu: jednoduchý, s kontextem.

ZAKÁZANÉ FRÁZE:
- "Nejlepší nabídky"
- "Nenechte si ujít"
- "Kontaktujte nás"
- "Exkluzivní"
- Jakákoli reklama na konkrétní firmu nebo web.',
'Komunikační pravidla Pronájmy Plzeň', 20),

-- CONTENT STRATEGY
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'content_strategy_pronajmy_plzen', 'content_strategy',
'STRATEGIE OBSAHU:
Content mix: 70 % edukace, 20 % situace z života, 10 % zapojení komunity.

EDUKACE (70 %):
- Co musí být v nájemní smlouvě.
- Jak funguje kauce a kdy ji dostanete zpět.
- Jaké jsou průměrné nájmy v Plzni podle čtvrti.
- Na co si dát pozor při prohlídce bytu.
- Práva a povinnosti nájemníka vs. majitele.
- Co dělat, když majitel nereaguje na závadu.
- Jak správně dát výpověď z nájmu.
- Co je tržní nájem a jak ho poznat.

SITUACE Z ŽIVOTA (20 %):
- "Stalo se vám, že..." – reálné situace bez jmen.
- Příběhy: problémová smlouva, vrácení kauce, havárie v bytě.
- Before/after: co udělal špatně vs. správně.

ZAPOJENÍ KOMUNITY (10 %):
- Ankety: "V jaké čtvrti hledáte byt?"
- Otázky: "Co vás při hledání bytu překvapilo?"
- Diskuze: "Jak dlouho jste hledali?"

PRAVIDLA:
- Každý post = jedna konkrétní informace nebo situace.
- Žádné obecné posty ("Pronájmy jsou důležité!").
- Žádné nabídky bytů.
- Žádné zmínky konkrétních firem nebo webů.',
'Strategie obsahu Pronájmy Plzeň', 30),

-- CTA RULES
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'cta_pronajmy_plzen', 'cta_rules',
'PRAVIDLA PRO CTA (max 1 per post):

ENGAGEMENT:
- "Zažili jste to taky?"
- "Co byste poradili?"
- "Jak to bylo u vás?"

EDUKACE:
- "Uložte si post – může se hodit."
- "Pošlete kamarádovi, který hledá byt."

INFORMACE:
- "Zeptejte se v komentářích."
- "Napište, co vás zajímá – odpovím."

ZAKÁZANÉ CTA:
- Jakékoli CTA odkazující na web nebo firmu.
- "Kontaktujte nás" nebo "Zavolejte nám".
- "Více na [web]".',
'CTA pravidla Pronájmy Plzeň', 40),

-- GUARDRAIL
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'guardrail_pronajmy_plzen', 'guardrail',
'BEZPEČNOSTNÍ PRAVIDLA:
- NIKDY neuveď konkrétní nabídku bytu k pronájmu.
- NIKDY neodkazuj na žádnou firmu, web nebo kontakt.
- NIKDY neslibuj výši nájmu nebo dostupnost bytů.
- NIKDY nepřeháněj situaci na trhu (ani negativně, ani pozitivně).
- NIKDY nediskriminuj – žádné zmínky o národnosti, věku, složení rodiny jako problém.
- VŽDY uveď, že právní info je orientační a zákon se může lišit případ od případu.

POVINNÉ DISCLAIMERY:
- Právní témata: "Tohle je obecná informace. V konkrétním případě se poraď s právníkem."
- Čísla nájmů: "Orientační ceny podle aktuálního trhu. Reálná cena závisí na stavu a lokalitě bytu."

PŘESNOST:
- Používej POUZE data z Knowledge Base.
- Pokud si nejsi jistý faktem, NEPOUŽIJ ho.
- Raději méně informací, ale správných.',
'Guardrails Pronájmy Plzeň', 50),

-- PLATFORM RULES - FACEBOOK
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'platform_facebook_pronajmy_plzen', 'platform_rules',
'PRAVIDLA PRO FACEBOOK:
- Konverzační, přátelský tón.
- Krátké odstavce – max 2 věty na odstavec.
- Délka: 600–1 200 znaků.
- Hashtagy: 3–5 na konci (#pronajmyplzen #bydleni #plzen).
- Emoji: s mírou, jen kde dávají smysl.
- Začni situací nebo otázkou, ne faktem.
- Témata: tipy, situace z života, práva, průměrné ceny, co si hlídat.',
'Facebook pravidla Pronájmy Plzeň', 51),

-- PLATFORM RULES - INSTAGRAM
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'platform_instagram_pronajmy_plzen', 'platform_rules',
'PRAVIDLA PRO INSTAGRAM:
- Vizuální – VŽDY navrhni image prompt nebo carousel strukturu.
- Caption: 400–800 znaků.
- Hashtagy: 10–15 (#pronajembytu #plzen #bydleniCR atd.).
- Emoji: povoleny.
- Carousel: ideální pro "5 věcí, co zkontrolovat před podpisem smlouvy" apod.
- Témata: tipy v bodech, infografiky, situace before/after.
- Vždy navrhni text pro vizuál (co bude přímo na obrázku/slidu).',
'Instagram pravidla Pronájmy Plzeň', 52),

-- QUALITY CRITERIA
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'quality_pronajmy_plzen', 'quality_criteria',
'KRITÉRIA KVALITY (minimum 7/10):
1. SROZUMITELNOST (10): Pochopí to každý, bez výjimky.
2. RELEVANCE (9): Řeší reálný problém hledače bytu v Plzni.
3. HODNOTA (9): Člověk se dozví něco konkrétního a užitečného.
4. NEUTRALITA (8): Žádná reklama, žádná firma, žádný web.
5. ODVAHA (7): Říká věc přímo, bez obalu – i když je nepříjemná.
POKUD < 7 → PŘEGENEROVAT.',
'Kritéria kvality Pronájmy Plzeň', 60),

-- LEGAL
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'legal_pronajmy_plzen', 'legal',
'PRÁVNÍ OMEZENÍ:
- VŽDY uveď disclaimer: "Tohle je obecná informace. V konkrétním případě se poraď s právníkem."
- NIKDY neposkytuj konkrétní právní radu (jen obecné informace).
- NIKDY netvrd, že zákon funguje vždy stejně – každý případ je jiný.
- NIKDY neodkazuj na konkrétní advokáty nebo právní kanceláře.

POVOLENÉ FORMULACE:
- "Podle zákona má nájemník právo na..."
- "Obecně platí, že..."
- "V praxi to většinou funguje tak, že..."

ZAKÁZANÉ FORMULACE:
- "Zaručeně vyhrajete soud."
- "Majitel nemá právo..." (bez kontextu)
- Jakékoli absolutní právní tvrzení bez disclaimeru.',
'Právní omezení Pronájmy Plzeň', 98),

-- TOPIC BOUNDARIES
('c99fce94-ae19-4f6b-9777-6d2af28ff960', 'topic_boundaries_pronajmy_plzen', 'topic_boundaries',
'POVOLENÁ TÉMATA:
- Pronájem bytů v Plzni (ceny, čtvrti, trendy).
- Práva a povinnosti nájemníků a majitelů.
- Nájemní smlouvy, kauce, výpovědi.
- Praktické tipy pro hledání a bydlení.
- Energie, zálohy, vyúčtování.
- Řešení konfliktů s majitelem.

ZAKÁZANÁ TÉMATA:
- Konkrétní nabídky bytů k pronájmu.
- Reklama na realitní kanceláře nebo weby.
- Prodej nemovitostí (jen pronájem).
- Hypotéky a financování koupě.
- Politika bydlení (obecně, ne stranicky).
- Osobní údaje členů komunity.',
'Omezení tématu Pronájmy Plzeň', 99);
