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
const AIO_JSX_MARKER_START = '{/* AIO:SCHEMA:START */}';
const AIO_JSX_MARKER_END = '{/* AIO:SCHEMA:END */}';

export type SiteType = 'html' | 'nextjs' | 'astro' | 'hugo' | 'sveltekit';

interface DetectedProject {
  siteType: SiteType;
  layoutFile: string | null;
  publicDir: string;
}

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
  previousSha?: string;
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
// Project Type Detection
// ============================================

/**
 * Auto-detekuje typ projektu z GitHub repozitáře.
 * Čte package.json a konfigurační soubory.
 */
export async function detectProjectType(
  repo: string,
  branch: string = 'main',
): Promise<DetectedProject> {
  // Try package.json first
  const pkg = await readFile(repo, 'package.json', branch);

  if (pkg) {
    try {
      const parsed = JSON.parse(pkg.content) as Record<string, unknown>;
      const deps = {
        ...(parsed.dependencies as Record<string, string> || {}),
        ...(parsed.devDependencies as Record<string, string> || {}),
      };

      // Next.js detection
      if (deps.next) {
        const layoutFile = await findNextjsLayout(repo, branch);
        return { siteType: 'nextjs', layoutFile, publicDir: 'public' };
      }

      // Astro detection
      if (deps.astro) {
        const layoutFile = await findAstroLayout(repo, branch);
        return { siteType: 'astro', layoutFile, publicDir: 'public' };
      }

      // SvelteKit detection
      if (deps['@sveltejs/kit']) {
        return { siteType: 'sveltekit', layoutFile: 'src/app.html', publicDir: 'static' };
      }
    } catch {
      // Invalid package.json, fall through
    }
  }

  // Hugo detection (config.toml / hugo.toml)
  const hugoConfig = await readFile(repo, 'hugo.toml', branch)
    || await readFile(repo, 'config.toml', branch);
  if (hugoConfig) {
    return { siteType: 'hugo', layoutFile: 'layouts/_default/baseof.html', publicDir: 'static' };
  }

  // Default: static HTML
  return { siteType: 'html', layoutFile: null, publicDir: '' };
}

async function findNextjsLayout(
  repo: string,
  branch: string,
): Promise<string | null> {
  // App Router (preferred)
  const appLayout = await readFile(repo, 'src/app/layout.tsx', branch);
  if (appLayout) return 'src/app/layout.tsx';

  const appLayoutJs = await readFile(repo, 'src/app/layout.jsx', branch);
  if (appLayoutJs) return 'src/app/layout.jsx';

  const rootAppLayout = await readFile(repo, 'app/layout.tsx', branch);
  if (rootAppLayout) return 'app/layout.tsx';

  const rootAppLayoutJs = await readFile(repo, 'app/layout.jsx', branch);
  if (rootAppLayoutJs) return 'app/layout.jsx';

  // Pages Router fallback
  const pagesDoc = await readFile(repo, 'src/pages/_document.tsx', branch);
  if (pagesDoc) return 'src/pages/_document.tsx';

  const rootPagesDoc = await readFile(repo, 'pages/_document.tsx', branch);
  if (rootPagesDoc) return 'pages/_document.tsx';

  return null;
}

