/**
 * AIO llms.txt Generator
 *
 * Generuje llms.txt soubor pro AI crawlery (Perplexity, Anthropic, atd.).
 * llms.txt je emerging standard — strojově čitelný popis webu, služeb a dat.
 *
 * Formát: Markdown-like, strukturovaný pro LLM consumption.
 * Umístění: kořen webu (example.com/llms.txt)
 */

import { supabase } from '@/lib/supabase/client';

// ============================================
// Types
// ============================================

interface LlmsSection {
  heading: string;
  items: Array<{ label: string; url?: string }>;
}

interface LlmsConfig {
  entityName: string;
  description: string;
  websiteUrl?: string;
  sections: LlmsSection[];
  faq?: Array<{ question: string; answer: string }>;
}

// ============================================
// Generator
// ============================================

export function buildLlmsTxt(config: LlmsConfig): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${config.entityName}`);
  lines.push('');
  lines.push(`> ${config.description}`);
  lines.push('');

  // Sections
  for (const section of config.sections) {
    lines.push(`## ${section.heading}`);
    for (const item of section.items) {
      if (item.url) {
        lines.push(`- [${item.label}](${item.url})`);
      } else {
        lines.push(`- ${item.label}`);
      }
    }
    lines.push('');
  }

  // FAQ
  if (config.faq && config.faq.length > 0) {
    lines.push('## FAQ');
    for (const entry of config.faq) {
      lines.push(`- ${entry.question} ${entry.answer}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================
// Generate from DB
// ============================================

export async function generateLlmsTxtForProject(
  projectId: string,
): Promise<string | null> {
  if (!supabase) return null;

  // Load project
  const { data: project } = await supabase
    .from('projects')
    .select('name, website_url')
    .eq('id', projectId)
    .single();

  if (!project) return null;

  // Load entity profile
  const { data: entityProfile } = await supabase
    .from('aio_entity_profiles')
    .select('*')
    .eq('project_id', projectId)
    .single();

  // Load KB entries
  const { data: kbEntries } = await supabase
    .from('knowledge_base')
    .select('category, title, content')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('category');

  const entityName = (entityProfile?.official_name as string) || (project.name as string);
  const description =
    (entityProfile?.short_description as string) ||
    (project.name as string);
  const websiteUrl = (project.website_url as string) || undefined;

  // Build sections from KB categories
  const sections: LlmsSection[] = [];

  // Group KB by category
  const byCategory: Record<string, Array<{ title: string; content: string }>> = {};
  if (kbEntries) {
    for (const entry of kbEntries) {
      const cat = entry.category as string;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({
        title: entry.title as string,
        content: entry.content as string,
      });
    }
  }

  // Map KB categories to llms.txt sections
  const categoryLabels: Record<string, string> = {
    product: 'Služby',
    audience: 'Pro koho',
    usp: 'Klíčové výhody',
    faq: 'Časté otázky',
    case_study: 'Případové studie',
    data: 'Data a statistiky',
    market: 'Trh',
    legal: 'Právní informace',
    process: 'Jak to funguje',
    general: 'Obecné informace',
  };

  for (const [category, entries] of Object.entries(byCategory)) {
    const heading = categoryLabels[category] || category;
    sections.push({
      heading,
      items: entries.map((e) => ({
        label: `${e.title}: ${e.content.substring(0, 200)}${e.content.length > 200 ? '...' : ''}`,
      })),
    });
  }

  // Add website link section if available
  if (websiteUrl) {
    sections.unshift({
      heading: 'Web',
      items: [{ label: entityName, url: websiteUrl }],
    });
  }

  // Extract FAQ from KB
  const faqEntries = byCategory['faq'] || [];
  const faq = faqEntries.map((e) => ({
    question: e.title,
    answer: e.content.substring(0, 300),
  }));

  return buildLlmsTxt({
    entityName,
    description,
    websiteUrl,
    sections,
    faq: faq.length > 0 ? faq : undefined,
  });
}
