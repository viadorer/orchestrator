import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Dashboard API – aggregated stats for the main dashboard
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const [
      projectsRes,
      reviewRes,
      approvedRes,
      sentRes,
      scheduledRes,
      rejectedRes,
      agentLogRes,
      mediaRes,
    ] = await Promise.all([
      // Projects with queue counts
      supabase
        .from('projects')
        .select('id, name, slug, platforms, visual_identity, orchestrator_config')
        .eq('is_active', true)
        .order('name'),
      // Queue counts by status
      supabase.from('content_queue').select('id, project_id, ai_scores, visual_type, created_at').eq('status', 'review'),
      supabase.from('content_queue').select('id, project_id').eq('status', 'approved'),
      supabase.from('content_queue').select('id, project_id, sent_at').eq('status', 'sent'),
      supabase.from('content_queue').select('id, project_id').eq('status', 'scheduled'),
      supabase.from('content_queue').select('id, project_id').eq('status', 'rejected'),
      // Agent log (last 10 actions)
      supabase
        .from('agent_log')
        .select('id, project_id, action, details, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      // Media assets stats
      supabase
        .from('media_assets')
        .select('id, project_id, is_processed, source, file_size, created_at')
        .eq('is_active', true),
    ]);

    const projects = projectsRes.data || [];
    const review = reviewRes.data || [];
    const approved = approvedRes.data || [];
    const sent = sentRes.data || [];
    const scheduled = scheduledRes.data || [];
    const rejected = rejectedRes.data || [];
    const agentLog = agentLogRes.data || [];
    const media = mediaRes.data || [];

    // Per-project stats
    const projectStats = projects.map((p: Record<string, unknown>) => {
      const pid = p.id as string;
      const pReview = review.filter((r: Record<string, unknown>) => r.project_id === pid);
      const pSent = sent.filter((s: Record<string, unknown>) => s.project_id === pid);
      const pApproved = approved.filter((a: Record<string, unknown>) => a.project_id === pid);
      const pScheduled = scheduled.filter((s: Record<string, unknown>) => s.project_id === pid);
      const pMedia = media.filter((m: Record<string, unknown>) => m.project_id === pid);

      // Average score from review posts
      const scores = pReview
        .map((r: Record<string, unknown>) => (r.ai_scores as Record<string, number>)?.overall)
        .filter((s: number | undefined): s is number => s !== undefined);
      const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;

      const vi = (p.visual_identity as Record<string, string>) || {};

      return {
        id: pid,
        name: p.name,
        slug: p.slug,
        platforms: p.platforms,
        logo_url: vi.logo_url || null,
        primary_color: vi.primary_color || null,
        review: pReview.length,
        approved: pApproved.length,
        sent: pSent.length,
        scheduled: pScheduled.length,
        total_posts: pReview.length + pApproved.length + pSent.length + pScheduled.length,
        avg_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
        media_count: pMedia.length,
        orchestrator_enabled: !!(p.orchestrator_config as Record<string, unknown>)?.enabled,
      };
    });

    // Low score posts
    const lowScorePosts = review.filter((r: Record<string, unknown>) => {
      const score = (r.ai_scores as Record<string, number>)?.overall;
      return score !== undefined && score < 7;
    });

    // Media stats
    const mediaStats = {
      total: media.length,
      processed: media.filter((m: Record<string, unknown>) => m.is_processed).length,
      imagen_generated: media.filter((m: Record<string, unknown>) => m.source === 'imagen_generated').length,
      uploaded: media.filter((m: Record<string, unknown>) => m.source !== 'imagen_generated').length,
      total_size_mb: Math.round(media.reduce((sum: number, m: Record<string, unknown>) => sum + ((m.file_size as number) || 0), 0) / (1024 * 1024) * 10) / 10,
    };

    // Recent agent activity
    const recentActivity = agentLog.map((log: Record<string, unknown>) => {
      const project = projects.find((p: Record<string, unknown>) => p.id === log.project_id);
      return {
        id: log.id,
        action: log.action,
        project_name: (project as Record<string, unknown>)?.name || 'Unknown',
        details: log.details,
        created_at: log.created_at,
      };
    });

    return NextResponse.json({
      stats: {
        totalProjects: projects.length,
        reviewCount: review.length,
        approvedCount: approved.length,
        sentCount: sent.length,
        scheduledCount: scheduled.length,
        rejectedCount: rejected.length,
        lowScorePosts: lowScorePosts.length,
      },
      projectStats,
      mediaStats,
      recentActivity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
