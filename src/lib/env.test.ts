import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { envIsValid } from './env';

const REQUIRED_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'CRON_SECRET',
] as const;

const ORIG = new Map<string, string | undefined>();

function snapshot() {
  for (const k of REQUIRED_KEYS) ORIG.set(k, process.env[k]);
}
function restore() {
  for (const k of REQUIRED_KEYS) {
    const v = ORIG.get(k);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe('envIsValid', () => {
  beforeEach(() => { snapshot(); });
  afterEach(() => { restore(); });

  it('returns false when required keys missing', () => {
    for (const k of REQUIRED_KEYS) delete process.env[k];
    expect(envIsValid()).toBe(false);
  });

  it('returns true when all keys present and valid', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'a'.repeat(40);
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'b'.repeat(40);
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'c'.repeat(40);
    process.env.CRON_SECRET = 'd'.repeat(32);
    expect(envIsValid()).toBe(true);
  });

  it('returns false when SUPABASE_URL is not a URL', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'a'.repeat(40);
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'b'.repeat(40);
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'c'.repeat(40);
    process.env.CRON_SECRET = 'd'.repeat(32);
    expect(envIsValid()).toBe(false);
  });

  it('returns false when CRON_SECRET is too short', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'a'.repeat(40);
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'b'.repeat(40);
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'c'.repeat(40);
    process.env.CRON_SECRET = 'short';
    expect(envIsValid()).toBe(false);
  });
});
