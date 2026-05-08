import { supabase } from '@/lib/supabase/client';
import { getPublisher, buildPlatformsArray, type MediaItem } from '@/lib/publishers';
import { validatePostMultiPlatform } from '@/lib/platforms';
import { ensureImageAspectRatio } from '@/lib/visual/image-resize';
import { resolveTemplateToStaticUrl } from '@/lib/visual/resolve-template';
import { validateImageUrl } from '@/lib/utils/validate-image-url';
import { logError } from '@/lib/api/error-log';
import { withRetry, classifyRetryable } from '@/lib/api/retry';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';
import { safeParseJson, validateBody, publishSchema } from '@/lib/api/validate';
import { checkRateLimit } from '@/lib/api/rate-limit';

// Platforms that require an image — skip these if no valid image available
const IMAGE_REQUIRED_PLATFORMS = ['instagram', 'pinterest', 'tiktok'];

// Long-running route: each post needs up to 14s template render + getLate API call.
// Bulk publishing 5 posts can easily take 60+ seconds.
export const maxDuration = 300; // 5 minutes (Vercel Pro max for Standard functions)
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const rl = checkRateLimit(auth.userId, 'publish');
  if (!rl.ok) return rl.response;

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const json = await safeParseJson(request);
  if (!json.ok) return json.response;

  const v = validateBody(json.data, publishSchema);
  if (!v.ok) return v.response;

  const { ids, scheduledFor, project_id } = v.data;

  // If project_id is provided without ids, fetch all approved posts for that project
  let postIds = ids;
  if (project_id && (!ids || ids.length === 0)) {
    const { data: projectPosts } = await supabase
      .from('content_queue')
      .select('id')
      .eq('project_id', project_id)
      .eq('status', 'approved')
      .limit(50);
    postIds = projectPosts?.map(p => p.id) || [];
  }

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return NextResponse.json({ error: 'No posts to publish' }, { status: 400 });
  }

  // Load posts with project info (late_accounts = per-platform accountIds)
  const { data: posts, error } = await supabase
    .from('content_queue')
    .select('*, projects(name, late_accounts, late_social_set_id)')
    .in('id', postIds)
    .eq('status', 'approved');

  if (error || !posts) {
    return NextResponse.json({ error: error?.message || 'Posts not found' }, { status: 500 });
  }

  const results: Array<{ id: string; status: string; late_post_id?: string; error?: string }> = [];

  for (const post of posts) {
    const project = post.projects as { name: string; late_accounts: Record<string, string> | null; late_social_set_id: string | null };
    const lateAccounts = project?.late_accounts || {};

    const requestedPlatforms: string[] = post.target_platform
      ? [post.target_platform]
      : (post.platforms || []);

    let targetPlatforms = requestedPlatforms.filter(p => !!lateAccounts[p]);

    const hasVideo = (post.media_urls || []).some((url: string) =>
      typeof url === 'string' && /\.(mp4|mov|avi|webm|mkv)(\?|$)/i.test(url)
    );
    if (targetPlatforms.includes('youtube') && !hasVideo) {
      console.log(`[publish] Post ${post.id}: Skipping YouTube — no video attached`);
      targetPlatforms = targetPlatforms.filter(p => p !== 'youtube');
    }

    const textLength = (post.text_content || '').length;
    if (targetPlatforms.includes('x') && textLength > 280) {
      console.log(`[publish] Post ${post.id}: Skipping X — text too long (${textLength} chars, max 280)`);
      targetPlatforms = targetPlatforms.filter(p => p !== 'x');
    }

    const platformEntries = buildPlatformsArray(lateAccounts, targetPlatforms);

    if (platformEntries.length === 0) {
      const unconfigured = requestedPlatforms.filter(p => !lateAccounts[p]);
      results.push({
        id: post.id,
        status: 'failed',
        error: unconfigured.length > 0
          ? `Platforms not configured in getLate: ${unconfigured.join(', ')}. Remove from post or add to project settings.`
          : `No platforms specified for post.`,
      });
      continue;
    }

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
      const mediaItems: MediaItem[] = [];

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'http://localhost:3000';
      const resolveUrl = (url: string): string => {
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return url;
      };

      if (!post.template_url && !post.card_url && post.generation_context?.template_url_value) {
        post.template_url = post.generation_context.template_url_value;
        console.log(`[publish] Using template_url from generation_context for post ${post.id}`);
      }

      // Priority 0: Pre-rendered static image (set at approval time)
      if (post.static_image_url) {
        const isValid = await validateImageUrl(post.static_image_url);
        if (isValid) {
          console.log(`[publish] Using pre-rendered static_image_url for post ${post.id}`);
          mediaItems.push({ type: 'image', url: post.static_image_url });
        } else {
          console.warn(`[publish] static_image_url invalid for post ${post.id}, falling through to template`);
        }
      }

      // Priority 1: Brand template — only if Priority 0 didn't resolve
      let usedTemplate = false;
      if (mediaItems.length === 0 && (post.template_url || post.card_url)) {
        const templateBase = post.template_url || post.card_url;
        const isTemplateEndpoint = templateBase.includes('/api/visual/template');

        const carouselPhotos: string[] = [];
        if (post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 1 && isTemplateEndpoint) {
          for (const url of post.media_urls) {
            if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'))) {
              carouselPhotos.push(url);
            }
          }
        }

        if (carouselPhotos.length > 1) {
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

          // Validate template pre-render succeeded — must return a different URL than input
          // and NOT contain /api/visual/template (which would mean we got the dynamic URL back)
          const renderSucceeded = staticUrl !== resolvedTemplate && !staticUrl.includes('/api/visual/template');
          if (renderSucceeded) {
            console.log(`[publish] Using static template URL for post ${post.id}: ${staticUrl.substring(0, 200)}`);
            mediaItems.push({ type: 'image', url: staticUrl });
          } else if (post.image_url) {
            console.warn(`[publish] Template render failed for post ${post.id} — using raw image_url fallback`);
            mediaItems.push({ type: 'image', url: post.image_url });
          } else {
            console.error(`[publish] Template render failed for post ${post.id} and no image_url fallback`);
          }
        }
        usedTemplate = mediaItems.length > 0;
      } else if (mediaItems.length === 0 && post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0) {
        for (const url of post.media_urls) {
          if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'))) {
            mediaItems.push({ type: 'image', url: resolveUrl(url) });
          }
        }
      } else if (mediaItems.length === 0 && post.image_url) {
        mediaItems.push({ type: 'image', url: post.image_url });
      }
      if (post.chart_url) {
        mediaItems.push({ type: 'image', url: post.chart_url });
      }

      // Block publishing without images on platforms that require them
      if (mediaItems.length === 0) {
        const imagePlatforms = targetPlatforms.filter(p => IMAGE_REQUIRED_PLATFORMS.includes(p));
        if (imagePlatforms.length > 0) {
          console.warn(`[publish] Post ${post.id}: Skipping ${imagePlatforms.join(', ')} — no valid image available`);
          targetPlatforms = targetPlatforms.filter(p => !IMAGE_REQUIRED_PLATFORMS.includes(p));
          const filteredEntries = buildPlatformsArray(lateAccounts, targetPlatforms);
          if (filteredEntries.length === 0) {
            results.push({ id: post.id, status: 'failed', error: `No valid image for image-required platforms: ${imagePlatforms.join(', ')}` });
            continue;
          }
        }
      }

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

      const platformsWithFirstComment = platformEntries.map(entry => {
        const supportsFirstComment = ['facebook', 'instagram', 'linkedin'].includes(entry.platform);
        if (supportsFirstComment && post.first_comment) {
          return {
            ...entry,
            platformSpecificData: {
              ...entry.platformSpecificData,
              firstComment: post.first_comment,
            },
          };
        }
        return entry;
      });

      const publisher = getPublisher();
      // Skip if a previous attempt already succeeded — webhook may have been delayed.
      // Avoids re-publishing the same content after a transient error.
      if (post.late_post_id) {
        console.log(`[publish] Post ${post.id} already has late_post_id=${post.late_post_id}, skipping re-send`);
        results.push({ id: post.id, status: 'sent', late_post_id: post.late_post_id });
        continue;
      }

      // Retry with exponential backoff (5s, 10s, 20s) for transient failures.
      // Permanent errors (4xx) bail immediately. getLate's idempotency-by-content
      // means accidental double-sends are safe but still wasteful — skip + retry helps.
      const publishResult = await withRetry(
        async () => {
          const result = await publisher.publish({
            content: post.text_content,
            platforms: platformsWithFirstComment,
            mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
            scheduledFor: scheduledFor || post.scheduled_for || undefined,
            timezone: 'Europe/Prague',
          });
          if (!result.ok) {
            // Throw so withRetry can classify the error message.
            throw new Error(result.error);
          }
          return result;
        },
        {
          maxAttempts: 3,
          baseDelayMs: 5_000,
          onAttemptFailed: (attempt, err, retryable) => {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(
              `[publish] Attempt ${attempt}/3 for post ${post.id} failed (retryable=${retryable}): ${msg.substring(0, 200)}`,
            );
          },
        },
      );

      console.log(`[publish] Post ${post.id} published OK: status=${publishResult.data.status}, externalId=${publishResult.data.externalId}`);

      await supabase
        .from('content_queue')
        .update({
          status: publishResult.data.status,
          sent_at: publishResult.data.status === 'sent' ? new Date().toISOString() : null,
          scheduled_for: scheduledFor || null,
          late_post_id: publishResult.data.externalId,
          publish_attempts: 0,
          last_publish_error: null,
          last_publish_attempt_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      await supabase
        .from('post_history')
        .insert({
          project_id: post.project_id,
          content_type: post.content_type,
          pattern_id: post.pattern_id,
          platform: post.target_platform || targetPlatforms[0] || null,
        });

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

      // Decide whether to give up (permanent) or hold the post in 'approved'
      // for the next cron retry pass (transient).
      // Transient errors after 3 retries usually mean getLate is having a
      // longer outage — better to retry on next cron run than mark failed.
      const retryable = classifyRetryable(err);
      const newAttempts = (post.publish_attempts ?? 0) + 1;
      const MAX_TOTAL_ATTEMPTS = 5; // retries across cron runs

      // Permanent OR exceeded total attempts → failed.
      const giveUp = !retryable || newAttempts >= MAX_TOTAL_ATTEMPTS;
      const newStatus = giveUp ? 'failed' : 'approved';

      await supabase
        .from('content_queue')
        .update({
          status: newStatus,
          publish_attempts: newAttempts,
          last_publish_error: message.substring(0, 500),
          last_publish_attempt_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      // Persistent error log for admin visibility
      await logError(err, {
        source: 'publish',
        projectId: post.project_id,
        entityId: post.id,
        meta: {
          platforms: targetPlatforms,
          template_url: post.template_url || null,
          has_static_image: !!post.static_image_url,
          has_image_url: !!post.image_url,
          attempt: newAttempts,
          retryable,
          gave_up: giveUp,
        },
      });

      results.push({
        id: post.id,
        status: newStatus,
        error: giveUp
          ? message
          : `${message} (attempt ${newAttempts}/${MAX_TOTAL_ATTEMPTS}, will retry)`,
      });
    }
  }

  return NextResponse.json({ results });
}
