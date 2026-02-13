import { supabase } from '@/lib/supabase/client';
import { publishPost, buildPlatformsArray, type LateMediaItem } from '@/lib/getlate';
import { validatePostMultiPlatform } from '@/lib/platforms';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { ids, scheduledFor } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  // Load posts with project info (late_accounts = per-platform accountIds)
  const { data: posts, error } = await supabase
    .from('content_queue')
    .select('*, projects(name, late_accounts, late_social_set_id)')
    .in('id', ids)
    .eq('status', 'approved');

  if (error || !posts) {
    return NextResponse.json({ error: error?.message || 'Posts not found' }, { status: 500 });
  }

  const results: Array<{ id: string; status: string; late_post_id?: string; error?: string }> = [];

  for (const post of posts) {
    const project = post.projects as { name: string; late_accounts: Record<string, string> | null; late_social_set_id: string | null };
    const lateAccounts = project?.late_accounts || {};

    // Build platforms array: [{platform: "facebook", accountId: "698f7c19..."}]
    const platformEntries = buildPlatformsArray(lateAccounts, post.platforms || []);

    if (platformEntries.length === 0) {
      results.push({
        id: post.id,
        status: 'failed',
        error: `No getLate account IDs configured for platforms: ${(post.platforms || []).join(', ')}. Set late_accounts in project settings.`,
      });
      continue;
    }

    // Validate content against platform limits before sending
    const validations = validatePostMultiPlatform(post.text_content || '', post.platforms || []);
    const failedPlatforms = Object.entries(validations)
      .filter(([, v]) => !v.valid)
      .map(([p, v]) => `${p}: ${v.errors.join('; ')}`);

    if (failedPlatforms.length > 0) {
      results.push({
        id: post.id,
        status: 'failed',
        error: `Validace selhala: ${failedPlatforms.join(' | ')}`,
      });
      continue;
    }

    try {
      // Build media items from visual assets
      const mediaItems: LateMediaItem[] = [];
      if (post.chart_url) {
        mediaItems.push({ type: 'image', url: post.chart_url });
      }
      if (post.card_url && post.card_url.startsWith('http')) {
        mediaItems.push({ type: 'image', url: post.card_url });
      }
      if (post.image_url) {
        mediaItems.push({ type: 'image', url: post.image_url });
      }

      const lateResult = await publishPost({
        content: post.text_content,
        platforms: platformEntries,
        mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
        scheduledFor: scheduledFor || post.scheduled_for || undefined,
        timezone: 'Europe/Prague',
      });

      // Update status in DB
      await supabase
        .from('content_queue')
        .update({
          status: scheduledFor ? 'scheduled' : 'sent',
          sent_at: scheduledFor ? null : new Date().toISOString(),
          scheduled_for: scheduledFor || null,
          late_post_id: lateResult._id,
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

      results.push({ id: post.id, status: 'sent', late_post_id: lateResult._id });
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
