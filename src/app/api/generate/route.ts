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
    const { data: saved, error } = await supabase
      .from('content_queue')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ content, saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
