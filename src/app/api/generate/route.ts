import { supabase } from '@/lib/supabase/client';
import { generateContent } from '@/lib/ai/content-engine';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { projectId, platform, contentType, patternId } = body;

  if (!projectId || !platform) {
    return NextResponse.json({ error: 'projectId and platform are required' }, { status: 400 });
  }

  try {
    const content = await generateContent({
      projectId,
      platform,
      contentType,
      patternId,
    });

    // Save to content_queue as review
    const insertData: Record<string, unknown> = {
      project_id: projectId,
      text_content: content.text,
      image_prompt: content.image_prompt,
      alt_text: content.alt_text,
      pattern_id: patternId || null,
      content_type: contentType || 'educational',
      platforms: [platform],
      ai_scores: content.scores,
      status: 'review',
      source: 'ai_generated',
    };
    if (content.matched_image_url) insertData.image_url = content.matched_image_url;
    if (content.matched_media_id) insertData.matched_media_id = content.matched_media_id;

    let { data: saved, error } = await supabase
      .from('content_queue')
      .insert(insertData)
      .select()
      .single();

    // Retry without optional columns if they don't exist
    if (error && error.message.includes('column')) {
      delete insertData.image_url;
      delete insertData.matched_media_id;
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

    return NextResponse.json({ content, saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
