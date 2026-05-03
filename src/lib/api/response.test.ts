import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooMany,
  serverError,
} from './response';

async function readJson(res: Response): Promise<{ status: number; body: unknown }> {
  const body = await res.json();
  return { status: res.status, body };
}

describe('ok()', () => {
  it('wraps data with ok=true and status 200 by default', async () => {
    const { status, body } = await readJson(ok({ hello: 'world' }));
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, data: { hello: 'world' } });
  });

  it('respects explicit status', async () => {
    const { status, body } = await readJson(ok({ id: 1 }, 201));
    expect(status).toBe(201);
    expect(body).toEqual({ ok: true, data: { id: 1 } });
  });
});

describe('err helpers', () => {
  it('badRequest returns 400 with code', async () => {
    const { status, body } = await readJson(badRequest('missing field'));
    expect(status).toBe(400);
    expect(body).toEqual({ ok: false, error: 'missing field', code: 'bad_request' });
  });

  it('unauthorized → 401', async () => {
    const { status, body } = await readJson(unauthorized());
    expect(status).toBe(401);
    expect((body as { code: string }).code).toBe('unauthorized');
  });

  it('forbidden → 403', async () => {
    expect((await readJson(forbidden())).status).toBe(403);
  });

  it('notFound → 404', async () => {
    expect((await readJson(notFound())).status).toBe(404);
  });

  it('conflict → 409', async () => {
    expect((await readJson(conflict())).status).toBe(409);
  });

  it('tooMany → 429', async () => {
    expect((await readJson(tooMany())).status).toBe(429);
  });

  it('serverError → 500', async () => {
    expect((await readJson(serverError())).status).toBe(500);
  });

  it('err omits code when not provided', async () => {
    const { body } = await readJson(err('boom', 500));
    expect(body).toEqual({ ok: false, error: 'boom' });
  });
});
