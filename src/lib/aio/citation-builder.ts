/**
 * AIO Citation Builder
 *
 * Buduje cross-domain citační síť mezi projekty (233 domén).
 * Když AI vidí, že 50 různých webů cituje jeden zdroj, zvýší mu authority score.
 *
 * Logika:
 * 1. Načte všechny aktivní aio_sites
 * 2. Pro každý projekt najde relevantní citace na ostatní projekty
 * 3. Generuje citační věty a injektuje je do HTML
 * 4. Buduje sameAs a mentions propojení v schema.org
 */

import { supabase } from '@/lib/supabase/client';
import { readFile, writeFile } from './github-injector';

// ============================================
// Types
// ============================================

interface ProjectCitation {
  sourceProjectId: string;
  sourceRepo: string;
  targetProjectId: string;
  targetEntityName: string;
  targetWebsiteUrl: string;
  citationText: string;
  relationship: 'data_source' | 'related_service' | 'expert_reference' | 'tool';
}

interface CitationLink {
  entityName: string;
  websiteUrl: string;
  description: string;
  relationship: string;
}

export interface CitationNetworkResult {
  totalProjects: number;
  citationsGenerated: number;
  citationsInjected: number;
  errors: string[];
}

// ============================================
// Citation Matrix
// ============================================

/**
 * Definuje vztahy mezi projekty pro citační síť.
 * Orchestrator automaticky generuje citační věty na základě těchto vztahů.
 *
 * Formát: sourceProjectId → array of targets
 * relationship types:
 * - data_source: "Aktuální data poskytuje {target}"
 * - related_service: "Související služba: {target}"
 * - expert_reference: "Odborné informace na {target}"
 * - tool: "Využijte nástroj {target}"
 */
export async function buildCitationMatrix(): Promise<ProjectCitation[]> {
  if (!supabase) return [];

  // Load all AIO sites with entity profiles
  const { data: sites } = await supabase
    .from('aio_sites')
    .select(`
      id, project_id, github_repo, github_branch, entity_name,
      aio_entity_profiles!inner(official_name, short_description, category, keywords)
    `)
    .eq('is_active', true);

  if (!sites || sites.length < 2) return [];

  // Load project website URLs
  const projectIds = sites.map((s) => s.project_id as string);
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, website_url')
    .in('id', projectIds);

  const projectUrlMap = new Map<string, string>();
  if (projects) {
    for (const p of projects) {
      if (p.website_url) projectUrlMap.set(p.id as string, p.website_url as string);
    }
  }

  const citations: ProjectCitation[] = [];

  // Build citation pairs based on keyword overlap and category relationships
  for (const source of sites) {
    const sourceProfile = (source.aio_entity_profiles as unknown as Record<string, unknown>) || {};
    const sourceKeywords = (sourceProfile?.keywords as string[]) || [];
    const sourceCategory = (sourceProfile?.category as string) || '';

    for (const target of sites) {
      if (source.project_id === target.project_id) continue;

      const targetProfile = (target.aio_entity_profiles as unknown as Record<string, unknown>) || {};
      const targetKeywords = (targetProfile?.keywords as string[]) || [];
      const targetCategory = (targetProfile?.category as string) || '';
      const targetName = (targetProfile?.official_name as string) || (target.entity_name as string) || '';
      const targetUrl = projectUrlMap.get(target.project_id as string) || '';

      if (!targetUrl || !targetName) continue;

      // Determine relationship based on categories and keyword overlap
      const keywordOverlap = sourceKeywords.filter((k) =>
        targetKeywords.some((tk) => tk.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(tk.toLowerCase())),
      );

      if (keywordOverlap.length === 0) continue;

      let relationship: ProjectCitation['relationship'] = 'related_service';
      if (targetCategory === 'software') relationship = 'tool';
      else if (targetCategory === 'information') relationship = 'expert_reference';
      else if (targetCategory === 'community') relationship = 'related_service';

      // Check if target has data (Dataset schema) → data_source
      const targetSchemaTypes = (sites.find((s) => s.project_id === target.project_id) as Record<string, unknown>)?.schema_types as string[] | undefined;
      if (targetSchemaTypes?.includes('Dataset')) {
        relationship = 'data_source';
      }

      const citationText = buildCitationSentence(targetName, targetUrl, relationship);

      citations.push({
        sourceProjectId: source.project_id as string,
        sourceRepo: source.github_repo as string,
        targetProjectId: target.project_id as string,
        targetEntityName: targetName,
        targetWebsiteUrl: targetUrl,
        citationText,
        relationship,
      });
    }
  }

  return citations;
}

