import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Manual Post API
 * POST /api/manual-post
 * 
 * Creates manual posts across multiple projects and platforms.
 * Accepts JSON with:
 * - text: string (post text)
 * - projects: Array<{ id: string; platforms: string[] }> (target projects + platforms)
 * - media_urls: string[] (optional, public URLs of already-uploaded media)
 * - hugo_adapt: boolean (optional, let Hugo adapt text per platform)
 * - status: 'approved' | 'review' (default: 'approved')
 * 
 * Each project+platform combination creates a separate content_queue entry.
 */
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await request.json();
  const {
    text,
    projects,
    media_urls,
    hugo_adapt,
    status = 'approved',
  } = body as {
    text: string;
    projects: Array<{ id: string; platforms: string[] }>;
    media_urls?: string[];
    hugo_adapt?: boolean;
    status?: 'approved' | 'review';
  };

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text je povinný' }, { status: 400 });
  }
  if (!projects || projects.length === 0) {
    return NextResponse.json({ error: 'Vyberte alespoň jeden projekt' }, { status: 400 });
  }

  const results: Array<{
    project_id: string;
    project_name?: string;
    platform: string;
    queue_id?: string;
    adapted_text?: string;
    success: boolean;
    error?: string;
  }> = [];

  // Primary image URL (first media item)
  const imageUrl = media_urls?.[0] || null;

  for (const proj of projects) {
    if (!proj.platforms || proj.platforms.length === 0) continue;

    // Load project name for logging
    const { data: projectData } = await supabase
      .from('projects')
      .select('name, visual_identity, mood_settings, constraints, style_rules')
      .eq('id', proj.id)
      .single();

    const projectName = projectData?.name || 'Unknown';

    for (const platform of proj.platforms) {
      try {
        let finalText = text;

        // Hugo adaptation per platform (optional)
        if (hugo_adapt && projectData) {
          try {
            finalText = await adaptTextForPlatform(text, platform, projectData);
          } catch {
            // Adaptation failed, use original text
          }
        }

        const insertData: Record<string, unknown> = {
          project_id: proj.id,
          text_content: finalText,
          content_type: 'manual',
          platforms: [platform],
          target_platform: platform,
          status,
          source: 'manual_post',
          ai_scores: { overall: 10, creativity: 10, tone_match: 10, hallucination_risk: 10, value_score: 10 },
          generation_context: {
            source: 'manual_post',
            hugo_adapted: hugo_adapt && finalText !== text,
            media_count: media_urls?.length || 0,
            projects_count: projects.length,
            timestamp: new Date().toISOString(),
          },
        };

        if (imageUrl) insertData.image_url = imageUrl;

        let { data: saved, error } = await supabase
          .from('content_queue')
          .insert(insertData)
          .select('id')
          .single();

        // Retry without optional columns
        if (error && error.message.includes('column')) {
          delete insertData.image_url;
          delete insertData.generation_context;
          const retry = await supabase
            .from('content_queue')
            .insert(insertData)
            .select('id')
            .single();
          saved = retry.data;
          error = retry.error;
        }

        if (error) {
          results.push({ project_id: proj.id, project_name: projectName, platform, success: false, error: error.message });
          continue;
        }

        results.push({
          project_id: proj.id,
          project_name: projectName,
          platform,
          queue_id: saved?.id,
          adapted_text: hugo_adapt && finalText !== text ? finalText : undefined,
          success: true,
        });
      } catch (err) {
        results.push({
          project_id: proj.id,
          project_name: projectName,
          platform,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  }

  // Log to agent_log
  try {
    await supabase.from('agent_log').insert({
      project_id: projects[0]?.id,
      action: 'manual_post_created',
      details: {
        projects_count: projects.length,
        total_posts: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        hugo_adapt,
        media_count: media_urls?.length || 0,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Logging should never fail the main flow
  }

  return NextResponse.json({
    created: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    total: results.length,
    results,
  });
}

/**
 * Use Gemini to adapt text for a specific platform.
 * Respects project tone, constraints, and platform limits.
 */
async function adaptTextForPlatform(
  originalText: string,
  platform: string,
  projectData: Record<string, unknown>,
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return originalText;

  const mood = projectData.mood_settings as { tone?: string; energy?: string; style?: string } | null;
  const constraints = projectData.constraints as { forbidden_topics?: string[]; mandatory_terms?: string[] } | null;
  const styleRules = projectData.style_rules as { max_length?: number } | null;

  const platformLimits: Record<string, { maxChars: number; tips: string }> = {
    facebook: { maxChars: 63206, tips: 'Může být delší, přátelský tón, emoji OK' },
    instagram: { maxChars: 2200, tips: 'Krátký hook na začátek, hashtagy na konec, max 30 hashtagů' },
    linkedin: { maxChars: 3000, tips: 'Profesionální tón, krátké odstavce, hook na první řádek' },
    x: { maxChars: 280, tips: 'Extrémně stručné, bez hashtagů v textu, max 1-2 hashtagy' },
    tiktok: { maxChars: 4000, tips: 'Neformální, emoji, trendy hashtagy' },
    threads: { maxChars: 500, tips: 'Konverzační tón, krátké' },
  };

  const limit = platformLimits[platform] || { maxChars: 5000, tips: 'Přizpůsob délku platformě' };

  const prompt = `Jsi Hugo, expert na sociální sítě. Přizpůsob tento text pro platformu ${platform}.

PŮVODNÍ TEXT:
${originalText}

PRAVIDLA:
- Max ${limit.maxChars} znaků
- ${limit.tips}
- Tón: ${mood?.tone || 'profesionální'}
- Energie: ${mood?.energy || 'střední'}
- Styl: ${mood?.style || 'informativní'}
${constraints?.forbidden_topics?.length ? `- ZAKÁZANÁ témata: ${constraints.forbidden_topics.join(', ')}` : ''}
${styleRules?.max_length ? `- Max délka: ${styleRules.max_length} znaků` : ''}

VÝSTUP: Pouze přizpůsobený text, nic jiného. Zachovej smysl a klíčová sdělení. Pokud je text už vhodný, vrať ho beze změny.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
      }),
    },
  );

  if (!response.ok) return originalText;

  const data = await response.json();
  const adapted = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return adapted || originalText;
}
