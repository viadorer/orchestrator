import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Weekly Digest - Feedback Loop Automation
 * GET /api/agent/feedback-digest?projectId=uuid
 * 
 * Analyzuje admin edity za posledních 7 dní a navrhuje úpravy promptů.
 * AI identifikuje vzory v editacích a doporučí nové guardrails/communication rules.
 */

interface FeedbackEdit {
  id: string;
  original_text: string;
  edited_text: string;
  feedback_note: string | null;
  created_at: string;
  ai_scores: Record<string, number>;
}

interface DigestSuggestion {
  type: 'guardrail' | 'communication' | 'topic_boundary' | 'quality_criteria';
  title: string;
  content: string;
  reason: string;
  examples: string[];
  confidence: number;
}

export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const days = parseInt(searchParams.get('days') || '7', 10);

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  try {
    // 1. Load project
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Load admin edits from last N days
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { data: rawEdits } = await supabase
      .from('content_queue')
      .select('id, text_content, edited_text, feedback_note, created_at, ai_scores')
      .eq('project_id', projectId)
      .not('edited_text', 'is', null)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (!rawEdits || rawEdits.length === 0) {
      return NextResponse.json({
        project_name: project.name,
        period_days: days,
        total_edits: 0,
        suggestions: [],
        message: 'Žádné admin edity za toto období',
      });
    }

    // Map to FeedbackEdit interface
    const edits: FeedbackEdit[] = rawEdits.map(e => ({
      id: e.id,
      original_text: e.text_content,
      edited_text: e.edited_text,
      feedback_note: e.feedback_note,
      created_at: e.created_at,
      ai_scores: e.ai_scores || {},
    }));

    // 3. Analyze edits with AI
    const suggestions = await analyzeEditsAndSuggest(
      edits,
      project.name
    );

    // 4. Log to agent_log
    await supabase.from('agent_log').insert({
      project_id: projectId,
      action: 'feedback_digest_generated',
      details: {
        period_days: days,
        total_edits: edits.length,
        suggestions_count: suggestions.length,
        timestamp: new Date().toISOString(),
      },
      model_used: 'gemini-2.0-flash',
    });

    return NextResponse.json({
      project_name: project.name,
      period_days: days,
      total_edits: edits.length,
      suggestions,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * AI analyzuje edity a navrhuje úpravy promptů
 */
async function analyzeEditsAndSuggest(
  edits: FeedbackEdit[],
  projectName: string
): Promise<DigestSuggestion[]> {
  // Build analysis prompt
  const editExamples = edits.slice(0, 10).map((e, i) => `
EDIT ${i + 1}:
PŮVODNÍ: "${e.original_text.substring(0, 300)}..."
UPRAVENO NA: "${e.edited_text.substring(0, 300)}..."
${e.feedback_note ? `POZNÁMKA ADMINA: ${e.feedback_note}` : ''}
SKÓRE: ${JSON.stringify(e.ai_scores)}
---`).join('\n');

  const prompt = `Jsi AI expert na analýzu zpětné vazby pro projekt "${projectName}".

Analyzuj následující admin edity postů a identifikuj VZORY v úpravách.
Na základě vzorů navrhni KONKRÉTNÍ úpravy promptů (guardrails, communication rules, topic boundaries).

${editExamples}

ÚKOL:
1. Identifikuj opakující se vzory v editacích (co admin často mění?)
2. Pro každý vzor navrhni KONKRÉTNÍ prompt rule
3. Vrať JSON array s návrhy

FORMÁT ODPOVĚDI (POUZE JSON, žádný další text):
[
  {
    "type": "guardrail" | "communication" | "topic_boundary" | "quality_criteria",
    "title": "Krátký název pravidla",
    "content": "Detailní instrukce pro Huga (2-5 vět, konkrétní, actionable)",
    "reason": "Proč toto pravidlo navrhujeme (jaký vzor jsme identifikovali)",
    "examples": ["Příklad 1 z editů", "Příklad 2 z editů"],
    "confidence": 0.0-1.0
  }
]

PRAVIDLA:
- Navrhni MAX 5 nejdůležitějších pravidel
- Každé pravidlo musí být KONKRÉTNÍ a ACTIONABLE
- Confidence > 0.7 pouze pokud je vzor opravdu jasný (3+ edity)
- Pokud admin často zkracuje → communication rule "Buď stručnější"
- Pokud admin často odstraňuje emoji → guardrail "Žádné emoji"
- Pokud admin často mění tón → communication rule o tónu
- Pokud admin často přidává disclaimery → guardrail o rizicích`;

  const { text: response } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt,
    temperature: 0.3,
  });

  // Parse JSON response
  try {
    const cleaned = response
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?\s*```\s*$/i, '')
      .trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in response');
    
    const suggestions = JSON.parse(jsonMatch[0]) as DigestSuggestion[];
    
    // Filter by confidence
    return suggestions.filter(s => s.confidence >= 0.6);
  } catch {
    // Fallback: return empty array if parsing fails
    return [];
  }
}
