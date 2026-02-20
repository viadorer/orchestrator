/**
 * Unified ServiceResult pattern
 * 
 * Všechny service vrstvy (content-engine, visual-agent, imagen, publisher)
 * vrací tento typ. Orchestrátor pak může genericky zpracovat výsledek.
 * 
 * Usage:
 *   const result = await generateContent(...);
 *   if (!result.ok) { log(result.error); return; }
 *   result.data // typově bezpečné
 */

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/** Helper: vytvoří úspěšný result */
export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

/** Helper: vytvoří chybový result */
export function fail<T = never>(error: string, code?: string): ServiceResult<T> {
  return { ok: false, error, code };
}
