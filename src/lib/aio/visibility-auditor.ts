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
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  competitorsMentioned: string[];
  missedOpportunity: string | null;
}

export interface VisibilityScore {
  projectId: string;
  scoreDate: string;
  visibilityScore: number;
  shareOfVoice: number;
  promptsTested: number;
  promptsWithBrand: number;
  topCompetitors: Array<{ name: string; count: number }>;
  platformsBreakdown: Record<AiPlatform, { tested: number; mentioned: number }>;
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
 */
async function queryChatGPT(prompt: string): Promise<string | null> {
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
  return data.choices[0]?.message?.content || null;
}

/**
 * Dotaz přes Perplexity API.
 * Vyžaduje PERPLEXITY_API_KEY.
 */
async function queryPerplexity(prompt: string): Promise<string | null> {
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
  };
  return data.choices[0]?.message?.content || null;
}

// ============================================
// Query Router
// ============================================

async function queryPlatform(
  platform: AiPlatform,
  prompt: string,
): Promise<string | null> {
  switch (platform) {
    case 'gemini':
      return queryGemini(prompt);
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
  response: string,
  brandName: string,
): Promise<Omit<AuditResult, 'promptId' | 'prompt' | 'platform' | 'response'>> {
  const analysisPrompt = `${AUDIT_ANALYSIS_PROMPT}\n\nZnačka: ${brandName}\nDotaz uživatele: ${prompt}\nOdpověď AI:\n${response.substring(0, 4000)}`;

  const { text: rawAnalysis } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt: analysisPrompt,
    temperature: 0.1,
  });

  const jsonMatch = rawAnalysis.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: simple string match
    const mentioned = response.toLowerCase().includes(brandName.toLowerCase());
    return {
      brandMentioned: mentioned,
      brandPosition: null,
      brandContext: null,
      isSource: false,
      citationUrl: null,
      sentiment: null,
      competitorsMentioned: [],
      missedOpportunity: null,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  return {
    brandMentioned: !!parsed.brand_mentioned,
    brandPosition: (parsed.brand_position as number) || null,
    brandContext: (parsed.brand_context as string) || null,
    isSource: !!parsed.is_source,
    citationUrl: (parsed.citation_url as string) || null,
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
): Promise<AuditResult | null> {
  const response = await queryPlatform(platform, prompt);
  if (!response) return null;

  const analysis = await analyzeResponse(prompt, response, brandName);

  return {
    promptId,
    prompt,
    platform,
    response,
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

  // Load entity profile for brand name
  const { data: entity } = await supabase
    .from('aio_entity_profiles')
    .select('official_name')
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
      prompts_tested: score.promptsTested,
      prompts_with_brand: score.promptsWithBrand,
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

function calculateVisibilityScore(
  projectId: string,
  results: AuditResult[],
  platforms: AiPlatform[],
): VisibilityScore {
  const totalTests = results.length;
  const mentionedTests = results.filter((r) => r.brandMentioned).length;
  const shareOfVoice = totalTests > 0 ? (mentionedTests / totalTests) * 100 : 0;

  // Weighted score: mention=40, position=20, source=20, sentiment=20
  let totalScore = 0;
  for (const r of results) {
    let score = 0;
    if (r.brandMentioned) score += 40;
    if (r.brandPosition === 1) score += 20;
    else if (r.brandPosition && r.brandPosition <= 3) score += 10;
    if (r.isSource) score += 20;
    if (r.sentiment === 'positive') score += 20;
    else if (r.sentiment === 'neutral') score += 10;
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
  const platformsBreakdown: Record<AiPlatform, { tested: number; mentioned: number }> = {
    chatgpt: { tested: 0, mentioned: 0 },
    perplexity: { tested: 0, mentioned: 0 },
    gemini: { tested: 0, mentioned: 0 },
  };

  for (const r of results) {
    platformsBreakdown[r.platform].tested++;
    if (r.brandMentioned) platformsBreakdown[r.platform].mentioned++;
  }

  // Unique prompts where brand was mentioned
  const uniquePromptsMentioned = new Set(
    results.filter((r) => r.brandMentioned).map((r) => r.promptId),
  ).size;

  return {
    projectId,
    scoreDate: new Date().toISOString().split('T')[0],
    visibilityScore: Math.round(visibilityScore * 10) / 10,
    shareOfVoice: Math.round(shareOfVoice * 10) / 10,
    promptsTested: new Set(results.map((r) => r.promptId)).size,
    promptsWithBrand: uniquePromptsMentioned,
    topCompetitors,
    platformsBreakdown,
  };
}
