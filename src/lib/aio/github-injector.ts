/**
 * AIO GitHub Injector
 *
 * Čte a zapisuje soubory do GitHub repozitářů přes REST API.
 * Používá se pro injection JSON-LD schema a llms.txt do statických webů.
 *
 * DŮLEŽITÉ: Nepoužívá simple-git/clone — funguje v serverless (Vercel).
 * Vše přes GitHub Contents API (GET/PUT single files).
 */

const GITHUB_API_BASE = 'https://api.github.com';
const AIO_SCHEMA_MARKER_START = '<!-- AIO:SCHEMA:START -->';
const AIO_SCHEMA_MARKER_END = '<!-- AIO:SCHEMA:END -->';

// ============================================
// Types
// ============================================

interface GitHubFileResponse {
  content: string;
  sha: string;
  encoding: string;
  name: string;
  path: string;
  size: number;
}

interface GitHubCommitResponse {
  content: {
    sha: string;
    path: string;
  };
  commit: {
    sha: string;
    message: string;
  };
}

export interface InjectionResult {
  repo: string;
  file: string;
  success: boolean;
  commitSha?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

// ============================================
// GitHub API Client
// ============================================

function getGitHubToken(): string {
  const token = process.env.GITHUB_PAT;
  if (!token) throw new Error('GITHUB_PAT env var is not configured');
  return token;
}

function githubHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getGitHubToken()}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Přečte soubor z GitHub repozitáře.
 * Vrací obsah (decoded) a SHA (potřebné pro update).
 */
export async function readFile(
  repo: string,
  path: string,
  branch: string = 'main',
): Promise<{ content: string; sha: string } | null> {
  const url = `${GITHUB_API_BASE}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;

  const response = await fetch(url, { headers: githubHeaders() });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as GitHubFileResponse;
  const content = Buffer.from(data.content, 'base64').toString('utf-8');

  return { content, sha: data.sha };
}

/**
 * Zapíše/aktualizuje soubor v GitHub repozitáři.
 * Pokud soubor existuje, sha je povinné (pro update).
 * Pokud neexistuje, sha je undefined (pro create).
 */
export async function writeFile(
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string = 'main',
  sha?: string,
): Promise<{ commitSha: string }> {
  const url = `${GITHUB_API_BASE}/repos/${repo}/contents/${encodeURIComponent(path)}`;

  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, 'utf-8').toString('base64'),
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: githubHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`GitHub API write error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as GitHubCommitResponse;
  return { commitSha: data.commit.sha };
}

// ============================================
// HTML Schema Injection
// ============================================

/**
 * Injektuje JSON-LD schema do HTML souboru.
 * Používá markery <!-- AIO:SCHEMA:START --> a <!-- AIO:SCHEMA:END -->
 * pro idempotentní aktualizace (nahradí existující schema).
 */
export function injectSchemaIntoHtml(
  html: string,
  jsonLdBlock: string,
): { html: string; changed: boolean } {
  const wrappedBlock = `${AIO_SCHEMA_MARKER_START}\n${jsonLdBlock}\n${AIO_SCHEMA_MARKER_END}`;

  // Check if markers already exist → replace
  const markerRegex = new RegExp(
    `${escapeRegex(AIO_SCHEMA_MARKER_START)}[\\s\\S]*?${escapeRegex(AIO_SCHEMA_MARKER_END)}`,
  );

  if (markerRegex.test(html)) {
    const existingMatch = html.match(markerRegex);
    if (existingMatch && existingMatch[0] === wrappedBlock) {
      return { html, changed: false };
    }
    return {
      html: html.replace(markerRegex, wrappedBlock),
      changed: true,
    };
  }

  // No markers → inject before </head>
  if (html.includes('</head>')) {
    return {
      html: html.replace('</head>', `${wrappedBlock}\n</head>`),
      changed: true,
    };
  }

  // No </head> → inject before </body>
  if (html.includes('</body>')) {
    return {
      html: html.replace('</body>', `${wrappedBlock}\n</body>`),
      changed: true,
    };
  }

  // Fallback: append at the end
  return {
    html: `${html}\n${wrappedBlock}`,
    changed: true,
  };
}

// ============================================
// Full Injection Pipeline
// ============================================

/**
 * Injektuje schema do jednoho HTML souboru v GitHub repu.
 * Idempotentní — pokud se schema nezměnilo, neodesílá commit.
 */
