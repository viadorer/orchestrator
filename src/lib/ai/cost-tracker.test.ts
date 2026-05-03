import { describe, it, expect } from 'vitest';
import { estimateCost } from './cost-tracker';

describe('estimateCost', () => {
  it('returns null for unknown model', () => {
    expect(estimateCost('gpt-fictional', 1000, 1000)).toBeNull();
  });

  it('computes Gemini Flash cost correctly (input)', () => {
    // gemini-2.0-flash: $0.10 input / $0.40 output per 1M
    const cost = estimateCost('gemini-2.0-flash', 1_000_000, 0);
    expect(cost).toBeCloseTo(0.10, 5);
  });

  it('computes Gemini Flash cost correctly (output)', () => {
    const cost = estimateCost('gemini-2.0-flash', 0, 1_000_000);
    expect(cost).toBeCloseTo(0.40, 5);
  });

  it('computes Gemini 2.0 Pro cost (mixed)', () => {
    // pro: $1.25 in, $10 out per 1M
    const cost = estimateCost('gemini-2.0-pro', 100_000, 100_000);
    // 0.1 * 1.25 + 0.1 * 10 = 0.125 + 1.0
    expect(cost).toBeCloseTo(1.125, 5);
  });

  it('returns 0 for zero tokens of known model', () => {
    expect(estimateCost('gemini-2.0-flash', 0, 0)).toBe(0);
  });
});
