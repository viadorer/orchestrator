import { supabase } from '@/lib/supabase/client';
import { publishPost } from '@/lib/getlate';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { ids, scheduledFor } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  // Load posts with project info
  const { data: posts, error } = await supabase
    .from('content_queue')
    .select('*, projects(late_social_set_id)')
    .in('id', ids)
    .eq('status', 'approved');

  if (error || !posts) {
    return NextResponse.json({ error: error?.message || 'Posts not found' }, { status: 500 });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const post of posts) {
    const socialSetId = (post.projects as { late_social_set_id: string })?.late_social_set_id;
    if (!socialSetId) {
      results.push({ id: post.id, status: 'failed', error: 'No social_set_id configured' });
      continue;
    }

    try {
      const lateResult = await publishPost({
        socialSetId,
        text: post.text_content,
        platforms: post.platforms,
        imageUrl: post.image_url || undefined,
        scheduledFor: scheduledFor || post.scheduled_for || undefined,
      });

      // Update status in DB
      await supabase
        .from('content_queue')
        .update({
          status: scheduledFor ? 'scheduled' : 'sent',
          sent_at: scheduledFor ? null : new Date().toISOString(),
          scheduled_for: scheduledFor || null,
          late_post_id: lateResult.id,
        })
        .eq('id', post.id);

      // Record in post_history
      await supabase
        .from('post_history')
        .insert({
          project_id: post.project_id,
          content_type: post.content_type,
          pattern_id: post.pattern_id,
        });

      results.push({ id: post.id, status: 'sent' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await supabase
        .from('content_queue')
        .update({ status: 'failed' })
        .eq('id', post.id);
      results.push({ id: post.id, status: 'failed', error: message });
    }
  }

  return NextResponse.json({ results });
}
