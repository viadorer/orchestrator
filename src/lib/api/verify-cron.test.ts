import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyCronSecret } from './verify-cron';

const ORIGINAL_SECRET = process.env.CRON_SECRET;

describe('verifyCronSecret', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-1234567890';
  });
  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_SECRET;
  });

  it('returns false when CRON_SECRET is not set', () => {
    delete process.env.CRON_SECRET;
    expect(verifyCronSecret('Bearer anything')).toBe(false);
  });

  it('returns false when authHeader is null', () => {
    expect(verifyCronSecret(null)).toBe(false);
  });

  it('returns false when authHeader is empty', () => {
    expect(verifyCronSecret('')).toBe(false);
  });

  it('returns false when token does not match', () => {
    expect(verifyCronSecret('Bearer wrong-secret')).toBe(false);
  });

  it('returns false when token has wrong scheme', () => {
    expect(verifyCronSecret('Basic test-secret-1234567890')).toBe(false);
  });

  it('returns false when token length differs (constant-time path)', () => {
    expect(verifyCronSecret('Bearer short')).toBe(false);
  });

  it('returns true on exact match', () => {
    expect(verifyCronSecret('Bearer test-secret-1234567890')).toBe(true);
  });
});
