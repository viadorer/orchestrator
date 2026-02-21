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
    template_key,
    status = 'approved',
  } = body as {
    text: string;
    projects: Array<{ id: string; platforms: string[] }>;
    media_urls?: string[];
    hugo_adapt?: boolean;
    template_key?: string;
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

  console.log('[manual-post] media_urls:', media_urls, 'count:', media_urls?.length || 0);

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

        // ---- Step 1: Build template_url if template_key is selected ----
        let templateUrl: string | null = null;
        if (template_key && media_urls && media_urls.length > 0) {
          const vi = projectData?.visual_identity as Record<string, string> | null;
          const bgColor = (vi?.primary_color || '#0f0f23').replace('#', '');
          const accentColor = (vi?.accent_color || '#e94560').replace('#', '');
          const textColor = (vi?.text_color || '#ffffff').replace('#', '');
          const logoUrl = vi?.logo_url || '';
          const hookText = finalText.split(/[.!?\n]/)[0]?.trim().substring(0, 60) || '';
          const bodyText = finalText.split(/[.!?\n]/)[1]?.trim().substring(0, 50) || '';

          const tParams = new URLSearchParams({
            t: template_key,
            hook: hookText,
            body: bodyText,
            photo: media_urls[0],
            bg: bgColor,
            accent: accentColor,
            text: textColor,
            logo: logoUrl,
            platform,
            project: projectName,
          });
          templateUrl = `/api/visual/template-v2?${tParams.toString()}`;
        }

        console.log(`[manual-post] ${projectName}/${platform}: media_urls=${media_urls?.length || 0}, template_key=${template_key || 'none'}, template_url=${templateUrl ? 'yes' : 'no'}`);

        // ---- Step 2: Insert with ALL columns (full insert) ----
        const fullInsert: Record<string, unknown> = {
          project_id: proj.id,
          text_content: finalText,
          content_type: 'educational',
          platforms: [platform],
          target_platform: platform,
          status,
          source: 'manual',
          ai_scores: { overall: 10, creativity: 10, tone_match: 10, hallucination_risk: 10, value_score: 10 },
          generation_context: {
            source: 'manual_post',
            hugo_adapted: hugo_adapt && finalText !== text,
            media_count: media_urls?.length || 0,
            projects_count: projects.length,
            template_key: template_key || null,
            timestamp: new Date().toISOString(),
          },
        };
        if (media_urls && media_urls.length > 0) {
          fullInsert.media_urls = media_urls;
          fullInsert.image_url = media_urls[0];
        }
        if (templateUrl) {
          fullInsert.template_url = templateUrl;
          fullInsert.card_url = templateUrl;
        }

        let { data: saved, error } = await supabase
          .from('content_queue')
          .insert(fullInsert)
          .select('id')
          .single();

        // ---- Step 3: If full insert fails, insert core + update optional ----
        if (error) {
          console.error(`[manual-post] Full insert failed: ${error.message}`);
          const coreInsert: Record<string, unknown> = {
            project_id: proj.id,
            text_content: finalText,
            content_type: 'educational',
            platforms: [platform],
            target_platform: platform,
            status,
            source: 'manual',
            ai_scores: { overall: 10, creativity: 10, tone_match: 10, hallucination_risk: 10, value_score: 10 },
          };
          const coreResult = await supabase
            .from('content_queue')
            .insert(coreInsert)
            .select('id')
            .single();
          saved = coreResult.data;
          error = coreResult.error;

          // If core insert succeeded, try to update with optional columns one by one
          if (!error && saved?.id) {
            console.log(`[manual-post] Core insert OK (${saved.id}), updating optional columns...`);
            const optionalUpdates: Record<string, unknown> = {};
            if (media_urls && media_urls.length > 0) optionalUpdates.media_urls = media_urls;
            if (media_urls && media_urls.length > 0) optionalUpdates.image_url = media_urls[0];
            if (templateUrl) optionalUpdates.template_url = templateUrl;
            if (templateUrl) optionalUpdates.card_url = templateUrl;

            // Try updating all optional columns at once
            if (Object.keys(optionalUpdates).length > 0) {
              const { error: updateError } = await supabase
                .from('content_queue')
                .update(optionalUpdates)
                .eq('id', saved.id);
              if (updateError) {
                console.error(`[manual-post] Optional update failed: ${updateError.message}`);
                // Try each column individually
                for (const [key, value] of Object.entries(optionalUpdates)) {
                  const { error: singleError } = await supabase
                    .from('content_queue')
                    .update({ [key]: value })
                    .eq('id', saved.id);
                  if (singleError) {
                    console.error(`[manual-post] Column ${key} update failed: ${singleError.message}`);
                  } else {
                    console.log(`[manual-post] Column ${key} updated OK`);
                  }
                }
              } else {
                console.log(`[manual-post] Optional columns updated OK: ${Object.keys(optionalUpdates).join(',')}`);
              }
            }
          }
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
    debug: {
      media_urls_received: media_urls || [],
      media_count: media_urls?.length || 0,
    },
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
    facebook: { maxChars: 63206, tips: 'Může být delší, přátelský tón, krátké odstavce' },
    instagram: { maxChars: 2200, tips: 'Krátký hook na začátek, hashtagy na konec, max 30 hashtagů' },
    linkedin: { maxChars: 3000, tips: 'Profesionální tón, krátké odstavce, hook na první řádek' },
    x: { maxChars: 280, tips: 'Extrémně stručné, bez hashtagů v textu, max 1-2 hashtagy' },
    tiktok: { maxChars: 4000, tips: 'Neformální, trendy hashtagy' },
    threads: { maxChars: 500, tips: 'Konverzační tón, krátké' },
  };

  const limit = platformLimits[platform] || { maxChars: 5000, tips: 'Přizpůsob délku platformě' };

  const prompt = `Jsi Hugo, expert na sociální sítě. Přizpůsob tento text pro platformu ${platform}.

PŮVODNÍ TEXT:
${originalText}

KRITICKÉ PRAVIDLO:
- ABSOLUTNĚ ŽÁDNÉ emotikony/emoji. Emoji jsou ZAKÁZANÉ. Nikdy nepoužívej Unicode emoji symboly (žádné 🤔📈💰🤩😉👋🤯🏡🌍 ani jakékoli jiné).

DALŠÍ PRAVIDLA:
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
  let adapted = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!adapted) return originalText;

  // Safety net: strip any emoji that Gemini might have added despite instructions
  // Replace emoji with empty string, but preserve newlines and formatting
  adapted = adapted
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/ {2,}/g, ' ')  // Collapse multiple spaces (but not newlines)
    .trim();

  return adapted;
}
