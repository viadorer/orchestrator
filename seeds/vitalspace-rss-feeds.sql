-- ============================================
-- VitalSpace RSS Feeds Seed
-- Automatický import novinek o longevity, biohacking, wellness, ozon
-- ============================================

INSERT INTO rss_sources (project_id, name, url, category, is_active, fetch_interval_hours) VALUES

-- LONGEVITY & ANTI-AGING
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Fight Aging!', 'https://www.fightaging.org/feed/', 'longevity', true, 12),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Longevity Technology', 'https://longevity.technology/feed/', 'longevity', true, 12),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Life Extension Magazine', 'https://www.lifeextension.com/magazine/rss', 'longevity', true, 24),

-- BIOHACKING & WELLNESS
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Young By Choice - Biohacking', 'https://youngbychoice.com/feed/', 'biohacking', true, 12),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Hacks4Wellness', 'https://hacks4wellness.com/feed/', 'biohacking', true, 12),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'BrainFlow - Health Optimization', 'https://brainflow.co/feed/', 'wellness', true, 24),

-- WELLNESS REAL ESTATE & HEALTHY BUILDINGS
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Global Wellness Institute', 'https://globalwellnessinstitute.org/feed/', 'wellness_real_estate', true, 24),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Biofilico - Healthy Buildings', 'https://biofilico.com/feed/', 'wellness_real_estate', true, 24),

-- OZONE & SANITIZATION (scientific sources)
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Absolute Ozone Blog', 'https://absoluteozone.com/feed/', 'ozone', true, 24),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Water Technologies - Ozone', 'https://www.watertechnologies.com/feed/', 'ozone', true, 24),

-- HEALTH & SCIENCE (general)
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'ScienceDaily - Health', 'https://www.sciencedaily.com/rss/health_medicine.xml', 'science', true, 12),
('ab968db8-40df-4115-8a2d-4d634cbd60ed', 'Medical News Today', 'https://www.medicalnewstoday.com/rss', 'health', true, 12);

-- Poznámka: 
-- - fetch_interval_hours určuje, jak často se RSS feed načítá (12 = 2× denně, 24 = 1× denně)
-- - Cron job běží každých 6 hodin a načte pouze feeds, které jsou starší než fetch_interval_hours
-- - AI sumarizuje články a ukládá je do project_news pro použití v postech
