import { optimizeFromEngagement } from '@/lib/ai/agent-orchestrator';
import { supabase } from '@/lib/supabase/client';
import { acquireCronLock } from '@/lib/api/cron-lock';
import { verifyCronSecret } from '@/lib/api/verify-cron';
import { NextResponse } from 'next/server';

/**
 * Weekly cron — Vercel daily at 08:00 CET (vercel.json `0 7 * * *` UTC).
 *
 * The handler self-gates on Prague-local weekday so it only does heavy work
 * on the right day. This keeps weekly batches isolated from the hourly
 * pipeline budget and from each other.
 *
 *   Mon 08-10  AIO Schema Injection (JSON-LD + llms.txt → GitHub repos)
 *   Sun 08-10  AIO Visibility Audit + engagement-driven optimization
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lock = await acquireCronLock('cron_weekly');
  if (!lock.acquired) {
    return NextResponse.json({
      skipped: true,
      reason: lock.reason,
      timestamp: new Date().toISOString(),
    });
  }

  const startTime = Date.now();
  const now = new Date();
  const pragueHour = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Europe/Prague' }).format(now), 10);
  const pragueDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Europe/Prague' }).format(now);

  try {
    let aioResult = { totalSites: 0, succeeded: 0, failed: 0 };
    const aioAuditResult = { tested: 0, succeeded: 0 };
    let optimized = 0;

    // Mon 08-10: AIO Schema Injection
    if (pragueDay === 'Mon' && pragueHour >= 8 && pragueHour <= 10) {
      try {
        const { runAioInjectionBatch, isAioConfigured } = await import('@/lib/aio/aio-engine');
        if (isAioConfigured()) {
          aioResult = await runAioInjectionBatch();
        }
      } catch {
        // AIO injection failed, continue
      }
    }

    // Sun 08-10: AIO Visibility Audit + engagement optimization
    if (pragueDay === 'Sun' && pragueHour >= 8 && pragueHour <= 10) {
      try {
        const { runVisibilityAudit } = await import('@/lib/aio/visibility-auditor');
        if (supabase) {
          const { data: aioProjects } = await supabase
            .from('aio_prompts')
            .select('project_id')
            .eq('is_active', true);
          if (aioProjects) {
            const uniqueProjectIds = [...new Set(aioProjects.map((p) => p.project_id as string))];
            for (const pid of uniqueProjectIds) {
              try {
                const auditRes = await runVisibilityAudit(pid);
                if (auditRes) aioAuditResult.succeeded++;
                aioAuditResult.tested++;
              } catch {
                aioAuditResult.tested++;
              }
            }
          }
        }
      } catch {
        // AIO audit failed, continue
      }

      try {
        if (supabase) {
          const { data: activeProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('is_active', true);
          if (activeProjects) {
            for (const p of activeProjects) {
              await optimizeFromEngagement(p.id as string);
              optimized++;
            }
          }
        }
      } catch {
        // Performance optimization failed, continue
      }
    }

    const duration = Date.now() - startTime;
    const result = {
      day: pragueDay,
      hour: pragueHour,
      aio_sites_injected: aioResult.succeeded,
      aio_sites_failed: aioResult.failed,
      aio_audits_tested: aioAuditResult.tested,
      aio_audits_succeeded: aioAuditResult.succeeded,
      projects_optimized: optimized,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      message: `Weekly: ${aioResult.succeeded} AIO injected, ${aioAuditResult.succeeded} AIO audited, ${optimized} projects optimized.`,
    };

    if (supabase) {
      try {
        await supabase.from('agent_log').insert({
          action: 'cron_weekly',
          details: result,
          tokens_used: 0,
          model_used: 'system',
        });
      } catch {
        // Don't fail cron on log error
      }
    }

    return NextResponse.json(result);
  } finally {
    await lock.release();
  }
}
