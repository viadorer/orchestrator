import { NextResponse } from 'next/server';

/**
 * Consistent JSON response wrappers for API routes.
 *
 * Why a helper:
 *   - Existing routes mix shapes ({ error }, { success, data }, { ok, ... }).
 *   - This module standardises new routes without forcing a big-bang refactor:
 *     legacy routes keep their shape until migrated explicitly.
 *
 * Convention for new code:
 *   return ok(data)                   // 200, { ok: true, data }
 *   return ok(data, 201)              // any 2xx
 *   return badRequest('reason')       // 400, { ok: false, error }
 *   return unauthorized()             // 401
 *   return forbidden()                // 403
 *   return notFound('thing not found')// 404
 *   return serverError()              // 500
 */

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export function ok<T extends JsonValue | object>(data: T, status: number = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function err(message: string, status: number, code?: string) {
  return NextResponse.json(
    { ok: false, error: message, ...(code ? { code } : {}) },
    { status },
  );
}

export const badRequest    = (message = 'Bad request')   => err(message, 400, 'bad_request');
export const unauthorized  = (message = 'Unauthorized')  => err(message, 401, 'unauthorized');
export const forbidden     = (message = 'Forbidden')     => err(message, 403, 'forbidden');
export const notFound      = (message = 'Not found')     => err(message, 404, 'not_found');
export const conflict      = (message = 'Conflict')      => err(message, 409, 'conflict');
export const tooMany       = (message = 'Too many')      => err(message, 429, 'rate_limited');
export const serverError   = (message = 'Internal server error') => err(message, 500, 'server_error');
