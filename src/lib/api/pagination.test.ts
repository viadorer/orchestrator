import { describe, it, expect } from 'vitest';
import {
  decodeCursor,
  encodeCursor,
  parsePagination,
  buildNextCursor,
} from './pagination';

describe('pagination cursor encoding', () => {
  it('round-trips ts + id through base64', () => {
    const ts = '2026-01-15T10:00:00.000Z';
    const id = '123e4567-e89b-12d3-a456-426614174000';
    const decoded = decodeCursor(encodeCursor(ts, id));
    expect(decoded).toEqual({ ts, id });
  });

  it('returns null for invalid input', () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('')).toBeNull();
    expect(decodeCursor('not-base64-???')).toBeNull();
  });

  it('returns null for valid base64 that is not a cursor object', () => {
    const garbage = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
    expect(decodeCursor(garbage)).toBeNull();
  });

  it('returns null for cursor with invalid timestamp', () => {
    const bad = Buffer.from(JSON.stringify({ ts: 'not-a-date', id: 'x' })).toString('base64');
    expect(decodeCursor(bad)).toBeNull();
  });
});

describe('parsePagination', () => {
  it('uses defaults when no params', () => {
    const result = parsePagination(new URLSearchParams());
    expect(result.limit).toBe(20);
    expect(result.cursor).toBeNull();
  });

  it('clamps limit to MAX_LIMIT (100)', () => {
    const result = parsePagination(new URLSearchParams({ limit: '99999' }));
    expect(result.limit).toBe(100);
  });

  it('clamps limit to minimum 1', () => {
    expect(parsePagination(new URLSearchParams({ limit: '0' })).limit).toBe(1);
    expect(parsePagination(new URLSearchParams({ limit: '-5' })).limit).toBe(1);
  });

  it('falls back to default on non-numeric limit', () => {
    expect(parsePagination(new URLSearchParams({ limit: 'abc' })).limit).toBe(20);
  });

  it('decodes cursor when present', () => {
    const cursor = encodeCursor('2026-01-15T10:00:00.000Z', 'abc');
    const result = parsePagination(new URLSearchParams({ cursor }));
    expect(result.cursor).toEqual({ ts: '2026-01-15T10:00:00.000Z', id: 'abc' });
  });
});

describe('buildNextCursor', () => {
  it('returns null when fewer rows than limit', () => {
    const rows = [
      { id: '1', created_at: '2026-01-01' },
      { id: '2', created_at: '2026-01-02' },
    ];
    expect(buildNextCursor(rows, 10)).toBeNull();
  });

  it('returns encoded cursor of last row when full page', () => {
    const rows = [
      { id: '1', created_at: '2026-01-01' },
      { id: '2', created_at: '2026-01-02' },
    ];
    const cursor = buildNextCursor(rows, 2);
    expect(cursor).not.toBeNull();
    expect(decodeCursor(cursor!)).toEqual({ ts: '2026-01-02', id: '2' });
  });
});
