/**
 * AIO Visibility Auditor
 *
 * Testuje viditelnost značky v AI vyhledávačích (ChatGPT, Perplexity, Gemini).
 * Posílá testovací prompty, analyzuje odpovědi a ukládá výsledky.
 *
 * Spouštěno jako agent task (aio_visibility_audit) přes cron 1× týdně (neděle).
 * Nebo manuálně přes POST /api/agent/aio { action: 'audit', projectId: '...' }
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';

// ============================================
// Types
// ============================================

export type AiPlatform = 'chatgpt' | 'perplexity' | 'gemini';

export interface SearchResult {
  title: string;
  url: string;
  date?: string;
}

export interface PlatformResponse {
  content: string;
  citations: string[];
  searchResults: SearchResult[];
}

export interface AuditResult {
  promptId: string;
  prompt: string;
  platform: AiPlatform;
  response: string;
  brandMentioned: boolean;
  brandPosition: number | null;
  brandContext: string | null;
  isSource: boolean;
  citationUrl: string | null;
  citationUrls: string[];
  searchResults: SearchResult[];
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  competitorsMentioned: string[];
  missedOpportunity: string | null;
}

export interface VisibilityScore {
  projectId: string;
  scoreDate: string;
  visibilityScore: number;
  shareOfVoice: number;
  citationRate: number;
  promptsTested: number;
  promptsWithBrand: number;
  promptsWithCitation: number;
  topCompetitors: Array<{ name: string; count: number }>;
  platformsBreakdown: Record<AiPlatform, { tested: number; mentioned: number; cited: number }>;
}

export interface AuditBatchResult {
  projectId: string;
  totalPrompts: number;
  totalTests: number;
  results: AuditResult[];
  score: VisibilityScore;
}

// ============================================
// Audit Analysis Prompt
// ============================================

const AUDIT_ANALYSIS_PROMPT = `Jsi auditní nástroj pro měření viditelnosti značky v AI vyhledávačích. Dostaneš dotaz uživatele, odpověď AI modelu a název značky.

Tvým úkolem je analyzovat odpověď a vrátit POUZE validní JSON objekt:

{
  "brand_mentioned": true/false,
  "brand_position": číslo (1 = první zmíněná, null pokud nezmíněna),
  "brand_context": "jak přesně je značka zmíněna (citát z odpovědi)" nebo null,
  "is_source": true/false (cituje AI náš web jako zdroj?),
  "citation_url": "URL pokud je citována" nebo null,
  "sentiment": "positive" / "neutral" / "negative" / null,
  "competitors": ["seznam", "konkurenčních", "značek"],
  "missed_opportunity": "co v odpovědi chybělo aby byla naše značka relevantnější" nebo null
}

Analyzuj objektivně. Pokud značka v textu není, brand_mentioned musí být false.
Žádný markdown, žádný komentář, pouze JSON objekt.`;

// ============================================
// Platform Query Functions
// ============================================

/**
 * Dotaz přes Gemini API (máme klíč).
 * Používáme přímo — žádný extra náklad.
 */
async function queryGemini(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt,
    temperature: 0.3,
  });
  return text;
}

/**
 * Dotaz přes OpenAI API (ChatGPT).
 * Vyžaduje OPENAI_API_KEY.
 * Používá gpt-4o-mini — bez web search (měří co model "ví" z tréninku).
 */
async function queryChatGPT(prompt: string): Promise<PlatformResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0]?.message?.content || '';
  return { content, citations: [], searchResults: [] };
}

/**
 * Dotaz přes Perplexity Sonar API.
 * Vyžaduje PERPLEXITY_API_KEY.
 * Vrací citations[] a search_results[] — klíčová data pro měření AI visibility.
 */
async function queryPerplexity(prompt: string): Promise<PlatformResponse | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    citations?: string[];
    search_results?: Array<{ title: string; url: string; date?: string }>;
  };

  const content = data.choices[0]?.message?.content || '';
  const citations = data.citations ?? [];
  const searchResults: SearchResult[] = (data.search_results ?? []).map(sr => ({
    title: sr.title,
    url: sr.url,
    date: sr.date,
  }));

  return { content, citations, searchResults };
}

// ============================================
// Query Router
// ============================================

async function queryPlatform(
  platform: AiPlatform,
  prompt: string,
): Promise<PlatformResponse | null> {
  switch (platform) {
    case 'gemini': {
      const text = await queryGemini(prompt);
      return { content: text, citations: [], searchResults: [] };
    }
    case 'chatgpt':
      return queryChatGPT(prompt);
    case 'perplexity':
      return queryPerplexity(prompt);
  }
}

function getAvailablePlatforms(): AiPlatform[] {
  const platforms: AiPlatform[] = ['gemini'];
  if (process.env.OPENAI_API_KEY) platforms.push('chatgpt');
  if (process.env.PERPLEXITY_API_KEY) platforms.push('perplexity');
  return platforms;
}

