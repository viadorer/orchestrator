/**
 * Tiny structured logger. Wraps console with namespace + JSON metadata so that
 * Vercel log search ("namespace=cron-agent level=error") works without bringing
 * in pino/winston.
 *
 * Usage:
 *   const log = createLogger('cron-agent');
 *   log.info('starting cycle', { lockId });
 *   log.error('publish failed', { post_id, err });
 *
 * If `process.env.LOG_LEVEL` is set, lower levels are dropped.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: number = LEVEL_ORDER[(process.env.LOG_LEVEL as Level) ?? 'info'] ?? LEVEL_ORDER.info;

function emit(level: Level, namespace: string, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < MIN_LEVEL) return;

  const line = {
    ts: new Date().toISOString(),
    level,
    namespace,
    message,
    ...(meta ? sanitiseMeta(meta) : {}),
  };

  // Use the matching console method so Vercel + browser devtools colour them.
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.log;
  fn(JSON.stringify(line));
}

/** Strip Error → { message, stack } so JSON.stringify doesn't drop them. */
function sanitiseMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v instanceof Error) {
      out[k] = { message: v.message, stack: v.stack?.slice(0, 4000) };
    } else {
      out[k] = v;
    }
  }
  return out;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(extra: Record<string, unknown>): Logger;
}

export function createLogger(namespace: string, base: Record<string, unknown> = {}): Logger {
  return {
    debug: (m, meta) => emit('debug', namespace, m, { ...base, ...meta }),
    info:  (m, meta) => emit('info',  namespace, m, { ...base, ...meta }),
    warn:  (m, meta) => emit('warn',  namespace, m, { ...base, ...meta }),
    error: (m, meta) => emit('error', namespace, m, { ...base, ...meta }),
    child: (extra) => createLogger(namespace, { ...base, ...extra }),
  };
}
