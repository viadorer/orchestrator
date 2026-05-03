import { supabase } from '@/lib/supabase/client';

/**
 * Ownership assertions for service-role API routes.
 *
 * Many routes use the Supabase service-role key (bypasses RLS) so that
 * server-side jobs can write across users. The trade-off: each route MUST
 * confirm that the resource being mutated actually belongs to the caller,
 * otherwise an authenticated user could read/write rows of another user
 * just by guessing IDs.
 *
 * NOTE: this helper is intentionally NOT yet wired into the API routes.
 * Wiring it in is a behaviour-changing rollout that needs a coordinated
 * pass — see the audit follow-up PR.
 *
 * Usage pattern (when wiring):
 *
 *   const auth = await requireAuth();
 *   if (!auth.ok) return auth.response;
 *
 *   const owner = await assertOwnsProject(auth.userId, body.project_id);
 *   if (!owner.ok) return owner.response;
 *
 *   // safe to mutate / read project resource here
 */

import { forbidden, serverError } from './response';

export type OwnershipResult =
  | { ok: true }
  | { ok: false; response: ReturnType<typeof forbidden> | ReturnType<typeof serverError> };

/**
 * Returns ok=true iff `userId` is the owner of `projectId`.
 *
 * The check assumes a `projects.user_id` column referencing `auth.users(id)`.
 * If the column does not exist on legacy projects, the check fails closed.
 */
export async function assertOwnsProject(
  userId: string,
  projectId: string | null | undefined,
): Promise<OwnershipResult> {
  if (!projectId) {
    return { ok: false, response: forbidden('Missing project_id') };
  }
  if (!supabase) {
    return { ok: false, response: serverError('Supabase not configured') };
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    return { ok: false, response: serverError('Ownership check failed') };
  }
  if (!data) {
    return { ok: false, response: forbidden('Project not found') };
  }
  // Fail closed if user_id column is null (legacy seed data) — owner has to
  // be explicitly set before service-role mutations are allowed.
  if (!data.user_id || data.user_id !== userId) {
    return { ok: false, response: forbidden('You do not own this project') };
  }
  return { ok: true };
}