// ============================================
// Response Analysis
// ============================================

async function analyzeResponse(
  prompt: string,
  platformResponse: PlatformResponse,
  brandName: string,
  siteDomains: string[],
): Promise<Omit<AuditResult, 'promptId' | 'prompt' | 'platform' | 'response'>> {
  const citationContext = platformResponse.citations.length > 0
    ? `\nCitované zdroje: ${platformResponse.citations.join(', ')}`
    : '';

  const ourCitations = platformResponse.citations.filter(url =>
    siteDomains.some(domain => url.includes(domain))
  );
  const ourSearchResults = platformResponse.searchResults.filter(sr =>
    siteDomains.some(domain => sr.url.includes(domain))
  );

  const analysisPrompt = `${AUDIT_ANALYSIS_PROMPT}\n\nZnačka: ${brandName}\nDotaz uživatele: ${prompt}\nOdpověď AI:\n${platformResponse.content.substring(0, 4000)}${citationContext}`;

  const { text: rawAnalysis } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt: analysisPrompt,
    temperature: 0.1,
  });

  const jsonMatch = rawAnalysis.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    const mentioned = platformResponse.content.toLowerCase().includes(brandName.toLowerCase());
    return {
      brandMentioned: mentioned || ourCitations.length > 0,
      brandPosition: null,
      brandContext: null,
      isSource: ourCitations.length > 0,
      citationUrl: ourCitations[0] ?? null,
      citationUrls: ourCitations,
      searchResults: ourSearchResults,
      sentiment: null,
      competitorsMentioned: [],
      missedOpportunity: null,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const isSourceFromCitations = ourCitations.length > 0;
  const isSourceFromAnalysis = !!parsed.is_source;

  return {
    brandMentioned: !!parsed.brand_mentioned || ourCitations.length > 0,
    brandPosition: (parsed.brand_position as number) || null,
    brandContext: (parsed.brand_context as string) || null,
    isSource: isSourceFromCitations || isSourceFromAnalysis,
    citationUrl: ourCitations[0] ?? (parsed.citation_url as string) ?? null,
    citationUrls: ourCitations,
    searchResults: ourSearchResults,
    sentiment: (parsed.sentiment as 'positive' | 'neutral' | 'negative') || null,
    competitorsMentioned: (parsed.competitors as string[]) || [],
    missedOpportunity: (parsed.missed_opportunity as string) || null,
  };
}

// ============================================
// Single Prompt Audit
// ============================================

async function auditSinglePrompt(
  promptId: string,
  prompt: string,
  platform: AiPlatform,
  brandName: string,
  siteDomains: string[],
): Promise<AuditResult | null> {
  const platformResponse = await queryPlatform(platform, prompt);
  if (!platformResponse) return null;

  const analysis = await analyzeResponse(prompt, platformResponse, brandName, siteDomains);

  return {
    promptId,
    prompt,
    platform,
    response: platformResponse.content,
    ...analysis,
  };
}

// ============================================
// Full Project Audit
// ============================================

/**
 * Spustí visibility audit pro jeden projekt.
 * Testuje všechny aktivní prompty na všech dostupných platformách.
 */
export async function runVisibilityAudit(
  projectId: string,
): Promise<AuditBatchResult | null> {
  if (!supabase) return null;

  // Load entity profile for brand name + website domains
  const { data: entity } = await supabase
    .from('aio_entity_profiles')
    .select('official_name, website_url, same_as')
    .eq('project_id', projectId)
    .single();

  // Fallback to project name
  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single();

  const brandName = (entity?.official_name as string) || (project?.name as string);
  if (!brandName) return null;

  // Extract domains for citation matching
  const siteDomains = extractDomains(
    (entity?.website_url as string) ?? '',
    (entity?.same_as as string[]) ?? [],
  );

  // Load active prompts
  const { data: prompts } = await supabase
    .from('aio_prompts')
    .select('id, prompt, category')
    .eq('project_id', projectId)
    .eq('is_active', true);

  if (!prompts || prompts.length === 0) return null;

  const platforms = getAvailablePlatforms();
  const results: AuditResult[] = [];

  for (const promptEntry of prompts) {
    for (const platform of platforms) {
      try {
        const result = await auditSinglePrompt(
          promptEntry.id as string,
          promptEntry.prompt as string,
          platform,
          brandName,
          siteDomains,
        );

        if (result) {
          results.push(result);

          // Save to aio_audits
          await supabase.from('aio_audits').insert({
            project_id: projectId,
            prompt_id: promptEntry.id,
            prompt: promptEntry.prompt,
            platform,
            response: result.response.substring(0, 10000),
            brand_mentioned: result.brandMentioned,
            brand_position: result.brandPosition,
            brand_context: result.brandContext,
            is_source: result.isSource,
            citation_url: result.citationUrl,
            citation_urls: result.citationUrls,
            search_results: result.searchResults,
            sentiment: result.sentiment,
            competitors_mentioned: result.competitorsMentioned,
            missed_opportunity: result.missedOpportunity,
          });
        }

        // Rate limit: 1s between API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch {
        // Skip failed audit, continue with next
      }
    }

    // Update last_tested_at
    await supabase
      .from('aio_prompts')
      .update({ last_tested_at: new Date().toISOString() })
      .eq('id', promptEntry.id);
  }

  // Calculate visibility score
  const score = calculateVisibilityScore(projectId, results, platforms);

  // Save score
  await supabase.from('aio_scores').upsert(
    {
      project_id: projectId,
      score_date: new Date().toISOString().split('T')[0],
      visibility_score: score.visibilityScore,
      share_of_voice: score.shareOfVoice,
      citation_rate: score.citationRate,
      prompts_tested: score.promptsTested,
      prompts_with_brand: score.promptsWithBrand,
      prompts_with_citation: score.promptsWithCitation,
      top_competitors: score.topCompetitors,
      platforms_breakdown: score.platformsBreakdown,
    },
    { onConflict: 'project_id,score_date' },
  );

  return {
    projectId,
    totalPrompts: prompts.length,
    totalTests: results.length,
    results,
    score,
  };
}

