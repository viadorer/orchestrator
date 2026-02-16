import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Hugo Chatbot API
 * POST /api/chat/[projectId]
 * 
 * Accepts: { message: string, history?: Array<{role, content}> }
 * Returns: { reply: string, sources?: string[] }
 * 
 * ZERO hardcoded rules – everything loaded from DB:
 * - project_prompt_templates (all 15 categories)
 * - knowledge_base (keyword-filtered for relevance)
 * - projects.mood_settings, constraints, semantic_anchors, style_rules
 * - project_news (Contextual Pulse)
 * - prompt_templates (global fallback)
 */

function getCorsHeaders(origin?: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const origin = request.headers.get('origin');
  const cors = getCorsHeaders(origin);

  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500, headers: cors });
  }

  const { projectId } = await params;
  const body = await request.json();
  const { message, history } = body;

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400, headers: cors });
  }

  try {
    // ── Load all project data in parallel ──
    const [projectRes, kbRes, promptsRes, globalPromptsRes, newsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('knowledge_base').select('category, title, content').eq('project_id', projectId).eq('is_active', true),
      supabase.from('project_prompt_templates').select('slug, category, content, sort_order').eq('project_id', projectId).eq('is_active', true).order('sort_order'),
      supabase.from('prompt_templates').select('slug, content').eq('is_active', true),
      supabase.from('project_news').select('title, summary, source_name').eq('project_id', projectId).eq('is_processed', true).order('published_at', { ascending: false }).limit(5),
    ]);

    const project = projectRes.data;

    // Origin check
    const allowedOrigins = (project?.chat_allowed_origins as string[]) || [];
    if (allowedOrigins.length > 0 && origin) {
      const isAllowed = allowedOrigins.some(o =>
        origin === o || origin.endsWith('.' + o.replace(/^https?:\/\//, ''))
      );
      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Origin not allowed for this project' },
          { status: 403, headers: cors }
        );
      }
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404, headers: cors });
    }

    const prompts = promptsRes.data || [];
    const allKb = kbRes.data || [];
    const globalPrompts = globalPromptsRes.data || [];
    const news = newsRes.data || [];

    // ── Extract project settings ──
    const mood = (project.mood_settings as Record<string, string>) || {};
    const constraints = (project.constraints as Record<string, unknown>) || {};
    const styleRules = (project.style_rules as Record<string, unknown>) || {};
    const anchors = (project.semantic_anchors as string[]) || [];
    const forbidden = (constraints.forbidden_topics as string[]) || [];
    const mandatory = (constraints.mandatory_terms as string[]) || [];

    // ── Keyword-based KB relevance filtering ──
    // Extract keywords from user message + conversation context
    const conversationContext = (history || []).map((m: { content: string }) => m.content).join(' ') + ' ' + message;
    const keywords = conversationContext
      .toLowerCase()
      .replace(/[^a-záčďéěíňóřšťúůýž\s]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2);

    // Score each KB entry by keyword overlap
    const scoredKb = allKb.map((entry: { category: string; title: string; content: string }) => {
      const entryText = `${entry.category} ${entry.title} ${entry.content}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (entryText.includes(kw)) score++;
      }
      return { ...entry, score };
    });

    // Take top relevant entries (max 20) + always include high-priority categories
    const priorityCategories = ['product', 'usp', 'faq', 'process'];
    const relevantKb = scoredKb
      .filter((e: { score: number; category: string }) => e.score > 0 || priorityCategories.includes(e.category))
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 20);

    // If no relevant KB found, include all (up to 30)
    const kbToUse = relevantKb.length > 0 ? relevantKb : allKb.slice(0, 30);

    // ── Build system prompt from DB ──
    const parts: string[] = [];

    // 1. Per-project prompts (all 15 categories)
    if (prompts.length > 0) {
      const byCategory = new Map<string, string[]>();
      for (const p of prompts) {
        if (!byCategory.has(p.category)) byCategory.set(p.category, []);
        byCategory.get(p.category)!.push(p.content);
      }

      // Assembly order – all categories the Prompt Builder supports
      const categoryOrder = [
        'identity', 'communication', 'guardrail', 'business_rules',
        'content_strategy', 'topic_boundaries', 'cta_rules',
        'quality_criteria', 'personalization', 'examples',
        'seasonal', 'competitor', 'legal', 'platform_rules',
        'editor_rules',
      ];

      for (const cat of categoryOrder) {
        const entries = byCategory.get(cat);
        if (entries) {
          parts.push(`\n[${cat.toUpperCase()}]:`);
          for (const entry of entries) parts.push(entry);
        }
      }
    } else {
      // Fallback: global prompt template
      const chatRole = globalPrompts.find((p: { slug: string; content: string }) => p.slug === 'chatbot_role' || p.slug === 'system_role');
      if (chatRole) {
        parts.push(chatRole.content
          .replace(/\{\{PROJECT_NAME\}\}/g, project.name)
          .replace(/\{\{PLATFORM\}\}/g, 'chat')
        );
      }
    }

    // 2. Tone, energy, style from mood_settings
    if (mood.tone || mood.energy || mood.style) {
      parts.push(`\n[TÓN KOMUNIKACE]:`);
      if (mood.tone) parts.push(`Tón: ${mood.tone}`);
      if (mood.energy) parts.push(`Energie: ${mood.energy}`);
      if (mood.style) parts.push(`Styl: ${mood.style}`);
    }

    // 3. Semantic anchors
    if (anchors.length > 0) {
      parts.push(`\n[KLÍČOVÁ SLOVA]: ${anchors.join(', ')}`);
    }

    // 4. Constraints from DB
    if (forbidden.length > 0) {
      parts.push(`\n[ZAKÁZANÁ TÉMATA] (NIKDY o nich nemluv, odmítni odpovědět):\n${forbidden.map(t => `- ${t}`).join('\n')}`);
    }
    if (mandatory.length > 0) {
      parts.push(`\n[POVINNÉ TERMÍNY] (přirozeně zapracuj):\n${mandatory.map(t => `- ${t}`).join('\n')}`);
    }

    // 5. Style rules from DB
    if (Object.keys(styleRules).length > 0) {
      parts.push(`\n[PRAVIDLA FORMÁTU]:`);
      if (styleRules.max_length) parts.push(`Max délka odpovědi: ${styleRules.max_length} znaků`);
      if (styleRules.max_bullets) parts.push(`Max odrážek: ${styleRules.max_bullets}`);
    }

    // 6. Knowledge Base (filtered)
    if (kbToUse.length > 0) {
      parts.push('\n---\n[KNOWLEDGE BASE] (odpovídej POUZE na základě těchto faktů):');
      for (const entry of kbToUse) {
        parts.push(`[${entry.category}] ${entry.title}: ${entry.content}`);
      }
    }

    // 7. Contextual Pulse – recent news
    if (news.length > 0) {
      parts.push('\n---\n[AKTUÁLNÍ ZPRÁVY] (můžeš zmínit pokud je to relevantní):');
      for (const n of news) {
        parts.push(`- [${n.source_name}] ${n.title}: ${n.summary}`);
      }
    }

    // 8. Chat-specific instructions from DB (or minimal fallback)
    // Check if project has a chatbot-specific prompt
    const hasChatIdentity = prompts.some((p: { category: string }) => p.category === 'identity');
    const hasChatComm = prompts.some((p: { category: string }) => p.category === 'communication');

    if (!hasChatIdentity && !hasChatComm) {
      // Minimal fallback only if project has NO prompts at all
      parts.push(`\n---\n[CHATBOT KONTEXT]:`);
      parts.push(`Jsi chatbot projektu "${project.name}". Odpovídáš na dotazy návštěvníků.`);
      parts.push(`Pokud neznáš odpověď, řekni to upřímně.`);
    }

    // 9. Output format instruction (always needed for chat)
    parts.push(`\n---\n[FORMÁT ODPOVĚDI]:`);
    parts.push(`- Odpovídej v jazyce uživatele (pokud píše česky, odpověz česky).`);
    parts.push(`- Nepoužívej markdown (žádné **, ##, \`\`\`). Odpověz čistým textem.`);
    parts.push(`- Buď stručný a konkrétní.`);

    const systemPrompt = parts.join('\n');

    // ── Build conversation ──
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: message });

    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'Uživatel' : 'Hugo'}: ${m.content}`)
      .join('\n');

    const { text: reply } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: `${systemPrompt}\n\n---\nKONVERZACE:\n${conversationText}\n\nHugo:`,
      temperature: 0.5,
    });

    // ── Log chat interaction ──
    try {
      await supabase.from('agent_log').insert({
        project_id: projectId,
        action: 'chatbot_reply',
        details: {
          user_message: message.substring(0, 200),
          reply_length: reply.length,
          history_length: messages.length,
          kb_used: kbToUse.length,
          kb_total: allKb.length,
          prompts_used: prompts.length,
          news_available: news.length,
          has_custom_prompts: prompts.length > 0,
        },
        tokens_used: 0,
        model_used: 'gemini-2.0-flash',
      });
    } catch {
      // Log failed, continue
    }

    return NextResponse.json({
      reply,
      sources: kbToUse.length > 0 ? kbToUse.slice(0, 3).map((e: { title: string }) => e.title) : undefined,
    }, { headers: cors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500, headers: cors });
  }
}
