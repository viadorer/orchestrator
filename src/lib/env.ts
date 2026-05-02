import { z } from 'zod';

/**
 * Environment variable schema. Validated lazily so that:
 *   1. Build-time imports (e.g. middleware bundle) don't crash on missing keys
 *      that are only required by specific runtimes.
 *   2. Production deploys still surface misconfiguration loudly via assertEnv().
 *
 * Server-only values must NEVER be accessed in `'use client'` files.
 */
const ServerEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  // AI
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(20),

  // Publishing
  GETLATE_API_KEY: z.string().min(8).optional(),
  GETLATE_API_URL: z.string().url().optional(),

  // Cron
  CRON_SECRET: z.string().min(16),

  // Storage (optional — fallback to Supabase storage if missing)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // GitHub publishing (optional)
  GITHUB_PAT: z.string().optional(),
  GITHUB_OWNER: z.string().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Parse and cache the server environment. Throws a descriptive error listing
 * every missing or invalid variable. Call this at the top of cron handlers,
 * server actions, or in a startup script — NEVER from a client component.
 */
export function assertEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = ServerEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Returns whether all required env vars are present (no throw). */
export function envIsValid(): boolean {
  return ServerEnvSchema.safeParse(process.env).success;
}
