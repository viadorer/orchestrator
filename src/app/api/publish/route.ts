import { supabase } from '@/lib/supabase/client';
import { getPublisher, buildPlatformsArray, type MediaItem } from '@/lib/publishers';
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
      const mediaItems: MediaItem[] = [];

      // Helper: resolve relative URLs (e.g. /api/visual/template?...) to absolute
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'http://localhost:3000';
      const resolveUrl = (url: string): string => {
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return url;
      };
      
      // Priority 1: Brand template (photo + brand frame + logo + text)
      let usedTemplate = false;
      if (post.template_url || post.card_url) {
        let templateSrc = post.template_url || post.card_url;
        // Fix platform in template URL to match current target platform
        if (templateSrc.includes('/api/visual/template') && targetPlatforms[0]) {
          try {
            const tUrl = new URL(templateSrc, baseUrl);
            tUrl.searchParams.set('platform', targetPlatforms[0]);
            tUrl.searchParams.delete('w');
            tUrl.searchParams.delete('h');
            templateSrc = tUrl.pathname + '?' + tUrl.searchParams.toString();
          } catch { /* keep original */ }
        }
        const resolvedTemplate = resolveUrl(templateSrc);
        console.log(`[publish] Using template URL for post ${post.id}: ${resolvedTemplate.substring(0, 200)}...`);
        mediaItems.push({ type: 'image', url: resolvedTemplate });
        usedTemplate = true;
      } else if (post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0) {
        // Priority 2: media_urls array (multiple raw images from manual post)
        for (const url of post.media_urls) {
          if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'))) {
            mediaItems.push({ type: 'image', url: resolveUrl(url) });
          }
        }
      } else if (post.image_url) {
        // Priority 3: single image fallback
        mediaItems.push({ type: 'image', url: post.image_url });
      }
      // Chart (absolute URL from QuickChart.io)
      if (post.chart_url) {
        mediaItems.push({ type: 'image', url: post.chart_url });
      }

      // Enforce aspect ratio for platform compliance (Instagram: 0.75-1.91)
      // Skip for template URLs — they already generate correct dimensions per platform
      if (!usedTemplate) {
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
      }

      console.log(`[publish] Post ${post.id} → platforms: ${targetPlatforms.join(',')}, mediaItems: ${JSON.stringify(mediaItems.map(m => ({ type: m.type, url: m.url.substring(0, 150) })))}, template: ${usedTemplate}`);

      const publisher = getPublisher();
      const publishResult = await publisher.publish({
        content: post.text_content,
        platforms: platformEntries,
        mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
        scheduledFor: scheduledFor || post.scheduled_for || undefined,
        timezone: 'Europe/Prague',
      });

      if (!publishResult.ok) {
        console.error(`[publish] getLate error for post ${post.id}:`, publishResult.error);
        throw new Error(publishResult.error);
      }
      console.log(`[publish] Post ${post.id} published OK: status=${publishResult.data.status}, externalId=${publishResult.data.externalId}`);

      // Update status in DB
      await supabase
        .from('content_queue')
        .update({
          status: publishResult.data.status,
          sent_at: publishResult.data.status === 'sent' ? new Date().toISOString() : null,
          scheduled_for: scheduledFor || null,
          late_post_id: publishResult.data.externalId,
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

      results.push({ id: post.id, status: publishResult.data.status, late_post_id: publishResult.data.externalId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[publish] FAILED post ${post.id}:`, message);
      await supabase
        .from('content_queue')
        .update({ status: 'failed' })
        .eq('id', post.id);
      // Also log to agent_log for visibility in admin
      try {
        await supabase.from('agent_log').insert({
          project_id: post.project_id,
          action: 'publish_failed',
          details: { post_id: post.id, error: message, platforms: targetPlatforms, template_url: post.template_url || null },
        });
      } catch { /* logging should not fail main flow */ }
      results.push({ id: post.id, status: 'failed', error: message });
    }
  }

  return NextResponse.json({ results });
}