// ============================================
// Score Calculation
// ============================================

/**
 * Extrahuje domény z URL pro matching citací.
 * "https://www.example.com/page" → "example.com"
 */
function extractDomains(websiteUrl: string, sameAs: string[]): string[] {
  const urls = [websiteUrl, ...sameAs].filter(Boolean);
  const domains: string[] = [];

  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      if (hostname && !domains.includes(hostname)) {
        domains.push(hostname);
      }
    } catch {
      // Skip invalid URLs
    }
  }

  return domains;
}

function calculateVisibilityScore(
  projectId: string,
  results: AuditResult[],
  _platforms: AiPlatform[],
): VisibilityScore {
  const totalTests = results.length;
  const mentionedTests = results.filter((r) => r.brandMentioned).length;
  const citedTests = results.filter((r) => r.isSource || r.citationUrls.length > 0).length;
  const shareOfVoice = totalTests > 0 ? (mentionedTests / totalTests) * 100 : 0;
  const citationRate = totalTests > 0 ? (citedTests / totalTests) * 100 : 0;

  // Weighted score: citation=30, mention=25, position=15, source=15, sentiment=15
  let totalScore = 0;
  for (const r of results) {
    let score = 0;
    if (r.citationUrls.length > 0) score += 30;
    if (r.brandMentioned) score += 25;
    if (r.brandPosition === 1) score += 15;
    else if (r.brandPosition && r.brandPosition <= 3) score += 8;
    if (r.isSource) score += 15;
    if (r.sentiment === 'positive') score += 15;
    else if (r.sentiment === 'neutral') score += 8;
    totalScore += score;
  }
  const visibilityScore = totalTests > 0 ? totalScore / totalTests : 0;

  // Top competitors
  const competitorCounts: Record<string, number> = {};
  for (const r of results) {
    for (const c of r.competitorsMentioned) {
      competitorCounts[c] = (competitorCounts[c] || 0) + 1;
    }
  }
  const topCompetitors = Object.entries(competitorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Platform breakdown
  const platformsBreakdown: Record<AiPlatform, { tested: number; mentioned: number; cited: number }> = {
    chatgpt: { tested: 0, mentioned: 0, cited: 0 },
    perplexity: { tested: 0, mentioned: 0, cited: 0 },
    gemini: { tested: 0, mentioned: 0, cited: 0 },
  };

  for (const r of results) {
    platformsBreakdown[r.platform].tested++;
    if (r.brandMentioned) platformsBreakdown[r.platform].mentioned++;
    if (r.isSource || r.citationUrls.length > 0) platformsBreakdown[r.platform].cited++;
  }

  const uniquePromptsMentioned = new Set(
    results.filter((r) => r.brandMentioned).map((r) => r.promptId),
  ).size;

  const uniquePromptsCited = new Set(
    results.filter((r) => r.isSource || r.citationUrls.length > 0).map((r) => r.promptId),
  ).size;

  return {
    projectId,
    scoreDate: new Date().toISOString().split('T')[0],
    visibilityScore: Math.round(visibilityScore * 10) / 10,
    shareOfVoice: Math.round(shareOfVoice * 10) / 10,
    citationRate: Math.round(citationRate * 10) / 10,
    promptsTested: new Set(results.map((r) => r.promptId)).size,
    promptsWithBrand: uniquePromptsMentioned,
    promptsWithCitation: uniquePromptsCited,
    topCompetitors,
    platformsBreakdown,
  };
}
