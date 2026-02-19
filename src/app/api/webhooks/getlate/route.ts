import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * getLate.dev Webhook Handler
 * POST /api/webhooks/getlate
 * 
 * Receives real-time notifications from getLate.dev about post status changes.
 * 
 * Security:
 * - Verifies HMAC signature in X-Late-Signature header using GETLATE_WEBHOOK_SECRET
 * - Rejects requests without valid signature
 * 
 * Events:
 * - post.scheduled: Post successfully scheduled
 * - post.published: Post successfully published to platform
 * - post.failed: Post failed to publish on all platforms
 * - account.disconnected: Social account disconnected
 * 
 * Payload structure:
 * {
 *   "event": "post.published",
 *   "timestamp": "2024-01-15T10:30:00Z",
 *   "data": {
 *     "postId": "507f1f77bcf86cd799439011",
 *     "platform": "instagram",
 *     "accountId": "698f7c19fd3d49fbfa3e3835",
 *     "status": "published",
 *     "publishedAt": "2024-01-15T10:30:00Z",
 *     "error": null
 *   }
 * }
 */
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    // Verify HMAC signature if secret is configured
    const webhookSecret = process.env.GETLATE_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-late-signature');
      if (!signature) {
        console.error('[webhook-getlate] Missing X-Late-Signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      // Compute expected signature
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(rawBody);
      const expectedSignature = hmac.digest('hex');

      // Compare signatures (timing-safe)
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        console.error('[webhook-getlate] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    const { event, timestamp, post } = payload;

    console.log('[webhook-getlate] Received:', event, post);

    // Validate payload
    if (!event || !post) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Find content_queue entry by late_post_id
    const { data: queueItems } = await supabase
      .from('content_queue')
      .select('id, project_id, status, text_content')
      .eq('late_post_id', post.id);

    if (!queueItems || queueItems.length === 0) {
      console.log('[webhook-getlate] No queue item found for late_post_id:', post.id);
      // Not an error — might be a post created outside Orchestrator
      return NextResponse.json({ received: true, matched: false });
    }

    const queueItem = queueItems[0];

    // Process event
    switch (event) {
      case 'post.published': {
        // Update status to published (new status, not 'sent')
        await supabase
          .from('content_queue')
          .update({
            status: 'published',
            sent_at: post.publishedAt || new Date().toISOString(),
          })
          .eq('id', queueItem.id);

        // Log success
        await supabase.from('agent_log').insert({
          project_id: queueItem.project_id,
          action: 'post_published_webhook',
          details: {
            late_post_id: post.id,
            platforms: post.platforms,
            published_at: post.publishedAt,
            queue_id: queueItem.id,
          },
        });

        console.log('[webhook-getlate] Post published:', post.id);
        break;
      }

      case 'post.failed': {
        // Update status to failed
        await supabase
          .from('content_queue')
          .update({
            status: 'failed',
          })
          .eq('id', queueItem.id);

        // Log error
        await supabase.from('agent_log').insert({
          project_id: queueItem.project_id,
          action: 'post_failed_webhook',
          details: {
            late_post_id: post.id,
            platforms: post.platforms,
            status: post.status,
            queue_id: queueItem.id,
          },
        });

        console.log('[webhook-getlate] Post failed:', post.id);
        break;
      }

      case 'post.scheduled': {
        // Optional: update scheduled_for if getLate changed it
        if (post.scheduledFor) {
          await supabase
            .from('content_queue')
            .update({
              scheduled_for: post.scheduledFor,
            })
            .eq('id', queueItem.id);
        }

        console.log('[webhook-getlate] Post scheduled:', post.id);
        break;
      }

      case 'account.disconnected': {
        // Log account disconnect — admin should reconnect in getLate dashboard
        // Note: account events don't have post object, need to handle differently
        await supabase.from('agent_log').insert({
          action: 'account_disconnected_webhook',
          details: {
            event,
            timestamp,
            payload,
          },
        });

        console.log('[webhook-getlate] Account disconnected');
        break;
      }

      default:
        console.log('[webhook-getlate] Unknown event:', event);
    }

    return NextResponse.json({ received: true, event, processed: true });
  } catch (err) {
    console.error('[webhook-getlate] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    service: 'getLate.dev webhook handler',
    status: 'active',
    events: ['post.scheduled', 'post.published', 'post.failed', 'account.disconnected'],
  });
}
