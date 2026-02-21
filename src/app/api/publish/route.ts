import { supabase } from '@/lib/supabase/client';
import { getPublisher, buildPlatformsArray, type MediaItem } from '@/lib/publishers';
import { validatePostMultiPlatform } from '@/lib/platforms';
import { ensureImageAspectRatio } from '@/lib/visual/image-resize';
import { storage } from '@/lib/storage';
import { NextResponse } from 'next/server';

/**
 * Pre-render a dynamic template URL into a static PNG and upload to storage.
 * getLate expects a stable, publicly-accessible image URL — not a dynamic endpoint
 * that needs server-side rendering on fetch.
 * 
 * Returns the static public URL, or falls back to the original resolved URL on error.
 */
async function resolveTemplateToStaticUrl(
  templateUrl: string,
  postId: string,
  projectId: string,
  platform: string,
): Promise<string> {
  try {
    console.log(`[publish] Pre-rendering template for post ${postId}...`);
    const startTime = Date.now();

    const response = await fetch(templateUrl, {
      signal: AbortSignal.timeout(14000),
    });

    if (!response.ok) {
      console.error(`[publish] Template render failed (${response.status}): ${await response.text().catch(() => 'no body')}`);
      return templateUrl;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image/')) {
      console.error(`[publish] Template returned non-image content-type: ${contentType}`);
      return templateUrl;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const renderMs = Date.now() - startTime;
    console.log(`[publish] Template rendered: ${(buffer.length / 1024).toFixed(1)} KB in ${renderMs}ms`);

    const timestamp = Date.now();
    const fileName = `template_${platform}_${timestamp}.png`;

    const uploadResult = await storage.upload(buffer, fileName, {
      projectId,
      folder: 'published-templates',
      contentType: 'image/png',
    });

    if (uploadResult.success && uploadResult.public_url) {
      console.log(`[publish] Template uploaded to ${uploadResult.provider}: ${uploadResult.public_url}`);
      return uploadResult.public_url;
    }

    console.error(`[publish] Template upload failed: ${uploadResult.error}`);
    return templateUrl;
  } catch (err) {
    console.error(`[publish] resolveTemplateToStaticUrl error:`, err instanceof Error ? err.message : err);
    return templateUrl;
  }
}

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
      // If template_url exists AND media_urls has multiple photos → carousel with brand templates
      let usedTemplate = false;
      if (post.template_url || post.card_url) {
        const templateBase = post.template_url || post.card_url;
        const isTemplateEndpoint = templateBase.includes('/api/visual/template');

        // Collect photos: if media_urls has multiple, use all; otherwise just the one in template
        const carouselPhotos: string[] = [];
        if (post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 1 && isTemplateEndpoint) {
          // Multi-photo carousel: each photo gets its own brand template
          for (const url of post.media_urls) {
            if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'))) {
              carouselPhotos.push(url);
            }
          }
        }

        if (carouselPhotos.length > 1) {
          // Carousel mode: generate a branded template for each photo
          console.log(`[publish] Carousel mode: ${carouselPhotos.length} photos with brand template`);
          for (let ci = 0; ci < carouselPhotos.length; ci++) {
            let templateSrc = templateBase;
            try {
              const tUrl = new URL(templateSrc, baseUrl);
              tUrl.searchParams.set('photo', carouselPhotos[ci]);
              if (targetPlatforms[0]) tUrl.searchParams.set('platform', targetPlatforms[0]);
              tUrl.searchParams.delete('w');
              tUrl.searchParams.delete('h');
              templateSrc = tUrl.pathname + '?' + tUrl.searchParams.toString();
            } catch { /* keep original */ }
            const resolvedTemplate = resolveUrl(templateSrc);
            const staticUrl = await resolveTemplateToStaticUrl(
              resolvedTemplate,
              post.id,
              post.project_id,
              targetPlatforms[0] || 'facebook',
            );
            console.log(`[publish] Carousel [${ci + 1}/${carouselPhotos.length}]: ${staticUrl.substring(0, 150)}`);
            mediaItems.push({ type: 'image', url: staticUrl });
          }
        } else {
          // Single template (original flow)
          let templateSrc = templateBase;
          if (isTemplateEndpoint && targetPlatforms[0]) {
            try {
              const tUrl = new URL(templateSrc, baseUrl);
              tUrl.searchParams.set('platform', targetPlatforms[0]);
              tUrl.searchParams.delete('w');
              tUrl.searchParams.delete('h');
              templateSrc = tUrl.pathname + '?' + tUrl.searchParams.toString();
            } catch { /* keep original */ }
          }
          const resolvedTemplate = resolveUrl(templateSrc);
          console.log(`[publish] Template URL (dynamic): ${resolvedTemplate.substring(0, 200)}...`);
          const staticUrl = await resolveTemplateToStaticUrl(
            resolvedTemplate,
            post.id,
            post.project_id,
            targetPlatforms[0] || 'facebook',
          );
          console.log(`[publish] Using static template URL for post ${post.id}: ${staticUrl.substring(0, 200)}`);
          mediaItems.push({ type: 'image', url: staticUrl });
        }
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
