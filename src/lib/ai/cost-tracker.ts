import { supabase } from '@/lib/supabase/client';

/**
 * AI usage / cost tracker. Append-only writes into `usage_ledger`.
 *
 * Pricing is held in code so that a price change updates *future* rows only;
 * historical rows keep the price they were billed at (column-stored on row).
 *
 * Source of truth for prices: https://ai.google.dev/pricing — keep in sync.
 */

export type Provider = 'google' | 'openai' | 'anthropic';
export interface ModelPricing {
  /** USD per 1,000,000 input tokens */
  input: number;
  /** USD per 1,000,000 output tokens */
  output: number;
}

const PRICING: Record<string, { provider: Provider; pricing: ModelPricing }> = {
  // Google Gemini (as of 2026-Q1)
  'gemini-2.0-flash':       { provider: 'google', pricing: { input: 0.10,  output: 0.40 } },
  'gemini-2.0-flash-lite':  { provider: 'google', pricing: { input: 0.075, output: 0.30 } },
  'gemini-2.0-pro':         { provider: 'google', pricing: { input: 1.25,  output: 10.0 } },
  'gemini-2.5-flash':       { provider: 'google', pricing: { input: 0.30,  output: 2.50 } },
  'gemini-2.5-pro':         { provider: 'google', pricing: { input: 1.25,  output: 10.0 } },
};

export interface CostEntry {
  source: string;          // 'content-engine' | 'hugo-editor' | …
  model: string;           // e.g. 'gemini-2.0-flash'
  inputTokens: number;
  outputTokens: number;
  projectId?: string | null;
  taskId?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Persist one usage row. Never throws — cost tracking must not break the
 * primary AI call path. If pricing for a model is unknown, the row still
 * lands, with NULL prices and NULL cost (visible in admin as "untracked").
 */
export async function trackUsage(entry: CostEntry): Promise<void> {
  const priceInfo = PRICING[entry.model];
  const inputPrice  = priceInfo?.pricing.input  ?? null;
  const outputPrice = priceInfo?.pricing.output ?? null;
  const provider    = priceInfo?.provider ?? 'unknown';

  if (!supabase) return;

  try {
    await supabase.from('usage_ledger').insert({
      project_id:    entry.projectId ?? null,
      task_id:       entry.taskId    ?? null,
      source:        entry.source,
      provider,
      model:         entry.model,
      input_tokens:  entry.inputTokens,
      output_tokens: entry.outputTokens,
      input_price:   inputPrice,
      output_price:  outputPrice,
      meta:          entry.meta ?? {},
    });
  } catch (err) {
    // Logged but never propagated — cost tracking must not break callers.
    console.error('[cost-tracker] failed to persist usage row:', err instanceof Error ? err.message : err);
  }
}

/**
 * Estimate USD cost without persisting. Useful for pre-call budgeting
 * (e.g. refusing a generation if it would exceed monthly cap).
 */
export function estimateCost(model: string, inputTokens: number, outputTokens: number): number | null {
  const priceInfo = PRICING[model];
  if (!priceInfo) return null;
  return (
    (inputTokens  * priceInfo.pricing.input)  / 1_000_000 +
    (outputTokens * priceInfo.pricing.output) / 1_000_000
  );
}
