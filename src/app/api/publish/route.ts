import { supabase } from '@/lib/supabase/client';
import { publishPost, buildPlatformsArray, type LateMediaItem } from '@/lib/getlate';
import { validatePostMultiPlatform } from '@/lib/platforms';
import { ensureImageAspectRatio } from '@/lib/visual/image-resize';
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

    // Use target_platform (single platform variant) or fall back to platforms[] array
    const targetPlatforms: string[] = post.target_platform
      ? [post.target_platform]
      : (post.platforms || []);

    // Build platforms array: [{platform: "facebook", accountId: "698f7c19..."}]
    const platformEntries = buildPlatformsArray(lateAccounts, targetPlatforms);

    if (platformEntries.length === 0) {
      results.push({
        id: post.id,
        status: 'failed',
        error: `No getLate account IDs configured for platforms: ${targetPlatforms.join(', ')}. Set late_accounts in project settings.`,
      });
      continue;
    }

    // Validate content against platform limits before sending
    const validations = validatePostMultiPlatform(post.text_content || '', targetPlatforms);
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

      // Enforce aspect ratio for platform compliance (Instagram: 0.75-1.91)
      for (let i = 0; i < mediaItems.length; i++) {
        if (mediaItems[i].type === 'image') {
          try {
            mediaItems[i].url = await ensureImageAspectRatio(
              mediaItems[i].url,
              targetPlatforms,
              post.project_id,
            );
          } catch {
            // Continue with original URL if resize fails
          }
        }
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
          platform: post.target_platform || targetPlatforms[0] || null,
        });

      // Update media_assets: mark which post used this photo
      if (post.matched_media_id) {
        await supabase
          .from('media_assets')
          .update({
            last_used_in: post.id,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', post.matched_media_id);
      }

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
