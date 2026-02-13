import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Hugo Chatbot API
 * POST /api/chat/[projectId]
 * 
 * Accepts: { message: string, history?: Array<{role, content}> }
 * Returns: { reply: string }
 * 
 * Uses per-project KB, communication rules, tone of voice, guardrails.
 * Embeddable on any website via widget script.
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
    // Load project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Origin check: if chat_allowed_origins is set, validate
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

    // Load KB
    const { data: kb } = await supabase
      .from('knowledge_base')
      .select('category, title, content')
      .eq('project_id', projectId)
      .eq('is_active', true);

    // Load per-project prompts (identity, communication, guardrails)
    const { data: prompts } = await supabase
      .from('project_prompt_templates')
      .select('category, content')
      .eq('project_id', projectId)
      .eq('is_active', true);

    // Build system prompt
    const parts: string[] = [];
    const mood = (project.mood_settings as Record<string, string>) || {};
    const constraints = (project.constraints as Record<string, unknown>) || {};

    parts.push(`Jsi Hugo – AI asistent projektu "${project.name}".
Odpovídáš na dotazy návštěvníků webu. Jsi přátelský, profesionální a stručný.
Odpovídej POUZE na základě Knowledge Base a pravidel projektu.
Pokud na něco neznáš odpověď, řekni to upřímně a nasměruj na web nebo kontakt.
NIKDY si nevymýšlej fakta. NIKDY nedávej konkrétní investiční rady.`);

    parts.push(`\nTÓN: ${mood.tone || 'professional'} | ENERGIE: ${mood.energy || 'medium'} | STYL: ${mood.style || 'informative'}`);

    // Inject per-project prompts
    if (prompts && prompts.length > 0) {
      const byCategory = new Map<string, string[]>();
      for (const p of prompts) {
        if (!byCategory.has(p.category)) byCategory.set(p.category, []);
        byCategory.get(p.category)!.push(p.content);
      }

      const promptOrder = ['identity', 'communication', 'guardrail', 'business_rules'];
      for (const cat of promptOrder) {
        const entries = byCategory.get(cat);
        if (entries) {
          parts.push(`\n---\n[${cat.toUpperCase()}]:`);
          for (const entry of entries) parts.push(entry);
        }
      }
    }

    // Inject KB
    if (kb && kb.length > 0) {
      parts.push('\n---\nKNOWLEDGE BASE (odpovídej POUZE na základě těchto faktů):');
      for (const entry of kb) {
        parts.push(`[${entry.category}] ${entry.title}: ${entry.content}`);
      }
    }

    // Constraints
    const forbidden = (constraints.forbidden_topics as string[]) || [];
    if (forbidden.length > 0) {
      parts.push(`\n---\nZAKÁZANÁ TÉMATA (NIKDY o nich nemluv): ${forbidden.join(', ')}`);
    }

    parts.push(`\n---\nPRAVIDLA CHATU:
- Odpovídej česky (pokud uživatel nepíše jinak).
- Buď stručný – max 2-3 odstavce.
- Pokud se ptají na cenu/investici, nasměruj na web nebo konzultaci.
- Pokud se ptají na něco mimo KB, řekni "Na toto bohužel nemám informace, ale rád vás nasměruji na [web]."
- Používej přátelský, ale profesionální tón.
- Nepoužívej markdown formátování (žádné **, ##, atd.) – odpověz čistým textem.`);

    const systemPrompt = parts.join('\n');

    // Build conversation
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // Max 10 messages context
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

    // Log chat interaction (don't fail on log error)
    try {
      await supabase.from('agent_log').insert({
        project_id: projectId,
        action: 'chatbot_reply',
        details: {
          user_message: message.substring(0, 200),
          reply_length: reply.length,
          history_length: messages.length,
        },
        tokens_used: 0,
        model_used: 'gemini-2.0-flash',
      });
    } catch {
      // Log failed, continue
    }

    return NextResponse.json({ reply }, { headers: cors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500, headers: cors });
  }
}
