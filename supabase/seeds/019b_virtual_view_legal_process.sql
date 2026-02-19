-- ===========================================
-- Virtual View: Doplnění KB kategorií legal + process
-- ===========================================

-- ---- LEGAL ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'legal', 'Smluvni podminky a dodani',
$$Virtual View poskytuje sluzby na zaklade objednavky nebo smlouvy o dilo.

DODACI PODMINKY:
- Sken bytu do 100 m2: dodani 3D modelu do 3-5 pracovnich dnu
- Vetsi objekty (komercni, prumyslove): individualni harmonogram
- Vystup: webovy odkaz na 3D prohlidku, embedding kod, pudorysy (PDF)
- Profesionalni exporty (E57, OBJ, RVT, DWG): na objednavku jako priplatek

VLASTNICTVI A LICENCE:
- Klient ziskava licenci k uzivani 3D modelu pro sve ucely
- Hosting 3D modelu na platforme Matterport (zahrnuto v cene po dobu 12 mesicu)
- Po uplynuti hostingu: moznost prodlouzeni nebo export dat

REKLAMACE:
- Nespokojenost s kvalitou skenu: bezplatne preskenovani
- Technicke problemy s modelem: oprava do 48 hodin$$, true);

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'legal', 'GDPR a ochrana osobnich udaju',
$$Virtual View zpracovava osobni udaje v souladu s GDPR:

JAKE UDAJE SBIRAME:
- Kontaktni udaje klienta (jmeno, email, telefon)
- Adresa skenovane nemovitosti
- Fotografie a 3D data interieru/exterieru

UCEL ZPRACOVANI:
- Vytvoreni a dodani 3D modelu
- Fakturace a komunikace
- Marketing (pouze se souhlasem)

SOUHLAS:
- Klient podepisuje souhlas pred skenovanim
- U pronajatych prostor: souhlas vlastnika nebo spravce
- Klient muze pozadat o smazani dat kdykoli

BEZPECNOST:
- Data sifrovana, ulozena v EU (Matterport cloud)
- Pristup pouze opravnene osoby
- Zadne sdileni s tretimi stranami bez souhlasu klienta$$, true);

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'legal', 'Autorska prava a uziti 3D modelu',
$$AUTORSKA PRAVA:
- 3D model je dilem ve smyslu autorskeho zakona
- Virtual View vytvari dilo na objednavku — klient ziskava licenci k uziti
- Klient muze model pouzit pro: prodej, pronajem, marketing, dokumentaci, archivaci
- Virtual View si vyhrazuje pravo pouzit anonymizovane ukazky v portfoliu (pokud klient neodmitne)

OMEZENI:
- Klient nesmi model prodavat jako samostatny produkt tretim stranam
- Klient nesmi model upravovat zpusobem, ktery by zkreslit skutecny stav nemovitosti
- Pri pouziti v mediich: doporuceno uvest zdroj (Virtual View / virtualview.cz)$$, true);

-- ---- PROCESS ----
INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'process', 'Jak probiha 3D skenovani',
$$Proces spoluprace s Virtual View od objednavky po dodani:

1. KONZULTACE (zdarma)
   - Klient popise nemovitost (typ, velikost, ucel skenu)
   - Virtual View navrhne rozsah a cenovou nabidku
   - Dohodnuti terminu skenovani

2. PRIPRAVA PROSTORU
   - Uklidit a zpristupnit vsechny mistnosti
   - Zapnout svetla, otevrit zaluzie
   - Odstranit osobni predmety (volitelne, dle ucelu)
   - U komercnich prostor: zajistit pristup a povoleni

3. SKENOVANI NA MISTE
   - Byt do 100 m2: 30-45 minut
   - Dum 200 m2: 60-90 minut
   - Velky komercni objekt: 2-4 hodiny
   - Technik pracuje samostatne, klient nemusi byt pritomen (po zpristupneni)

4. ZPRACOVANI
   - Upload dat do Matterport cloudu
   - Automaticke generovani 3D modelu: 24-48 hodin
   - Pridani Mattertags, pudorysu, mereni (dle objednavky)

5. DODANI
   - Webovy odkaz na 3D prohlidku
   - Embedding kod pro vlozeni na web
   - Pudorysy v PDF
   - Profesionalni exporty (E57, OBJ, RVT) na objednavku
   - Celkem: 3-5 pracovnich dnu od skenovani$$, true);

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'process', 'Jak vyuzit 3D prohlidku po dodani',
$$Po obdrzeni 3D modelu od Virtual View — co dal:

PRODAVAJICI NEMOVITOST:
- Vlozit odkaz do inzeratu na Sreality, Bezrealitky, Idealista
- Sdilet na socialnich sitich
- Poslat zajemcum pred fyzickou prohlidkou (predfiltr)

DEVELOPER / INVESTOR:
- Embedding na projektovy web
- Prezentace pro zahranicni investory
- Podklad pro vizualizace a marketing

HOTEL / HOSPITALITY:
- Vlozit na web hotelu (pokoje, wellness, konferencni saly)
- Propojit s rezervacnim systemem
- Pouzit pro event koordinatory

PRUMYSL / STAVEBNICTVI:
- Export do BIM/Revit/AutoCAD
- Skoleni novych zamestnancu
- Dokumentace pro udrzbu a inspekce

POJISTOVNA / DOKUMENTACE:
- Archivace stavu pred rekonstrukci
- Podklad pro pojistnou udalost
- Dedicke rizeni — doklad o stavu nemovitosti$$, true);

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES
('17443720-68b7-460a-859e-28b1b5d66913', 'process', 'Objednavka a cenik',
$$Jak objednat 3D sken od Virtual View:

1. KONTAKT: virtualview.cz — formular, email nebo telefon
2. KONZULTACE: Bezplatna, nezavazna — popis nemovitosti a ucelu
3. CENOVA NABIDKA: Do 24 hodin
4. TERMIN: Skenovani obvykle do 3-5 dnu od objednavky

ORIENTACNI CENIK:
- Byt do 50 m2: od 2 450 CZK
- Byt 51-100 m2: od 3 500 CZK
- Dum 101-200 m2: od 5 500 CZK
- Komercni prostor: individualni kalkulace
- Profesionalni exporty (BIM/CAD): priplatek dle rozsahu

V CENE JE ZAHRNUTO:
- Skenovani na miste
- Zpracovani 3D modelu
- Webovy odkaz + embedding kod
- Pudorysy v PDF
- Hosting na 12 mesicu

PLATBA:
- Faktura se splatnosti 14 dnu
- Moznost platby predem pro soukrome osoby$$, true);
