-- ============================================
-- VitalSpace KB - FAQ & General kategorie
-- Doplnění chybějících kategorií
-- ============================================

INSERT INTO knowledge_base (project_id, category, title, content, is_active) VALUES

-- FAQ - Často kladené otázky
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Je ozonová sanitace bezpečná?',
'Ano, při dodržení protokolu je ozonová sanitace zcela bezpečná. Během sanitace nesmí být v prostoru lidé ani zvířata. Po ukončení cyklu a fázi rozpadu (120 minut) se ozon přirozeně rozloží na kyslík. Prostor je pak zcela bezpečný bez jakýchkoliv chemických reziduí.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Jak dlouho trvá ozonová sanitace?',
'Samotná ozonizace trvá 6-15 minut pro standardní místnost 100 m². Poté následuje fáze rozpadu ozonu (120 minut), kdy se O₃ přirozeně mění na O₂. Celková doba včetně větrání: cca 2,5-3 hodiny. Prostor lze pak okamžitě používat.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Poškodí ozon elektroniku nebo nábytek?',
'Ne. Ozon nepoškozuje elektroniku, nábytek ani textilie při správném použití. Zařízení OZON CLEANER jsou navržena pro bezpečnou sanitaci všech typů prostor včetně kanceláří s elektronikou. BOX model je speciálně určen pro dezinfekci telefonů a elektronických zařízení.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Jaký je rozdíl mezi ozonem a chlorem?',
'Ozon je 3 000× rychlejší než chlor a po sanitaci se přirozeně rozloží na kyslík - žádné rezidua. Chlor zanechává karcinogenní vedlejší produkty (trihalomethany), dráždí dýchací cesty a je korozivní. Ozon je ekologická volba bez toxických zbytků.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Jak často je potřeba sanitovat prostor?',
'Závisí na typu prostoru a využití. Domácnosti: 1× měsíčně. Ordinace, školy: 1× týdně. Nemocnice, hotely: 2-3× týdně. Po nemoci nebo povodních: okamžitě. Pravidelná sanitace snižuje nemocnost o 40-60 %.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Musím před sanitací něco připravit?',
'Ano. Před sanitací je nutné: 1) Odstranit všechny živé organismy (lidé, zvířata, rostliny). 2) Provést mechanický úklid (ozon nepůsobí přes vrstvu prachu). 3) Zavřít okna a dveře. 4) Nastavit časovač. Po sanitaci vyčkat 120 minut a vyvětrat.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Jaká je cena pronájmu zařízení?',
'Krátkodobý pronájem: od 1 490 Kč/den. Dlouhodobý pronájem: od dohodnuté měsíční sazby (servis a údržba v ceně). Prodej zařízení: podle modelu (UP, BOX, PRO I Plus). Kontaktujte nás pro cenovou nabídku na míru.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Funguje ozon proti COVID-19?',
'Ano. Ozon je účinný proti virům včetně SARS-CoV-2 (COVID-19). Validováno dle EN 17272:2020. Ničí virovou RNA oxidací, čímž znemožňuje replikaci. Certifikováno MZ ČR jako biocidní prostředek s prokázanou účinností 99,9 %.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Lze použít ozon v přítomnosti lidí?',
'Ne. Ozon v koncentracích potřebných pro dezinfekci je dráždivý pro dýchací cesty. Během sanitace nesmí být v prostoru žádné živé organismy. Po ukončení cyklu a rozpadu (120 min) je prostor zcela bezpečný. Bezpečná úroveň pro 8h expozici: 0,1 ppm.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'faq', 'Pomůže ozon proti alergii na roztoče?',
'Ano. Ozon likviduje roztoče, jejich vajíčka i alergeny, které produkují. Pravidelná ozonová sanitace ložnice a textilií výrazně snižuje alergickou zátěž. Ideální kombinace: sanitace + pravidelné praní textilií na vysoké teploty.', true),

-- GENERAL - Obecné informace
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'general', 'Historie ozonové technologie',
'Ozon byl objeven v roce 1840 německým chemikem Christianem Friedrichem Schönbeinem. První průmyslové využití pro dezinfekci vody začalo v roce 1906 ve Francii. Dnes je ozon uznávanou technologií pro sanitaci vody, vzduchu a povrchů po celém světě.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'general', 'Ozon v přírodě',
'Ozon se v přírodě vyskytuje ve stratosféře (ozonová vrstva chrání Zemi před UV zářením) a vzniká při bouřkách elektrickými výboji. Charakteristická "vůně po bouřce" je právě ozon. Přírodní ozon se rychle rozpadá zpět na kyslík.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'general', 'Použití ozonu ve světě',
'Ozon se celosvětově používá pro: dezinfekci pitné vody (alternativa ke chloru), sanitaci potravin (ovoce, zelenina, maso), čištění odpadních vod, dezinfekci zdravotnických prostor, sanitaci hotelových pokojů, čištění klimatizací a mnoho dalších aplikací.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'general', 'Výhody oproti UV záření',
'Ozon vs UV záření: Ozon pronikne do všech štěrbin a stínů (UV působí pouze na osvětlené povrchy). Ozon ničí patogeny v celém objemu vzduchu (UV jen na povrchu). Ozon rozloží VOCs a pachy (UV ne). Ozon je 1,5-5× účinnější než UV.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'general', 'Ekologický aspekt',
'Ozonová sanitace je 100% ekologická. Nevyužívá žádné chemikálie, neprodukuje toxický odpad, nezanechává rezidua. Po sanitaci zůstává pouze čistý kyslík. Žádné plastové obaly, žádné chemické látky do kanalizace. Udržitelná technologie pro budoucnost.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'general', 'Ozon a kvalita vzduchu',
'Ozon nejen dezinfikuje, ale také rozloží VOCs (těkavé organické sloučeniny) z nábytku, barev, koberců. Neutralizuje pachy (cigaretový kouř, zvířata, plísně). Po sanitaci je vzduch čistší než před ní - bez bakterií, virů, alergenů i chemických látek.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'general', 'Kontaktní informace',
'VitalSpace - Profesionální ozonová sanitace. Web: vitalspace.cz. Email: info@vitalspace.cz. Telefon: +420 XXX XXX XXX. Provozní doba: Po-Pá 8:00-18:00. Pohotovost 24/7 pro komerční klienty. Sídlo: Praha, Česká republika.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'general', 'Záruka a servis',
'Všechna zařízení OZON CLEANER mají záruku 24 měsíců. Servis a náhradní díly okamžitě dostupné v ČR. Zaškolení v češtině při předání zařízení. Technická podpora 24/7. Pravidelné servisní prohlídky v rámci dlouhodobého pronájmu.', true),

('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'general', 'Reference a certifikace',
'Zařízení OZON CLEANER používají: nemocnice (Fakultní nemocnice Brno, Nemocnice Na Homolce), hotely (Grandior Hotel Prague), školy (ZŠ a MŠ po celé ČR), úřady (městské úřady), firmy (kanceláře, výrobní haly). Certifikováno MZ ČR, vyvinuto s ČVUT.', true);

-- Poznámka:
-- Tento seed doplňuje chybějící kategorie FAQ a GENERAL do VitalSpace projektu
-- Celkem přidává 19 nových KB entries (10 FAQ + 9 GENERAL)
