/**
 * AIO Schema Generator
 *
 * Generuje JSON-LD schema markup z Knowledge Base a Entity profilu projektu.
 * Schema typy: FAQPage, Organization, Dataset, HowTo, WebPage
 *
 * Používá Gemini pro extrakci FAQ z HTML obsahu.
 * Výstup se injektuje do statických HTML přes GitHub API.
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';

// ============================================
// Types
// ============================================

export interface EntityProfile {
  officialName: string;
  shortDescription: string;
  longDescription?: string;
  category?: string;
  sameAs: string[];
  keywords?: string[];
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface DatasetEntry {
  name: string;
  description: string;
  temporalCoverage?: string;
  spatialCoverage?: string;
  variables: Array<{
    name: string;
    value: number | string;
    unitCode?: string;
  }>;
}

export interface HowToStep {
  name?: string;
  text: string;
  url?: string;
}

export interface SchemaBundle {
  faq?: Record<string, unknown>;
  organization?: Record<string, unknown>;
  dataset?: Record<string, unknown>;
  howTo?: Record<string, unknown>;
  webPage?: Record<string, unknown>;
}

// ============================================
// Schema Builders
// ============================================

export function buildFAQSchema(entries: FAQEntry[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: e.answer,
      },
    })),
  };
}

export function buildOrganizationSchema(
  entity: EntityProfile,
  websiteUrl?: string,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: entity.officialName,
    description: entity.shortDescription,
    url: websiteUrl,
  };

  if (entity.sameAs.length > 0) {
    schema.sameAs = entity.sameAs;
  }

  if (entity.keywords && entity.keywords.length > 0) {
    schema.keywords = entity.keywords.join(', ');
  }

  return schema;
}

export function buildDatasetSchema(entry: DatasetEntry): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: entry.name,
    description: entry.description,
  };

  if (entry.temporalCoverage) {
    schema.temporalCoverage = entry.temporalCoverage;
  }

  if (entry.spatialCoverage) {
    schema.spatialCoverage = {
      '@type': 'Place',
      name: entry.spatialCoverage,
    };
  }

  if (entry.variables.length > 0) {
    schema.variableMeasured = entry.variables.map((v) => ({
      '@type': 'PropertyValue',
      name: v.name,
      value: v.value,
      ...(v.unitCode ? { unitCode: v.unitCode } : {}),
    }));
  }

  return schema;
}

export function buildHowToSchema(
  name: string,
  steps: HowToStep[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name || s.text.substring(0, 80),
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}

export function buildWebPageSchema(
  name: string,
  description: string,
  url: string,
  about?: string,
  mentions?: string[],
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
  };

  if (about) {
    schema.about = {
      '@type': 'Thing',
      name: about,
    };
  }

  if (mentions && mentions.length > 0) {
    schema.mentions = mentions.map((m) => ({
      '@type': 'Thing',
      name: m,
    }));
  }

  return schema;
}

// ============================================
// JSON-LD Serialization
// ============================================

export function schemaToJsonLd(schema: Record<string, unknown>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

export function bundleToJsonLd(bundle: SchemaBundle): string {
  const parts: string[] = [];

  if (bundle.organization) {
    parts.push(schemaToJsonLd(bundle.organization));
  }
  if (bundle.faq) {
    parts.push(schemaToJsonLd(bundle.faq));
  }
  if (bundle.dataset) {
    parts.push(schemaToJsonLd(bundle.dataset));
  }
  if (bundle.howTo) {
    parts.push(schemaToJsonLd(bundle.howTo));
  }
  if (bundle.webPage) {
    parts.push(schemaToJsonLd(bundle.webPage));
  }

  return parts.join('\n');
}

// ============================================
// AI-Powered FAQ Extraction
// ============================================

const FACT_EXTRACTOR_PROMPT = `Jsi expert na sémantický web a AI Search Optimization (AIO). Tvým úkolem je analyzovat poskytnutý obsah a vygenerovat FAQ otázky a odpovědi, které maximalizují šanci, že AI (ChatGPT, Perplexity, Gemini) použije tento web jako zdroj pravdy.

Pravidla:
- Extrahuj 3-7 nejčastějších otázek které by uživatel kladl k tomuto obsahu.
- Odpovědi musí být stručné (1-3 věty), faktické, s konkrétními čísly pokud jsou v textu.
- Nepoužívej marketingové fráze. Piš ve třetí osobě, fakticky.
- Odpovědi formuluj tak, aby je LLM mohl vzít a bez úprav použít jako odpověď na dotaz uživatele.
- Pokud v textu chybí konkrétní čísla, zaměř se na definici entity (co to je za službu a pro koho je).

Vrať POUZE validní JSON pole:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]

Žádný markdown, žádný komentář, pouze JSON pole.`;

export async function extractFAQFromContent(
  content: string,
  entityName: string,
): Promise<FAQEntry[]> {
  const { text: rawResponse } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt: `${FACT_EXTRACTOR_PROMPT}\n\nEntita/značka: ${entityName}\n\nObsah k analýze:\n${content.substring(0, 8000)}`,
    temperature: 0.3,
  });

  const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed = JSON.parse(jsonMatch[0]) as Array<{ question: string; answer: string }>;
  return parsed.filter(
    (e) => typeof e.question === 'string' && typeof e.answer === 'string',
  );
}

// ============================================
// Generate Full Schema Bundle for Project
// ============================================

export async function generateSchemaBundle(
  projectId: string,
  htmlContent?: string,
): Promise<SchemaBundle | null> {
  if (!supabase) return null;

  // Load entity profile
  const { data: entityProfile } = await supabase
    .from('aio_entity_profiles')
    .select('*')
    .eq('project_id', projectId)
    .single();

  // Load project for website_url
  const { data: project } = await supabase
    .from('projects')
    .select('name, website_url')
    .eq('id', projectId)
    .single();

  if (!project) return null;

  // Load KB entries for FAQ fallback
  const { data: kbEntries } = await supabase
    .from('knowledge_base')
    .select('category, title, content')
    .eq('project_id', projectId)
    .eq('is_active', true);

  const bundle: SchemaBundle = {};
  const websiteUrl = (project.website_url as string) || undefined;

  // Organization schema (from entity profile or project)
  const entity: EntityProfile = entityProfile
    ? {
        officialName: entityProfile.official_name as string,
        shortDescription: (entityProfile.short_description as string) || project.name as string,
        longDescription: (entityProfile.long_description as string) || undefined,
        category: (entityProfile.category as string) || undefined,
        sameAs: (entityProfile.same_as as string[]) || [],
        keywords: (entityProfile.keywords as string[]) || undefined,
      }
    : {
        officialName: project.name as string,
        shortDescription: project.name as string,
        sameAs: [],
      };

  bundle.organization = buildOrganizationSchema(entity, websiteUrl);

  // FAQ schema (from AI extraction or KB entries)
  if (htmlContent) {
    const faqEntries = await extractFAQFromContent(htmlContent, entity.officialName);
    if (faqEntries.length > 0) {
      bundle.faq = buildFAQSchema(faqEntries);
    }
  } else if (kbEntries && kbEntries.length > 0) {
    // Fallback: generate FAQ from KB entries
    const kbText = kbEntries
      .map((e) => `${e.title}: ${e.content}`)
      .join('\n\n');
    const faqEntries = await extractFAQFromContent(kbText, entity.officialName);
    if (faqEntries.length > 0) {
      bundle.faq = buildFAQSchema(faqEntries);
    }
  }

  // WebPage schema
  if (websiteUrl) {
    bundle.webPage = buildWebPageSchema(
      entity.officialName,
      entity.shortDescription,
      websiteUrl,
      entity.category || undefined,
      entity.keywords || undefined,
    );
  }

  return bundle;
}
