import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLogger } from './log';

describe('createLogger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('emits JSON with namespace, level, message, ts', () => {
    const log = createLogger('test-ns');
    log.info('hello');
    expect(logSpy).toHaveBeenCalledOnce();
    const line = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(line.namespace).toBe('test-ns');
    expect(line.level).toBe('info');
    expect(line.message).toBe('hello');
    expect(typeof line.ts).toBe('string');
  });

  it('routes warn() and error() to the right console method', () => {
    const log = createLogger('ns');
    log.warn('warning');
    log.error('error');
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('serialises Error meta into { message, stack }', () => {
    const log = createLogger('ns');
    const err = new Error('boom');
    log.error('failed', { err });
    const line = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(line.err.message).toBe('boom');
    expect(typeof line.err.stack).toBe('string');
  });

  it('child() merges base meta with per-call meta', () => {
    const log = createLogger('ns', { service: 'api' });
    const child = log.child({ requestId: 'req-1' });
    child.info('hello', { extra: 1 });
    const line = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(line.service).toBe('api');
    expect(line.requestId).toBe('req-1');
    expect(line.extra).toBe(1);
  });
});
