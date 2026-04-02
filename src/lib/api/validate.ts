/**
 * Request validation helpers using Zod.
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

// ─── Shared schemas ─────────────────────────────────────────

export const uuidSchema = z.string().uuid();

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().nullable(),
  late_social_set_id: z.string().max(200).optional().nullable(),
  platforms: z.array(z.string().max(50)).max(10).optional(),
  mood_settings: z.record(z.string(), z.unknown()).optional(),
  content_mix: z.record(z.string(), z.unknown()).optional(),
  constraints: z.record(z.string(), z.unknown()).optional(),
  semantic_anchors: z.array(z.string()).max(50).optional(),
  style_rules: z.record(z.string(), z.unknown()).optional(),
  orchestrator_config: z.record(z.string(), z.unknown()).optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional().nullable(),
  is_active: z.boolean().optional(),
  late_social_set_id: z.string().max(200).optional().nullable(),
  late_accounts: z.record(z.string(), z.string()).optional().nullable(),
  platforms: z.array(z.string().max(50)).max(10).optional(),
  mood_settings: z.record(z.string(), z.unknown()).optional(),
  content_mix: z.record(z.string(), z.unknown()).optional(),
  constraints: z.record(z.string(), z.unknown()).optional(),
  semantic_anchors: z.array(z.string()).max(50).optional(),
  style_rules: z.record(z.string(), z.unknown()).optional(),
  orchestrator_config: z.record(z.string(), z.unknown()).optional(),
  visual_identity: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const generateSchema = z.object({
  projectId: uuidSchema,
  platform: z.string().min(1).max(50),
  contentType: z.string().max(50).optional(),
  patternId: z.string().max(200).optional(),
  forcePhoto: z.boolean().optional(),
});

export const publishSchema = z.object({
  ids: z.array(uuidSchema).max(50).optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  project_id: uuidSchema.optional(),
});

export const queuePatchSchema = z.object({
  id: uuidSchema,
  text_content: z.string().min(1).max(50000),
});

export const queueDeleteSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
});

export const rssCreateSchema = z.object({
  project_id: uuidSchema,
  name: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  category: z.string().max(100).optional(),
  fetch_interval_hours: z.number().int().min(1).max(168).optional(),
});

export const manualPostSchema = z.object({
  text: z.string().min(1).max(50000),
  projects: z.array(z.object({
    id: uuidSchema,
    platforms: z.array(z.string().max(50)).min(1).max(10),
  })).min(1).max(20),
  media_urls: z.array(z.string().url().max(2000)).max(20).optional(),
  hugo_adapt: z.boolean().optional(),
  template_key: z.string().max(200).optional(),
  status: z.enum(['approved', 'review']).optional(),
});

export const blogGenerateSchema = z.object({
  project_id: uuidSchema,
  topic: z.string().max(500).optional(),
  category: z.string().max(200).optional(),
  post_format: z.enum(['html', 'markdown']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(6).max(200),
});

// ─── Validation helper ──────────────────────────────────────

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export function validateBody<T>(
  body: unknown,
  schema: z.ZodType<T>,
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: result.data };
}

/**
 * Safely parse JSON from request body.
 * Returns 400 if body is not valid JSON.
 */
export async function safeParseJson(request: Request): Promise<
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse }
> {
  try {
    const data = await request.json();
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }
}
