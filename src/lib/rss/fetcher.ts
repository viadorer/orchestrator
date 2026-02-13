/**
 * RSS Fetcher + AI Summarizer
 * 
 * Stahuje RSS feedy, extrahuje čistý text článků,
 * generuje AI shrnutí a embedding, ukládá do project_news.
 */

import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { google } from '@ai-sdk/google';
import { generateText, embed } from 'ai';
import { supabase } from '@/lib/supabase/client';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Hugo-Orchestrator/1.0',
  },
});

// ============================================
// Fetch single RSS feed
// ============================================

export async function fetchRssFeed(
  projectId: string,
  sourceId: string,
  feedUrl: string,
  sourceName: string
): Promise<{ added: number; skipped: number; errors: number }> {
  if (!supabase) return { added: 0, skipped: 0, errors: 0 };

  let added = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const feed = await parser.parseURL(feedUrl);

    for (const item of (feed.items || []).slice(0, 15)) {
      if (!item.link) continue;

      // Check if already exists (dedup by link)
      const { count } = await supabase
        .from('project_news')
        .select('id', { count: 'exact' })
        .eq('link', item.link);

      if ((count || 0) > 0) {
        skipped++;
        continue;
      }

      try {
        // Scrape article text
        const articleText = await scrapeArticle(item.link);

        // AI summarize
        const summary = await summarizeArticle(
          item.title || '',
          articleText || item.contentSnippet || ''
        );

        // Generate embedding from summary
        const embeddingVector = await generateNewsEmbedding(summary);

        // Calculate relevance to project KB
        const relevanceScore = await calculateRelevance(projectId, embeddingVector);

        // Save to DB
        await supabase.from('project_news').insert({
          project_id: projectId,
          rss_source_id: sourceId,
          source_name: sourceName,
          title: item.title || 'Bez titulku',
          link: item.link,
          content: (articleText || '').substring(0, 10000),
          summary,
          relevance_score: relevanceScore,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          embedding: embeddingVector ? JSON.stringify(embeddingVector) : null,
        });

        added++;
      } catch {
        errors++;
      }
    }

    // Update last_fetched_at
    await supabase
      .from('rss_sources')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('id', sourceId);

  } catch {
    errors++;
  }

  return { added, skipped, errors };
}

// ============================================
// Scrape clean text from article URL
// ============================================

async function scrapeArticle(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Hugo-Bot/1.0)',
      },
    });
    clearTimeout(timeout);

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .cookie, .popup, .sidebar').remove();

    // Try to find main content
    const selectors = ['article', '[role="main"]', '.article-content', '.post-content', '.entry-content', 'main', '.content'];
    let text = '';

    for (const sel of selectors) {
      const found = $(sel).text().trim();
      if (found.length > 200) {
        text = found;
        break;
      }
    }

    // Fallback to body
    if (!text || text.length < 200) {
      text = $('body').text().trim();
    }

    // Clean whitespace
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .substring(0, 5000);
  } catch {
    return '';
  }
}

// ============================================
// AI Summarize article (3 key points)
// ============================================

async function summarizeArticle(title: string, content: string): Promise<string> {
  if (!content || content.length < 50) return title;

  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: `Shrň tento článek do 3 klíčových bodů. Buď stručný a faktický. Žádné komentáře.

TITULEK: ${title}

TEXT: ${content.substring(0, 3000)}

Formát odpovědi (čistý text, žádný JSON):
1. [první klíčový bod]
2. [druhý klíčový bod]  
3. [třetí klíčový bod]`,
      temperature: 0.2,
    });

    return text.trim();
  } catch {
    return title;
  }
}

// ============================================
// Generate embedding for news
// ============================================

async function generateNewsEmbedding(text: string): Promise<number[] | null> {
  if (!text || text.length < 10) return null;

  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: text.substring(0, 2000),
    });
    return embedding;
  } catch {
    return null;
  }
}

// ============================================
// Calculate relevance to project KB
// ============================================

async function calculateRelevance(projectId: string, embedding: number[] | null): Promise<number> {
  if (!supabase || !embedding) return 0.5;

  try {
    // Use RPC to find similarity with KB entries
    const { data } = await supabase.rpc('match_news_for_post', {
      query_embedding: JSON.stringify(embedding),
      match_project_id: projectId,
      match_threshold: 0.1,
      match_count: 1,
      only_unprocessed: false,
    });

    if (data && data.length > 0) {
      return data[0].similarity || 0.5;
    }
    return 0.5;
  } catch {
    return 0.5;
  }
}

// ============================================
// Fetch all RSS sources for all projects
// ============================================

export async function fetchAllRssFeeds(): Promise<{
  sources_checked: number;
  total_added: number;
  total_errors: number;
}> {
  if (!supabase) return { sources_checked: 0, total_added: 0, total_errors: 0 };

  // Get all active RSS sources that need fetching
  const { data: sources } = await supabase
    .from('rss_sources')
    .select('id, project_id, name, url, fetch_interval_hours, last_fetched_at')
    .eq('is_active', true);

  if (!sources || sources.length === 0) {
    return { sources_checked: 0, total_added: 0, total_errors: 0 };
  }

  let totalAdded = 0;
  let totalErrors = 0;
  let sourcesChecked = 0;

  for (const source of sources) {
    // Check if enough time has passed since last fetch
    if (source.last_fetched_at) {
      const hoursSinceLastFetch = (Date.now() - new Date(source.last_fetched_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastFetch < (source.fetch_interval_hours || 6)) {
        continue; // Too soon
      }
    }

    sourcesChecked++;
    const result = await fetchRssFeed(
      source.project_id,
      source.id,
      source.url,
      source.name
    );

    totalAdded += result.added;
    totalErrors += result.errors;
  }

  // Log
  await supabase.from('agent_log').insert({
    action: 'rss_fetch',
    details: {
      sources_checked: sourcesChecked,
      total_added: totalAdded,
      total_errors: totalErrors,
      timestamp: new Date().toISOString(),
    },
  });

  return { sources_checked: sourcesChecked, total_added: totalAdded, total_errors: totalErrors };
}

// ============================================
// Get recent relevant news for a project
// ============================================

export async function getRelevantNews(
  projectId: string,
  options: {
    limit?: number;
    hoursBack?: number;
    minRelevance?: number;
    onlyUnused?: boolean;
  } = {}
): Promise<Array<{
  id: string;
  title: string;
  summary: string;
  source_name: string;
  link: string;
  relevance_score: number;
  published_at: string;
}>> {
  if (!supabase) return [];

  const {
    limit = 5,
    hoursBack = 72,
    minRelevance = 0.3,
    onlyUnused = true,
  } = options;

  const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('project_news')
    .select('id, title, summary, source_name, link, relevance_score, published_at')
    .eq('project_id', projectId)
    .gte('published_at', cutoff)
    .gte('relevance_score', minRelevance)
    .order('relevance_score', { ascending: false })
    .limit(limit);

  if (onlyUnused) {
    query = query.eq('is_used_in_post', false);
  }

  const { data } = await query;
  return data || [];
}

// ============================================
// Mark news as used in a post
// ============================================

export async function markNewsUsed(newsId: string, postId?: string): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('project_news')
    .update({
      is_used_in_post: true,
      is_processed: true,
      used_in_post_id: postId || null,
    })
    .eq('id', newsId);
}
