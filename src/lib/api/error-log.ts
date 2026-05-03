/**
 * Lightweight error tracking — logs errors to Supabase agent_log.
 *
 * Why not Sentry/Datadog?
 * - Single-user admin panel: no need for external SaaS
 * - Already have agent_log table for visibility
 * - Zero new dependencies, zero env vars required
 * - Errors visible in admin UI alongside other agent activity
 *
 * If you want Sentry later, this is a drop-in: replace logError() body
 * with Sentry.captureException(err) + keep the agent_log fallback.
 */

import { supabase } from '@/lib/supabase/client';

export interface ErrorContext {
  /** Where the error occurred — e.g. '/api/publish', 'cron-agent', 'visual-agent' */
  source: string;
  /** Optional project_id if error is project-scoped */
  projectId?: string;
  /** Optional related entity ID (post_id, task_id, etc.) */
  entityId?: string;
  /** HTTP method if applicable */
  method?: string;
  /** Additional structured context */
  meta?: Record<string, unknown>;
}

/**
 * Log an error to Supabase agent_log with full context.
 * Never throws — error logging must never break the main flow.
 */
export async function logError(error: unknown, ctx: ErrorContext): Promise<void> {
  // Always log to console first (Vercel captures these in logs)
  const errMsg = error instanceof Error ? error.message : String(error);
  const errStack = error instanceof Error ? error.stack : undefined;
  console.error(`[error:${ctx.source}] ${errMsg}`, ctx.meta || {});
  if (errStack) console.error(errStack);

  // Try to persist to Supabase for admin UI visibility
  if (!supabase) return;

  try {
    await supabase.from('agent_log').insert({
      project_id: ctx.projectId || null,
      action: 'error',
      details: {
        source: ctx.source,
        message: errMsg,
        stack: errStack?.substring(0, 4000), // truncate stack to fit JSONB sanely
        method: ctx.method,
        entity_id: ctx.entityId,
        ...ctx.meta,
      },
      tokens_used: 0,
      model_used: 'system',
    });
  } catch (logErr) {
    // Silently swallow — we already console.error'd above
    console.error('[error-log] Failed to persist to agent_log:', logErr instanceof Error ? logErr.message : logErr);
  }
}

/**
 * Wrap an async API route handler so that any thrown error is logged
 * and returns a consistent JSON error response.
 *
 * Usage:
 *   export const POST = withErrorLogging('/api/publish', async (request) => {
 *     // your handler logic
 *     return NextResponse.json({ ok: true });
 *   });
 */
export function withErrorLogging<T extends (...args: unknown[]) => Promise<Response>>(
  source: string,
  handler: T,
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (err) {
      const request = args[0] as Request | undefined;
      const method = request?.method;
      await logError(err, { source, method });

      const isDev = process.env.NODE_ENV === 'development';
      const message = err instanceof Error ? err.message : 'Internal server error';

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          ...(isDev ? { detail: message } : {}),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }) as T;
}