async function findAstroLayout(
  repo: string,
  branch: string,
): Promise<string | null> {
  const layout = await readFile(repo, 'src/layouts/Layout.astro', branch);
  if (layout) return 'src/layouts/Layout.astro';

  const base = await readFile(repo, 'src/layouts/BaseLayout.astro', branch);
  if (base) return 'src/layouts/BaseLayout.astro';

  return null;
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
// JSX/TSX Layout Injection (Next.js, Astro)
// ============================================

/**
 * Injektuje JSON-LD schema do Next.js layout.tsx.
 * Bezpečný marker-based přístup s AIO:SCHEMA:START / AIO:SCHEMA:END markery.
 *
 * Pro App Router vkládá script tag do head sekce.
 * Nikdy nemazá existující kód — pouze přidává/nahrazuje mezi markery.
 */
export function injectSchemaIntoJsx(
  source: string,
  jsonLdBlock: string,
  fileType: 'nextjs-app' | 'nextjs-pages' | 'astro' | 'sveltekit' = 'nextjs-app',
): { source: string; changed: boolean } {
  const scriptTag = `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: \`${jsonLdBlock}\` }} />`;

  let wrappedBlock: string;
  let markerStart: string;
  let markerEnd: string;

  if (fileType === 'astro') {
    markerStart = AIO_SCHEMA_MARKER_START;
    markerEnd = AIO_SCHEMA_MARKER_END;
    wrappedBlock = `${markerStart}\n<script type="application/ld+json" set:html={\`${jsonLdBlock}\`} />\n${markerEnd}`;
  } else if (fileType === 'sveltekit') {
    markerStart = AIO_SCHEMA_MARKER_START;
    markerEnd = AIO_SCHEMA_MARKER_END;
    wrappedBlock = `${markerStart}\n{@html \`<script type="application/ld+json">${jsonLdBlock}</script>\`}\n${markerEnd}`;
  } else {
    markerStart = AIO_JSX_MARKER_START;
    markerEnd = AIO_JSX_MARKER_END;
    wrappedBlock = `${markerStart}\n            ${scriptTag}\n            ${markerEnd}`;
  }

  // Check if markers already exist → replace
  const markerRegex = new RegExp(
    `${escapeRegex(markerStart)}[\\s\\S]*?${escapeRegex(markerEnd)}`,
  );

  if (markerRegex.test(source)) {
    const existingMatch = source.match(markerRegex);
    if (existingMatch && existingMatch[0] === wrappedBlock) {
      return { source, changed: false };
    }
    return {
      source: source.replace(markerRegex, wrappedBlock),
      changed: true,
    };
  }

  // No markers → find safe injection point
  if (fileType === 'nextjs-app') {
    // App Router: inject inside <head> or before </head> in layout
    if (source.includes('</head>')) {
      return {
        source: source.replace('</head>', `          ${wrappedBlock}\n          </head>`),
        changed: true,
      };
    }
    // No explicit <head> — inject before <body or {children}
    if (source.includes('<body')) {
      return {
        source: source.replace('<body', `${wrappedBlock}\n        <body`),
        changed: true,
      };
    }
  }

  if (fileType === 'astro') {
    if (source.includes('</head>')) {
      return {
        source: source.replace('</head>', `  ${wrappedBlock}\n  </head>`),
        changed: true,
      };
    }
  }

  if (fileType === 'sveltekit') {
    if (source.includes('</head>')) {
      return {
        source: source.replace('</head>', `  ${wrappedBlock}\n  </head>`),
        changed: true,
      };
    }
  }

  // Fallback: cannot find safe injection point
  return { source, changed: false };
}

/**
 * Validuje že JSX/TSX soubor je stále syntakticky validní po injection.
 * Základní kontroly — ne plný parser, ale chytí nejčastější problémy.
 */
function validateJsxAfterInjection(source: string): { valid: boolean; error?: string } {
  // Check balanced braces
  let braceCount = 0;
  for (const ch of source) {
    if (ch === '{') braceCount++;
    if (ch === '}') braceCount--;
    if (braceCount < 0) return { valid: false, error: 'Unbalanced closing brace' };
  }
  if (braceCount !== 0) return { valid: false, error: `Unbalanced braces: ${braceCount} unclosed` };

  // Check markers are paired
  const jsxStarts = (source.match(new RegExp(escapeRegex(AIO_JSX_MARKER_START), 'g')) || []).length;
  const jsxEnds = (source.match(new RegExp(escapeRegex(AIO_JSX_MARKER_END), 'g')) || []).length;
  if (jsxStarts !== jsxEnds) return { valid: false, error: 'Unpaired AIO markers' };

  // Check no duplicate markers
  if (jsxStarts > 1) return { valid: false, error: 'Duplicate AIO markers' };

  return { valid: true };
}

// ============================================
// Full Injection Pipeline
// ============================================

/**
 * Injektuje schema do jednoho souboru v GitHub repu.
 * Automaticky rozpozná HTML vs JSX/TSX a použije správnou strategii.
 * Idempotentní — pokud se schema nezměnilo, neodesílá commit.
 */
export async function injectSchemaToFile(
  repo: string,
  filePath: string,
  jsonLdBlock: string,
  branch: string = 'main',
  siteType: SiteType = 'html',
): Promise<InjectionResult> {
  try {
    const existing = await readFile(repo, filePath, branch);

    if (!existing) {
      return {
        repo,
        file: filePath,
        success: false,
        error: `File ${filePath} not found in ${repo}`,
      };
    }

    const previousSha = existing.sha;
    let updatedContent: string;
    let changed: boolean;

    const isJsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
    const isAstro = filePath.endsWith('.astro');
    const isSvelte = filePath.endsWith('.html') && siteType === 'sveltekit';

    if (isJsx || isAstro || isSvelte) {
      // Framework layout injection
      const fileType = isAstro ? 'astro' as const
        : isSvelte ? 'sveltekit' as const
        : filePath.includes('_document') ? 'nextjs-pages' as const
        : 'nextjs-app' as const;

      const result = injectSchemaIntoJsx(existing.content, jsonLdBlock, fileType);
      updatedContent = result.source;
      changed = result.changed;

      // Bezpečnostní validace pro JSX
      if (changed && isJsx) {
        const validation = validateJsxAfterInjection(updatedContent);
        if (!validation.valid) {
          return {
            repo,
            file: filePath,
            success: false,
            error: `Safety check failed: ${validation.error}. Injection aborted.`,
          };
        }
      }
    } else {
      // Static HTML injection
      const result = injectSchemaIntoHtml(existing.content, jsonLdBlock);
      updatedContent = result.html;
      changed = result.changed;
    }

    if (!changed) {
      return {
        repo,
        file: filePath,
        success: true,
        skipped: true,
        reason: 'Schema unchanged',
      };
    }

    const { commitSha } = await writeFile(
      repo,
      filePath,
      updatedContent,
      `AIO: Update schema.org metadata in ${filePath}`,
      branch,
      existing.sha,
    );

    return {
      repo,
      file: filePath,
      success: true,
      commitSha,
      previousSha,
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
 * Zapíše/aktualizuje llms.txt.
 * Pro dynamické projekty zapisuje do public/ adresáře.
 */
export async function writeLlmsTxt(
  repo: string,
  content: string,
  branch: string = 'main',
  publicDir: string = '',
): Promise<InjectionResult> {
  const filePath = publicDir ? `${publicDir}/llms.txt` : 'llms.txt';

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
 * Zapíše/aktualizuje ai-data.json.
 * Pro dynamické projekty zapisuje do public/ adresáře.
 */
export async function writeAiDataJson(
  repo: string,
  data: Record<string, unknown>,
  branch: string = 'main',
  publicDir: string = '',
): Promise<InjectionResult> {
  const filePath = publicDir ? `${publicDir}/ai-data.json` : 'ai-data.json';
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
  siteType?: SiteType;
  layoutFile?: string | null;
  publicDir?: string;
}

/**
 * Zpracuje kompletní AIO injection pro jeden repozitář.
 * Automaticky rozlišuje statické HTML a dynamické projekty (Next.js, Astro...).
 *
 * Pro dynamické projekty:
 * 1. Injektuje schema do layout souboru (layout.tsx, Layout.astro...)
 * 2. Zapisuje llms.txt a ai-data.json do public/ adresáře
 *
 * Pro statické HTML:
 * 1. Injektuje schema do HTML souborů
 * 2. Zapisuje llms.txt a ai-data.json do rootu
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
  previousSha?: string;
  detectedType?: SiteType;
}> {
  const results: InjectionResult[] = [];
  let lastCommitSha: string | undefined;
  let firstPreviousSha: string | undefined;

  // Auto-detect project type if not specified
  const siteType = config.siteType || 'html';
  const publicDir = config.publicDir ?? (siteType === 'html' ? '' : 'public');

  // For dynamic projects: inject into layout file
  if (siteType !== 'html' && config.layoutFile) {
    const result = await injectSchemaToFile(
      config.repo,
      config.layoutFile,
      config.jsonLdBlock,
      config.branch,
      siteType,
    );
    results.push(result);
    if (result.commitSha) lastCommitSha = result.commitSha;
    if (result.previousSha && !firstPreviousSha) firstPreviousSha = result.previousSha;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // For static HTML: inject into each HTML file
  if (siteType === 'html') {
    for (const htmlFile of config.htmlFiles) {
      const result = await injectSchemaToFile(
        config.repo,
        htmlFile,
        config.jsonLdBlock,
        config.branch,
        'html',
      );
      results.push(result);
      if (result.commitSha) lastCommitSha = result.commitSha;
      if (result.previousSha && !firstPreviousSha) firstPreviousSha = result.previousSha;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Write llms.txt (respects publicDir)
  if (config.llmsTxt) {
    const result = await writeLlmsTxt(config.repo, config.llmsTxt, config.branch, publicDir);
    results.push(result);
    if (result.commitSha) lastCommitSha = result.commitSha;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Write ai-data.json (respects publicDir)
  if (config.aiDataJson) {
    const result = await writeAiDataJson(config.repo, config.aiDataJson, config.branch, publicDir);
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
    previousSha: firstPreviousSha,
    detectedType: siteType,
  };
}

// ============================================
// Helpers
// ============================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