export async function injectSchemaToFile(
  repo: string,
  filePath: string,
  jsonLdBlock: string,
  branch: string = 'main',
): Promise<InjectionResult> {
  try {
    // Read current file
    const existing = await readFile(repo, filePath, branch);

    if (!existing) {
      return {
        repo,
        file: filePath,
        success: false,
        error: `File ${filePath} not found in ${repo}`,
      };
    }

    // Inject schema
    const { html: updatedHtml, changed } = injectSchemaIntoHtml(
      existing.content,
      jsonLdBlock,
    );

    if (!changed) {
      return {
        repo,
        file: filePath,
        success: true,
        skipped: true,
        reason: 'Schema unchanged',
      };
    }

    // Write back
    const { commitSha } = await writeFile(
      repo,
      filePath,
      updatedHtml,
      `AIO: Update schema.org metadata in ${filePath}`,
      branch,
      existing.sha,
    );

    return {
      repo,
      file: filePath,
      success: true,
      commitSha,
    };
  } catch (err) {
    return {
      repo,
      file: filePath,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Zapíše/aktualizuje llms.txt v kořenu repozitáře.
 */
export async function writeLlmsTxt(
  repo: string,
  content: string,
  branch: string = 'main',
): Promise<InjectionResult> {
  const filePath = 'llms.txt';

  try {
    const existing = await readFile(repo, filePath, branch);

    if (existing && existing.content === content) {
      return {
        repo,
        file: filePath,
        success: true,
        skipped: true,
        reason: 'llms.txt unchanged',
      };
    }

    const { commitSha } = await writeFile(
      repo,
      filePath,
      content,
      'AIO: Update llms.txt for AI crawlers',
      branch,
      existing?.sha,
    );

    return {
      repo,
      file: filePath,
      success: true,
      commitSha,
    };
  } catch (err) {
    return {
      repo,
      file: filePath,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Zapíše/aktualizuje ai-data.json v kořenu repozitáře.
 */
export async function writeAiDataJson(
  repo: string,
  data: Record<string, unknown>,
  branch: string = 'main',
): Promise<InjectionResult> {
  const filePath = 'ai-data.json';
  const content = JSON.stringify(data, null, 2);

  try {
    const existing = await readFile(repo, filePath, branch);

    if (existing && existing.content.trim() === content.trim()) {
      return {
        repo,
        file: filePath,
        success: true,
        skipped: true,
        reason: 'ai-data.json unchanged',
      };
    }

    const { commitSha } = await writeFile(
      repo,
      filePath,
      content,
      'AIO: Update ai-data.json with latest facts',
      branch,
      existing?.sha,
    );

    return {
      repo,
      file: filePath,
      success: true,
      commitSha,
    };
  } catch (err) {
    return {
      repo,
      file: filePath,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ============================================
// Batch Processing
// ============================================

export interface BatchInjectionConfig {
  repo: string;
  branch: string;
  htmlFiles: string[];
  jsonLdBlock: string;
  llmsTxt?: string;
  aiDataJson?: Record<string, unknown>;
}

/**
 * Zpracuje kompletní AIO injection pro jeden repozitář.
 * Injektuje schema do všech HTML souborů + llms.txt + ai-data.json.
 */
export async function processSiteInjection(
  config: BatchInjectionConfig,
): Promise<{
  results: InjectionResult[];
  totalFiles: number;
  injected: number;
  skipped: number;
  failed: number;
  lastCommitSha?: string;
}> {
  const results: InjectionResult[] = [];
  let lastCommitSha: string | undefined;

  // Inject schema into HTML files
  for (const htmlFile of config.htmlFiles) {
    const result = await injectSchemaToFile(
      config.repo,
      htmlFile,
      config.jsonLdBlock,
      config.branch,
    );
    results.push(result);
    if (result.commitSha) lastCommitSha = result.commitSha;

    // Rate limit: 100ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Write llms.txt
  if (config.llmsTxt) {
    const result = await writeLlmsTxt(config.repo, config.llmsTxt, config.branch);
    results.push(result);
    if (result.commitSha) lastCommitSha = result.commitSha;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Write ai-data.json
  if (config.aiDataJson) {
    const result = await writeAiDataJson(config.repo, config.aiDataJson, config.branch);
    results.push(result);
    if (result.commitSha) lastCommitSha = result.commitSha;
  }

  return {
    results,
    totalFiles: results.length,
    injected: results.filter((r) => r.success && !r.skipped).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => !r.success).length,
    lastCommitSha,
  };
}

// ============================================
// Helpers
// ============================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