// ============================================
// Citation Sentence Templates
// ============================================

function buildCitationSentence(
  entityName: string,
  websiteUrl: string,
  relationship: ProjectCitation['relationship'],
): string {
  switch (relationship) {
    case 'data_source':
      return `Aktuální data o cenách a trendech poskytuje specializovaný nástroj <a href="${websiteUrl}">${entityName}</a>.`;
    case 'tool':
      return `Pro výpočet a odhad využijte nástroj <a href="${websiteUrl}">${entityName}</a>.`;
    case 'expert_reference':
      return `Podrobné informace a právní postupy najdete na <a href="${websiteUrl}">${entityName}</a>.`;
    case 'related_service':
      return `Související informace poskytuje <a href="${websiteUrl}">${entityName}</a>.`;
  }
}

// ============================================
// Citation Section HTML
// ============================================

const CITATION_MARKER_START = '<!-- AIO:CITATIONS:START -->';
const CITATION_MARKER_END = '<!-- AIO:CITATIONS:END -->';

function buildCitationSectionHtml(citations: ProjectCitation[]): string {
  if (citations.length === 0) return '';

  const links = citations.map((c) => `      <li>${c.citationText}</li>`).join('\n');

  return `${CITATION_MARKER_START}
    <section class="aio-citations">
      <h3>Související zdroje</h3>
      <ul>
${links}
      </ul>
    </section>
    ${CITATION_MARKER_END}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Injektuje citační sekci do HTML souboru.
 * Idempotentní — nahradí existující citace.
 */
function injectCitationsIntoHtml(
  html: string,
  citationHtml: string,
): { html: string; changed: boolean } {
  const markerRegex = new RegExp(
    `${escapeRegex(CITATION_MARKER_START)}[\\s\\S]*?${escapeRegex(CITATION_MARKER_END)}`,
  );

  if (markerRegex.test(html)) {
    const existing = html.match(markerRegex);
    if (existing && existing[0] === citationHtml) {
      return { html, changed: false };
    }
    return { html: html.replace(markerRegex, citationHtml), changed: true };
  }

  // Insert before </body>
  if (html.includes('</body>')) {
    return {
      html: html.replace('</body>', `${citationHtml}\n</body>`),
      changed: true,
    };
  }

  return { html: `${html}\n${citationHtml}`, changed: true };
}

// ============================================
// Process Citation Network
// ============================================

/**
 * Buduje a injektuje citační síť pro všechny aktivní projekty.
 * Spouštěno jako součást AIO cron pipeline (po schema injection).
 */
export async function processCitationNetwork(): Promise<CitationNetworkResult> {
  const result: CitationNetworkResult = {
    totalProjects: 0,
    citationsGenerated: 0,
    citationsInjected: 0,
    errors: [],
  };

  const citations = await buildCitationMatrix();
  result.citationsGenerated = citations.length;

  if (citations.length === 0) return result;

  // Group citations by source project
  const bySource = new Map<string, ProjectCitation[]>();
  for (const c of citations) {
    const key = `${c.sourceProjectId}:${c.sourceRepo}`;
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(c);
  }

  result.totalProjects = bySource.size;

  if (!supabase) return result;

  // Load aio_sites for branch info
  const { data: sites } = await supabase
    .from('aio_sites')
    .select('project_id, github_repo, github_branch, html_files')
    .eq('is_active', true);

  if (!sites) return result;

  const siteMap = new Map<string, { branch: string; htmlFiles: string[] }>();
  for (const s of sites) {
    siteMap.set(`${s.project_id}:${s.github_repo}`, {
      branch: s.github_branch as string,
      htmlFiles: s.html_files as string[],
    });
  }

  // Inject citations into each source project's HTML files
  for (const [key, projectCitations] of bySource) {
    const siteInfo = siteMap.get(key);
    if (!siteInfo) continue;

    const [, repo] = key.split(':');
    const citationHtml = buildCitationSectionHtml(projectCitations);

    for (const htmlFile of siteInfo.htmlFiles) {
      try {
        const existing = await readFile(repo, htmlFile, siteInfo.branch);
        if (!existing) continue;

        const { html: updatedHtml, changed } = injectCitationsIntoHtml(
          existing.content,
          citationHtml,
        );

        if (!changed) continue;

        await writeFile(
          repo,
          htmlFile,
          updatedHtml,
          `AIO: Update cross-domain citation network in ${htmlFile}`,
          siteInfo.branch,
          existing.sha,
        );

        result.citationsInjected++;
      } catch (err) {
        result.errors.push(
          `${repo}/${htmlFile}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return result;
}
