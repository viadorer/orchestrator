/**
 * AIO Engine — hlavní orchestrační modul
 *
 * Spojuje Schema Generator, GitHub Injector a llms.txt Generator
 * do jednoho pipeline pro automatickou AIO injection.
 *
 * Spouštěno jako agent task (aio_schema_inject) přes cron 1× týdně.
 */

import { supabase } from '@/lib/supabase/client';
import { generateSchemaBundle, bundleToJsonLd } from './schema-generator';
import {
  processSiteInjection,
  readFile,
  type InjectionResult,
} from './github-injector';
import { generateLlmsTxtForProject } from './llms-generator';

// ============================================
// Types
// ============================================

interface AioSite {
  id: string;
  project_id: string;
  github_repo: string;
  github_branch: string;
  html_files: string[];
  schema_types: string[];
  entity_name: string | null;
  entity_description: string | null;
  same_as_urls: string[] | null;
}

export interface AioInjectionResult {
  siteId: string;
  projectId: string;
  repo: string;
  success: boolean;
  injected: number;
  skipped: number;
  failed: number;
  lastCommitSha?: string;
  error?: string;
  details: InjectionResult[];
}

export interface AioBatchResult {
  totalSites: number;
  processed: number;
  succeeded: number;
  failed: number;
  results: AioInjectionResult[];
}

// ============================================
// Single Site Processing
// ============================================

/**
 * Zpracuje AIO injection pro jeden web (jeden aio_sites záznam).
 * 1. Vygeneruje schema bundle (FAQ, Organization, Dataset, WebPage)
 * 2. Vygeneruje llms.txt
 * 3. Injektuje vše do GitHub repa
 * 4. Aktualizuje aio_sites.last_injected_at
 */
export async function processAioSite(
  site: AioSite,
): Promise<AioInjectionResult> {
  const result: AioInjectionResult = {
    siteId: site.id,
    projectId: site.project_id,
    repo: site.github_repo,
    success: false,
    injected: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  try {
    // 1. Read first HTML file to extract FAQ from content
    let htmlContent: string | undefined;
    if (site.html_files.length > 0) {
      const firstFile = await readFile(
        site.github_repo,
        site.html_files[0],
        site.github_branch,
      );
      if (firstFile) {
        htmlContent = firstFile.content;
      }
    }

    // 2. Generate schema bundle
    const bundle = await generateSchemaBundle(site.project_id, htmlContent);
    if (!bundle) {
      result.error = 'Failed to generate schema bundle';
      return result;
    }

    const jsonLdBlock = bundleToJsonLd(bundle);

    // 3. Generate llms.txt
    const llmsTxt = await generateLlmsTxtForProject(site.project_id);

    // 4. Build ai-data.json from schema bundle
    const aiDataJson: Record<string, unknown> = {
      '@context': 'https://schema.org',
      generatedAt: new Date().toISOString(),
      generatedBy: 'Hugo Orchestrator AIO Engine',
      schemas: bundle,
    };

    // 5. Process injection via GitHub API
    const injectionResult = await processSiteInjection({
      repo: site.github_repo,
      branch: site.github_branch,
      htmlFiles: site.html_files,
      jsonLdBlock,
      llmsTxt: llmsTxt || undefined,
      aiDataJson,
    });

    result.success = injectionResult.failed === 0;
    result.injected = injectionResult.injected;
    result.skipped = injectionResult.skipped;
    result.failed = injectionResult.failed;
    result.lastCommitSha = injectionResult.lastCommitSha;
    result.details = injectionResult.results;

    // 6. Update aio_sites record
    if (supabase) {
      await supabase
        .from('aio_sites')
        .update({
          last_injected_at: new Date().toISOString(),
          last_commit_sha: injectionResult.lastCommitSha || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', site.id);
    }

    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Unknown error';
    return result;
  }
}

// ============================================
// Batch Processing (all active sites)
// ============================================

/**
 * Zpracuje AIO injection pro všechny aktivní aio_sites.
 * Volá se z cron jobu (1× týdně) nebo manuálně.
 */
export async function runAioInjectionBatch(
  projectId?: string,
): Promise<AioBatchResult> {
  if (!supabase) {
    return { totalSites: 0, processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  // Load active AIO sites
  let query = supabase
    .from('aio_sites')
    .select('*')
    .eq('is_active', true);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: sites } = await query;

  if (!sites || sites.length === 0) {
    return { totalSites: 0, processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  const results: AioInjectionResult[] = [];

  for (const site of sites) {
    const siteResult = await processAioSite(site as AioSite);
    results.push(siteResult);

    // Log to agent_log
    await supabase.from('agent_log').insert({
      project_id: site.project_id,
      action: 'aio_schema_inject',
      details: {
        repo: site.github_repo,
        injected: siteResult.injected,
        skipped: siteResult.skipped,
        failed: siteResult.failed,
        commit_sha: siteResult.lastCommitSha,
        error: siteResult.error,
      },
    });

    // Rate limit: 500ms between repos to avoid GitHub API throttling
    if (sites.indexOf(site) < sites.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return {
    totalSites: sites.length,
    processed: results.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

// ============================================
// Utility: Check GitHub PAT configuration
// ============================================

export function isAioConfigured(): boolean {
  return !!process.env.GITHUB_PAT;
}
