import { supabase } from '@/lib/supabase/client';
import { generateContent } from '@/lib/ai/content-engine';
import { type VisualAssets } from '@/lib/visual/visual-agent';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { projectId, platform, contentType, patternId, forcePhoto } = body;

  if (!projectId || !platform) {
    return NextResponse.json({ error: 'projectId and platform are required' }, { status: 400 });
  }

  try {
    const content = await generateContent({
      projectId,
      platform,
      contentType,
      patternId,
      forcePhoto: !!forcePhoto,
    });

    // Resolve actual content_type (engine picks via 4-1-1 when auto)
    const visual: Partial<VisualAssets> = content.visual || {};
    const resolvedContentType = contentType
      || (content as unknown as Record<string, unknown>)._resolved_content_type as string
      || 'educational';

    // Determine best image URL: visual-agent generated/matched > legacy media match
    const imageUrl = visual.generated_image_url || content.matched_image_url || null;
    const mediaId = visual.media_asset_id || content.matched_media_id || null;

    // Save to content_queue as review
    const insertData: Record<string, unknown> = {
      project_id: projectId,
      text_content: content.text,
      image_prompt: content.image_prompt,
      alt_text: content.alt_text,
      pattern_id: patternId || null,
      content_type: resolvedContentType,
      platforms: [platform],
      ai_scores: content.scores,
      status: 'review',
      source: 'ai_generated',
      visual_type: visual.visual_type || null,
      chart_url: visual.chart_url || null,
      card_url: visual.card_url || null,
      editor_review: content.editor_review || null,
      generation_context: {
        content_type: resolvedContentType,
        content_type_source: contentType ? 'explicit' : 'auto_4-1-1',
        platform,
        pattern_id: patternId || null,
        editor_used: !!content.editor_review,
        editor_changes: content.editor_review?.changes || [],
        visual_type: visual.visual_type || 'none',
        media_matched: !!mediaId,
        media_id: mediaId,
        match_similarity: visual.match_similarity || null,
        model: 'gemini-2.0-flash',
        source: 'manual_ui',
        timestamp: new Date().toISOString(),
      },
    };
    if (imageUrl) insertData.image_url = imageUrl;
    if (mediaId) insertData.matched_media_id = mediaId;

    let { data: saved, error } = await supabase
      .from('content_queue')
      .insert(insertData)
      .select()
      .single();

    // Retry without optional columns if they don't exist
    if (error && error.message.includes('column')) {
      delete insertData.image_url;
      delete insertData.matched_media_id;
      delete insertData.generation_context;
      const retry = await supabase
        .from('content_queue')
        .insert(insertData)
        .select()
        .single();
      saved = retry.data;
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log reasoning steps and performance to agent_log
    try {
      await supabase.from('agent_log').insert({
        project_id: projectId,
        action: 'content_generated',
        details: {
          platform,
          content_type: resolvedContentType,
          pattern_id: patternId || null,
          visual_type: visual.visual_type || 'none',
          source: 'manual_ui',
        },
        reasoning_steps: content.reasoning_steps || null,
        prompt_performance: content.prompt_performance || null,
        tokens_used: 0,
        model_used: 'gemini-2.0-flash',
      });
    } catch {
      // Log failed, continue
    }

    return NextResponse.json({ content, saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
