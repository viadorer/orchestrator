import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';
import opentype from 'opentype.js';
import path from 'path';
import { requireAuth } from '@/lib/api/require-auth';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * Sharp-based Brand Template Engine (v2)
 * 
 * Adaptive sizing: all fonts/padding relative to min(width, height).
 * Portrait gets larger text (more vertical space).
 * Landscape gets compact layout.
 * Logo always bottom-right with padding.
 * Word-wrap with max line limits.
 * 
 * GET /api/visual/template-v2?t=quote_card&hook=...&body=...&bg=1a1a2e&accent=e94560&...
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { searchParams } = request.nextUrl;

  const VALID_TEMPLATE_KEYS = ['bold_card', 'photo_strip', 'split', 'gradient', 'text_logo', 'minimal', 'quote_card', 'diagonal', 'quote_overlay', 'cta_card', 'circle_cta'];
  const rawTemplate = searchParams.get('t') || 'bold_card';
  const template = VALID_TEMPLATE_KEYS.includes(rawTemplate) ? rawTemplate : 'bold_card';

  const hook = (searchParams.get('hook') || '').substring(0, 500);       // Max 500 chars
  const body = (searchParams.get('body') || '').substring(0, 500);
  const subtitle = (searchParams.get('subtitle') || '').substring(0, 300);
  const project = (searchParams.get('project') || '').substring(0, 100);
  const bg = (searchParams.get('bg') || '0f0f23').replace(/[^a-fA-F0-9]/g, '').substring(0, 6) || '0f0f23';
  const accent = (searchParams.get('accent') || 'e94560').replace(/[^a-fA-F0-9]/g, '').substring(0, 6) || 'e94560';
  const textColor = (searchParams.get('text') || 'ffffff').replace(/[^a-fA-F0-9]/g, '').substring(0, 6) || 'ffffff';
  const logoUrl = searchParams.get('logo') || '';
  const photoUrl = searchParams.get('photo') || '';
  const platform = searchParams.get('platform') || 'facebook';
  const fontParam = (searchParams.get('font') || 'inter').toLowerCase() as FontFamily;
  _currentFontFamily = VALID_FONTS.includes(fontParam) ? fontParam : 'inter';

  const dims = getPlatformDimensions(platform);
  const rawW = parseInt(searchParams.get('w') || String(dims.w));
  const rawH = parseInt(searchParams.get('h') || String(dims.h));
  // Clamp dimensions to reasonable range (100-4000px)
  const width = Math.max(100, Math.min(4000, isNaN(rawW) ? dims.w : rawW));
  const height = Math.max(100, Math.min(4000, isNaN(rawH) ? dims.h : rawH));

  // Auto-fix text contrast (WCAG AA: 3:1 minimum for large text)
  const safeTextColor = ensureContrast(textColor, bg, 3);

  const ctx: TemplateContext = {
    hook, body, subtitle, project, bg, accent, textColor: safeTextColor,
    logoUrl, photoUrl, width, height,
  };

  try {
    let buffer: Buffer;

    switch (template) {
      case 'photo_strip':
        buffer = await renderPhotoStrip(ctx);
        break;
      case 'split':
        buffer = await renderSplit(ctx);
        break;
      case 'gradient':
        buffer = await renderGradient(ctx);
        break;
      case 'text_logo':
        buffer = await renderTextLogo(ctx);
        break;
      case 'minimal':
        buffer = await renderMinimal(ctx);
        break;
      case 'quote_card':
        buffer = await renderQuoteCard(ctx);
        break;
      case 'diagonal':
        buffer = await renderDiagonal(ctx);
        break;
      case 'quote_overlay':
        buffer = await renderQuoteOverlay(ctx);
        break;
      case 'cta_card':
        buffer = await renderCtaCard(ctx);
        break;
      case 'circle_cta':
        buffer = await renderCircleCta(ctx);
        break;
      case 'bold_card':
      default:
        buffer = await renderBoldCard(ctx);
        break;
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (err) {
    console.error('[template-v2] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Template render failed' },
      { status: 500 }
    );
  }
}

// ─── Types ───────────────────────────────────────────────────

interface TemplateContext {
  hook: string;
  body: string;
  subtitle: string;
  project: string;
  bg: string;
  accent: string;
  textColor: string;
  logoUrl: string;
  photoUrl: string;
  width: number;
  height: number;
}

// ─── Platform Dimensions ─────────────────────────────────────

function getPlatformDimensions(platform: string): { w: number; h: number } {
  const dims: Record<string, { w: number; h: number }> = {
    facebook: { w: 1080, h: 1350 },
    facebook_portrait: { w: 1080, h: 1350 },
    facebook_square: { w: 1200, h: 1200 },
    facebook_landscape: { w: 1200, h: 630 },
    facebook_story: { w: 1080, h: 1920 },
    instagram: { w: 1080, h: 1350 },
    instagram_square: { w: 1080, h: 1080 },
    instagram_story: { w: 1080, h: 1920 },
    linkedin: { w: 1200, h: 627 },
    linkedin_square: { w: 1080, h: 1080 },
    linkedin_portrait: { w: 1080, h: 1350 },
    x: { w: 1200, h: 675 },
    tiktok: { w: 1080, h: 1920 },
    pinterest: { w: 1000, h: 1500 },
    threads: { w: 1080, h: 1350 },
    youtube: { w: 1280, h: 720 },
  };
  return dims[platform] || { w: 1200, h: 630 };
}

// ─── Adaptive Sizing ─────────────────────────────────────────

type AspectMode = 'portrait' | 'square' | 'landscape' | 'story';

interface Sizing {
  mode: AspectMode;
  base: number;       // min(w, h) — all sizes relative to this
  pad: number;        // consistent padding
  hookFs: number;     // hook font size
  bodyFs: number;     // body font size
  subFs: number;      // subtitle font size
  logoSz: number;     // logo size
  barH: number;       // accent bar height
  divW: number;       // divider width
  hookMax: number;    // max lines for hook
  bodyMax: number;    // max lines for body
  textW: number;      // max text width (for word-wrap)
}

function sizing(w: number, h: number): Sizing {
  const ratio = w / h;
  let mode: AspectMode;
  if (ratio < 0.7) mode = 'story';
  else if (ratio < 0.95) mode = 'portrait';
  else if (ratio <= 1.1) mode = 'square';
  else mode = 'landscape';

  const base = Math.min(w, h);
  const pad = Math.round(base * 0.05);

  // Font sizes: landscape uses smaller fonts (less vertical space)
  // Story/portrait uses larger fonts (more vertical space)
  const scale: Record<AspectMode, { hook: number; body: number; sub: number }> = {
    story:     { hook: 0.075, body: 0.038, sub: 0.030 },
    portrait:  { hook: 0.070, body: 0.035, sub: 0.028 },
    square:    { hook: 0.065, body: 0.033, sub: 0.026 },
    landscape: { hook: 0.090, body: 0.042, sub: 0.034 },
  };
  const s = scale[mode];

  return {
    mode, base, pad,
    hookFs: Math.round(base * s.hook),
    bodyFs: Math.round(base * s.body),
    subFs:  Math.round(base * s.sub),
    logoSz: Math.round(base * 0.09),
    barH:   Math.round(base * 0.005),
    divW:   Math.round(base * 0.07),
    hookMax: mode === 'landscape' ? 3 : 5,
    bodyMax: mode === 'landscape' ? 2 : 3,
    textW:   mode === 'landscape' ? Math.round(w * 0.55) : Math.round(w * 0.85),
  };
}

// ─── Helpers ─────────────────────────────────────────────────

// ─── Font Registry ──────────────────────────────────────────
// Supported fonts: inter (default), poppins, montserrat
// Each font has bold + regular variants for Czech diacritics.

type FontFamily = 'inter' | 'poppins' | 'montserrat';

const FONT_FILES: Record<FontFamily, { bold: string; regular: string }> = {
  inter: { bold: 'Inter-Bold.ttf', regular: 'Inter-Regular.ttf' },
  poppins: { bold: 'Poppins-Bold.ttf', regular: 'Poppins-Regular.ttf' },
  montserrat: { bold: 'Montserrat-Bold.ttf', regular: 'Montserrat-Regular.ttf' },
};

const VALID_FONTS = Object.keys(FONT_FILES) as FontFamily[];

const _fontCache: Record<string, opentype.Font> = {};

/** Current font family — set per request from ?font= param */
let _currentFontFamily: FontFamily = 'inter';

function getFont(bold: boolean = false): opentype.Font {
  const family = _currentFontFamily;
  const variant = bold ? 'bold' : 'regular';
  const cacheKey = `${family}_${variant}`;

  if (!_fontCache[cacheKey]) {
    const fileName = FONT_FILES[family]?.[variant] || FONT_FILES.inter[variant];
    _fontCache[cacheKey] = opentype.loadSync(path.join(process.cwd(), 'fonts', fileName));
  }
  return _fontCache[cacheKey];
}

function textToPath(text: string, x: number, y: number, fontSize: number, fill: string, opacity: number = 1, bold: boolean = true): string {
  const font = getFont(bold);
  const p = font.getPath(text, x, y, fontSize);
  return `<path d="${p.toPathData(2)}" fill="${fill}" opacity="${opacity}"/>`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0, 2), 16) || 0, g: parseInt(h.substring(2, 4), 16) || 0, b: parseInt(h.substring(4, 6), 16) || 0 };
}

/** WCAG relative luminance for a color channel */
function luminanceChannel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of RGB color */
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * luminanceChannel(r) + 0.7152 * luminanceChannel(g) + 0.0722 * luminanceChannel(b);
}

/** WCAG contrast ratio between two hex colors (without #) */
function contrastRatio(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Ensure text color has sufficient contrast against background.
 *  WCAG AA requires 4.5:1 for normal text, 3:1 for large text.
 *  If insufficient, returns white or black — whichever has better contrast. */
function ensureContrast(textHex: string, bgHex: string, minRatio: number = 3): string {
  const ratio = contrastRatio(textHex, bgHex);
  if (ratio >= minRatio) return textHex;
  // Pick white or black based on which has better contrast with bg
  const whiteRatio = contrastRatio('ffffff', bgHex);
  const blackRatio = contrastRatio('000000', bgHex);
  return whiteRatio >= blackRatio ? 'ffffff' : '000000';
}

/** Word-wrap text using real font metrics (opentype.js getAdvanceWidth).
 *  Clamped to maxLines. Last line gets "…" if truncated. */
function wrap(text: string, fontSize: number, maxPx: number, bold: boolean, maxLines: number): string[] {
  if (!text) return [];
  const font = getFont(bold);
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';

  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    const testWidth = font.getAdvanceWidth(test, fontSize);
    if (testWidth > maxPx && cur) {
      lines.push(cur);
      if (lines.length >= maxLines) {
        // Truncate last line with ellipsis
        lines[lines.length - 1] = truncateToFit(lines[lines.length - 1], font, fontSize, maxPx);
        return lines;
      }
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) {
    if (lines.length >= maxLines) {
      lines[lines.length - 1] = truncateToFit(lines[lines.length - 1], font, fontSize, maxPx);
    } else {
      lines.push(cur);
    }
  }
  return lines;
}

/** Truncate text to fit within maxPx, adding "…" */
function truncateToFit(text: string, font: opentype.Font, fontSize: number, maxPx: number): string {
  const ellipsis = '…';
  const ellipsisW = font.getAdvanceWidth(ellipsis, fontSize);
  if (font.getAdvanceWidth(text, fontSize) <= maxPx) return text;
  // Binary search for max length that fits
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (font.getAdvanceWidth(text.substring(0, mid) + ellipsis, fontSize) <= maxPx) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return text.substring(0, lo) + ellipsis;
}

/** Render SVG text lines using opentype.js paths. Returns { svg, totalH }. */
function svgText(opts: {
  text: string; x: number; y: number; fs: number; bold?: boolean;
  fill: string; maxPx: number; maxLines?: number; opacity?: number;
  lh?: number; anchor?: string;
}): { svg: string; totalH: number } {
  const { text, x, y, fs, bold = true, fill, maxPx, maxLines = 5, opacity = 1, lh = 1.3, anchor = 'start' } = opts;
  const lines = wrap(text, fs, maxPx, bold, maxLines);
  const lineH = Math.round(fs * lh);
  let svg = '';
  for (let i = 0; i < lines.length; i++) {
    const lineY = y + i * lineH + fs;
    let lineX = x;
    if (anchor === 'middle') {
      const font = getFont(bold);
      const adv = font.getAdvanceWidth(lines[i], fs);
      lineX = x - adv / 2;
    } else if (anchor === 'end') {
      const font = getFont(bold);
      const adv = font.getAdvanceWidth(lines[i], fs);
      lineX = x - adv;
    }
    svg += textToPath(lines[i], lineX, lineY, fs, fill, opacity, bold) + '\n';
  }
  return { svg, totalH: lines.length * lineH };
}

async function fetchImg(url: string, w: number, h: number): Promise<Buffer> {
  if (!url || url.length < 5) {
    return sharp({ create: { width: w, height: h, channels: 3, background: { r: 40, g: 40, b: 40 } } }).png().toBuffer();
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return sharp(Buffer.from(await res.arrayBuffer())).resize(w, h, { fit: 'cover', position: 'centre' }).png().toBuffer();
  } catch {
    return sharp({ create: { width: w, height: h, channels: 3, background: { r: 40, g: 40, b: 40 } } }).png().toBuffer();
  }
}

async function fetchLogo(url: string, size: number): Promise<Buffer | null> {
  if (!url || url.length < 5) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return sharp(Buffer.from(await res.arrayBuffer())).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  } catch { return null; }
}

/** SVG for logo background circle (for contrast on photos) */
function logoBgCircle(x: number, y: number, r: number): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(0,0,0,0.45)"/>`;
}

/** SVG for logo background pill — modern frosted glass effect */
function logoBgPill(x: number, y: number, w: number, h: number, radius: number, bgHex: string = '000000', opacity: number = 0.55): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="#${bgHex}" opacity="${opacity}"/>`;
}

/** Darken a hex color by a percentage (0-1). E.g. darken('ffffff', 0.1) → slightly darker */
function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/** Lighten a hex color by a percentage (0-1). */
function lightenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
  return [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function rrMask(w: number, h: number, r: number): Buffer {
  return Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/></svg>`, 'utf-8');
}

/** Final render: create base image, apply SVG overlay + composites, output PNG */
async function renderFinal(
  ctx: TemplateContext,
  svgContent: string,
  composites: sharp.OverlayOptions[],
  bgOverride?: { r: number; g: number; b: number },
): Promise<Buffer> {
  const bg = bgOverride || hexToRgb(ctx.bg);
  const svgBuf = Buffer.from(
    `<svg width="${ctx.width}" height="${ctx.height}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`,
    'utf-8',
  );
  return sharp({
    create: { width: ctx.width, height: ctx.height, channels: 4, background: bg },
  })
    .composite([{ input: svgBuf, top: 0, left: 0 }, ...composites])
    .png()
    .toBuffer();
}

/** Add logo to composite array — always bottom-right with padding, optional bg circle */
async function addLogo(composite: sharp.OverlayOptions[], ctx: TemplateContext, s: Sizing, withBg: boolean = false): Promise<string> {
  const logo = await fetchLogo(ctx.logoUrl, s.logoSz);
  let logoBgSvg = '';
  if (logo) {
    const lx = ctx.width - s.pad - s.logoSz;
    const ly = ctx.height - s.pad - s.logoSz;
    if (withBg) {
      const cx = lx + s.logoSz / 2;
      const cy = ly + s.logoSz / 2;
      logoBgSvg = logoBgCircle(cx, cy, Math.round(s.logoSz * 0.7));
    }
    composite.push({ input: logo, top: ly, left: lx });
  }
  return logoBgSvg;
}

// ─── Template 1: Bold Card ───────────────────────────────────
// Clean minimalist: UPPERCASE hook top-left, body below, logo circle bottom-right.

async function renderBoldCard(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, bg, accent, textColor, width, height } = ctx;
  const s = sizing(width, height);

  // Hook: massive UPPERCASE, left-aligned
  const hookUpper = (hook || '').toUpperCase();
  const bigHookFs = Math.round(s.base * 0.16);
  const textMaxW = width - s.pad * 2;

  const hookT = svgText({ text: hookUpper, x: s.pad, y: s.pad, fs: bigHookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: 4, lh: 1.1 });

  // Body: smaller bold text below hook
  const bodyFs = Math.round(s.base * 0.042);
  const bodyY = s.pad + hookT.totalH + s.pad * 0.8;
  const bodyMaxW = s.mode === 'landscape' ? Math.round(width * 0.55) : Math.round(width * 0.8);
  const bodyT = svgText({ text: body, x: s.pad, y: bodyY, fs: bodyFs, bold: true, fill: `#${textColor}`, maxPx: bodyMaxW, maxLines: s.bodyMax, lh: 1.35 });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#${bg}"/>
    ${hookT.svg}${bodyT.svg}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [{ input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 }];

  // Logo: clean, no border, bottom-right
  const logoSz = Math.round(s.mode === 'landscape' ? height * 0.18 : s.base * 0.14);
  const logo = await fetchLogo(ctx.logoUrl, logoSz);
  if (logo) {
    const logoX = width - s.pad - logoSz;
    const logoY = height - s.pad - logoSz;
    composite.push({ input: logo, top: logoY, left: logoX });
  }

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } })
    .composite(composite).png().toBuffer();
}

// ─── Template 2: Photo Strip ─────────────────────────────────
// Editorial magazine style: photo dominates top, elegant brand strip at bottom.
// Subtle gradient fade, accent line, dot accent before hook, logo in pill.

async function renderPhotoStrip(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);

  // Strip proportions — slightly smaller strip to let photo breathe
  const stripRatio = s.mode === 'landscape' ? 0.28 : s.mode === 'story' ? 0.20 : 0.22;
  const stripH = Math.round(height * stripRatio);
  const photoH = height - stripH;

  // Long, smooth fade from photo into strip (12% of base)
  const fadeH = Math.round(s.base * 0.12);

  // Accent line thickness — subtle but visible
  const accentBarH = Math.max(2, Math.round(s.base * 0.003));

  // Logo size — slightly larger for strip context
  const logoSz = Math.round(s.base * 0.10);

  // Text area: leave room for logo pill on right
  const logoPillW = logoSz + s.pad * 1.5;
  const textMaxW = width - s.pad * 2 - logoPillW;

  // Font sizes relative to strip height — hook prominent, body readable
  const stripHookFs = Math.round(stripH * 0.20);
  const stripBodyFs = Math.round(stripH * 0.12);

  // Accent dot size (small circle before hook text)
  const dotR = Math.round(stripHookFs * 0.14);
  const dotGap = Math.round(dotR * 3.5);

  // Inner padding within strip — generous breathing room
  const innerPad = Math.round(s.pad * 1.4);

  const photo = await fetchImg(photoUrl, width, photoH);

  // Hook text (with offset for accent dot)
  const hookX = s.pad + dotGap;
  const hookY = photoH + innerPad;
  const hookT = svgText({ text: hook, x: hookX, y: hookY, fs: stripHookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW - dotGap, maxLines: 2, lh: 1.2 });

  // Body text
  const bodyGap = Math.round(stripHookFs * 0.2);
  const bodyY = hookY + hookT.totalH + bodyGap;
  const bodyT = svgText({ text: body, x: s.pad, y: bodyY, fs: stripBodyFs, bold: false, fill: `#${textColor}`, maxPx: textMaxW, maxLines: 2, opacity: 0.75, lh: 1.35 });

  // Strip bg colors — subtle gradient from bg to slightly darker
  const bgDarker = darkenHex(bg, 0.12);

  // Accent dot position (vertically centered with first line of hook)
  const dotCx = s.pad + dotR;
  const dotCy = hookY + Math.round(stripHookFs * 0.65);

  // Logo pill dimensions
  const pillPad = Math.round(logoSz * 0.25);
  const pillW = logoSz + pillPad * 2;
  const pillH = logoSz + pillPad * 2;
  const pillR = Math.round(pillH * 0.22);
  const pillX = width - s.pad - pillW;
  const pillY = photoH + Math.round((stripH - pillH) / 2);

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Smooth fade from photo to strip -->
      <linearGradient id="ps-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#${bg}" stop-opacity="0"/>
        <stop offset="40%" stop-color="#${bg}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#${bg}" stop-opacity="1"/>
      </linearGradient>
      <!-- Strip background: subtle depth gradient -->
      <linearGradient id="ps-strip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#${bg}"/>
        <stop offset="100%" stop-color="#${bgDarker}"/>
      </linearGradient>
      <!-- Accent line glow -->
      <filter id="ps-glow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <!-- Strip background with gradient -->
    <rect x="0" y="${photoH}" width="${width}" height="${stripH}" fill="url(#ps-strip)"/>
    <!-- Long smooth fade transition -->
    <rect x="0" y="${photoH - fadeH}" width="${width}" height="${fadeH}" fill="url(#ps-fade)"/>
    <!-- Accent line with subtle glow -->
    <rect x="0" y="${photoH}" width="${width}" height="${accentBarH}" fill="#${accent}" opacity="0.85" filter="url(#ps-glow)"/>
    <!-- Accent dot before hook -->
    <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="#${accent}"/>
    <!-- Logo pill background -->
    ${logoBgPill(pillX, pillY, pillW, pillH, pillR, bg, 0.6)}
    <!-- Text -->
    ${hookT.svg}${bodyT.svg}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];

  // Logo centered in pill
  const logo = await fetchLogo(ctx.logoUrl, logoSz);
  if (logo) {
    composite.push({ input: logo, top: pillY + pillPad, left: pillX + pillPad });
  }

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } })
    .composite(composite).png().toBuffer();
}

// ─── Template 3: Gradient ────────────────────────────────────
// Apple/cinematic style: photo dominates, multi-layer gradient overlay,
// large elegant typography, frosted glass logo pill, accent signature line.

async function renderGradient(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, accent, photoUrl, width, height } = ctx;
  const s = sizing(width, height);

  // Larger logo for gradient template — more presence
  const logoSz = Math.round(s.base * 0.11);

  // Logo pill dimensions
  const pillPad = Math.round(logoSz * 0.3);
  const pillW = logoSz + pillPad * 2;
  const pillH = logoSz + pillPad * 2;
  const pillR = Math.round(pillH * 0.25);

  // Text max width — leave room for logo pill
  const textMaxW = width - s.pad * 2 - pillW - s.pad;

  // Hook font — larger than default for cinematic impact
  const gradHookFs = Math.round(s.base * (s.mode === 'landscape' ? 0.10 : 0.085));
  const gradBodyFs = Math.round(s.base * (s.mode === 'landscape' ? 0.042 : 0.038));
  const gradSubFs = Math.round(s.base * (s.mode === 'landscape' ? 0.034 : 0.030));

  // Text positioning — photo gets more space (62%), text at bottom
  const textStartY = s.mode === 'landscape' ? height * 0.42 : height * 0.60;

  // Accent line at very bottom
  const accentLineH = Math.max(2, Math.round(s.base * 0.003));

  const photo = await fetchImg(photoUrl, width, height);

  // Text rendering with generous spacing
  const hookT = svgText({ text: hook, x: s.pad, y: textStartY, fs: gradHookFs, bold: true, fill: '#ffffff', maxPx: textMaxW, maxLines: s.hookMax, lh: 1.15 });
  const bodyGap = Math.round(gradHookFs * 0.35);
  const bodyT = svgText({ text: body, x: s.pad, y: textStartY + hookT.totalH + bodyGap, fs: gradBodyFs, bold: false, fill: '#ffffff', maxPx: textMaxW, maxLines: s.bodyMax, opacity: 0.82, lh: 1.4 });
  // Subtitle in white with lower opacity (elegant, not accent-colored)
  const subGap = Math.round(gradBodyFs * 0.4);
  const subT = svgText({ text: subtitle, x: s.pad, y: textStartY + hookT.totalH + bodyGap + bodyT.totalH + subGap, fs: gradSubFs, bold: true, fill: '#ffffff', maxPx: textMaxW, maxLines: 2, opacity: 0.55 });

  // Logo pill position — right side, vertically aligned with hook
  const pillX = width - s.pad - pillW;
  const pillY = Math.round(textStartY + gradHookFs * 0.2);

  // Gradient stops — softer, more cinematic
  const gradTopOpacity = s.mode === 'landscape' ? '0.12' : '0.08';
  const gradMidStart = s.mode === 'landscape' ? '20%' : '30%';

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Main bottom gradient — cinematic, softer -->
      <linearGradient id="gr-main" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="${gradMidStart}" stop-color="#000" stop-opacity="0.12"/>
        <stop offset="55%" stop-color="#000" stop-opacity="0.55"/>
        <stop offset="78%" stop-color="#000" stop-opacity="0.78"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
      </linearGradient>
      <!-- Top vignette — subtle cinematic framing -->
      <radialGradient id="gr-vig" cx="50%" cy="0%" r="90%" fx="50%" fy="0%">
        <stop offset="0%" stop-color="#000" stop-opacity="${gradTopOpacity}"/>
        <stop offset="70%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <!-- Edge vignette — darkens corners for depth -->
      <radialGradient id="gr-edge" cx="50%" cy="50%" r="75%">
        <stop offset="60%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.25"/>
      </radialGradient>
      <!-- Frosted glass effect for logo pill -->
      <filter id="gr-frost"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>
    <!-- Multi-layer gradient overlay -->
    <rect width="${width}" height="${height}" fill="url(#gr-main)"/>
    <rect width="${width}" height="${height}" fill="url(#gr-vig)"/>
    <rect width="${width}" height="${height}" fill="url(#gr-edge)"/>
    <!-- Logo pill: frosted glass -->
    <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillR}" ry="${pillR}" fill="rgba(0,0,0,0.35)" filter="url(#gr-frost)"/>
    <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillR}" ry="${pillR}" fill="rgba(255,255,255,0.08)"/>
    <!-- Accent signature line at bottom -->
    <rect x="0" y="${height - accentLineH}" width="${width}" height="${accentLineH}" fill="#${accent}" opacity="0.7"/>
    <!-- Text -->
    ${hookT.svg}${bodyT.svg}${subT.svg}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];

  // Logo inside pill
  const logo = await fetchLogo(ctx.logoUrl, logoSz);
  if (logo) {
    composite.push({ input: logo, top: pillY + pillPad, left: pillX + pillPad });
  }

  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0 } } })
    .composite(composite).png().toBuffer();
}

// ─── Template 4: Split ───────────────────────────────────────
// Portrait/square: photo top, text bottom. Landscape: photo left, text right.

async function renderSplit(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const isLand = s.mode === 'landscape';
  const fadeSize = Math.round(s.base * 0.04);

  if (isLand) {
    const photoW = Math.round(width * 0.48);
    const textX = photoW + s.pad;
    const textMaxW = width - photoW - s.pad * 2;
    const photo = await fetchImg(photoUrl, photoW, height);

    const hookT = svgText({ text: hook, x: textX, y: s.pad, fs: s.hookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.hookMax });
    const bodyT = svgText({ text: body, x: textX, y: s.pad + hookT.totalH + s.pad * 0.3, fs: s.bodyFs, bold: false, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.bodyMax, opacity: 0.85 });
    const subT = svgText({ text: subtitle, x: textX, y: s.pad + hookT.totalH + bodyT.totalH + s.pad * 0.5, fs: s.subFs, bold: false, fill: `#${accent}`, maxPx: textMaxW, maxLines: 2 });

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${photoW}" y="0" width="${width - photoW}" height="${height}" fill="#${bg}"/>
      <defs><linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#${bg}" stop-opacity="0"/><stop offset="100%" stop-color="#${bg}" stop-opacity="1"/></linearGradient></defs>
      <rect x="${photoW - fadeSize}" y="0" width="${fadeSize}" height="${height}" fill="url(#fade)"/>
      <rect x="${textX}" y="${s.pad}" width="${s.barH}" height="${s.divW}" fill="#${accent}"/>
      ${hookT.svg}${bodyT.svg}${subT.svg}
    </svg>`;

    const composite: sharp.OverlayOptions[] = [
      { input: photo, top: 0, left: 0 },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ];
    await addLogo(composite, ctx, s);
    return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } }).composite(composite).png().toBuffer();
  } else {
    const photoH = Math.round(height * 0.5);
    const textY = photoH + s.pad;
    const textMaxW = width - s.pad * 2;
    const photo = await fetchImg(photoUrl, width, photoH);

    const hookT = svgText({ text: hook, x: s.pad, y: textY, fs: s.hookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.hookMax });
    const bodyT = svgText({ text: body, x: s.pad, y: textY + hookT.totalH + s.pad * 0.3, fs: s.bodyFs, bold: false, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.bodyMax, opacity: 0.85 });
    const subT = svgText({ text: subtitle, x: s.pad, y: textY + hookT.totalH + bodyT.totalH + s.pad * 0.5, fs: s.subFs, bold: false, fill: `#${accent}`, maxPx: textMaxW, maxLines: 2 });

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${photoH}" width="${width}" height="${height - photoH}" fill="#${bg}"/>
      <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#${bg}" stop-opacity="0"/><stop offset="100%" stop-color="#${bg}" stop-opacity="1"/></linearGradient></defs>
      <rect x="0" y="${photoH - fadeSize}" width="${width}" height="${fadeSize}" fill="url(#fade)"/>
      <rect x="${s.pad}" y="${photoH + s.pad * 0.3}" width="${s.barH}" height="${s.divW}" fill="#${accent}"/>
      ${hookT.svg}${bodyT.svg}${subT.svg}
    </svg>`;

    const composite: sharp.OverlayOptions[] = [
      { input: photo, top: 0, left: 0 },
      { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
    ];
    await addLogo(composite, ctx, s);
    return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } }).composite(composite).png().toBuffer();
  }
}

// ─── Template 5: Text + Logo ─────────────────────────────────
// Photo background, diagonal gradient overlay, text top-left, logo bottom-right.

async function renderTextLogo(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const textMaxW = s.mode === 'landscape' ? Math.round(width * 0.55) : Math.round(width * 0.7);

  const photo = await fetchImg(photoUrl, width, height);

  const hookT = svgText({ text: hook, x: s.pad, y: s.pad, fs: s.hookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.hookMax });
  const divY = s.pad + hookT.totalH + s.pad * 0.2;
  const bodyT = svgText({ text: body, x: s.pad, y: divY + s.barH + s.pad * 0.3, fs: s.bodyFs, bold: false, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.bodyMax, opacity: 0.9 });
  const subT = svgText({ text: subtitle, x: s.pad, y: divY + s.barH + s.pad * 0.3 + bodyT.totalH + s.pad * 0.2, fs: s.subFs, bold: false, fill: `#${accent}`, maxPx: textMaxW, maxLines: 2 });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="ov" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#${bg}" stop-opacity="0.88"/>
      <stop offset="40%" stop-color="#${bg}" stop-opacity="0.5"/>
      <stop offset="70%" stop-color="#${bg}" stop-opacity="0"/>
    </linearGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#ov)"/>
    <rect x="0" y="0" width="${s.barH}" height="${Math.round(height * 0.08)}" fill="#${accent}"/>
    <rect x="0" y="0" width="${Math.round(width * 0.08)}" height="${s.barH}" fill="#${accent}"/>
    <rect x="${s.pad}" y="${divY}" width="${s.divW}" height="${s.barH}" rx="2" fill="#${accent}"/>
    ${hookT.svg}${bodyT.svg}${subT.svg}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];
  await addLogo(composite, ctx, s, true);
  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } }).composite(composite).png().toBuffer();
}

// ─── Template 6: Minimal ─────────────────────────────────────
// Full photo, subtle bottom gradient, logo badge bottom-right.

async function renderMinimal(ctx: TemplateContext): Promise<Buffer> {
  const { photoUrl, width, height } = ctx;
  const s = sizing(width, height);

  const photo = await fetchImg(photoUrl, width, height);

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.5"/></linearGradient></defs>
    <rect x="0" y="${height - Math.round(height * 0.18)}" width="${width}" height="${Math.round(height * 0.18)}" fill="url(#g)"/>
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];
  await addLogo(composite, ctx, s, true);
  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0 } } }).composite(composite).png().toBuffer();
}

// ─── Template 7: Quote Card ──────────────────────────────────
// Landscape: text panel left + photo right. Portrait/square: text top + photo bottom.
// Dark frame, rounded inner panels, quote mark.

async function renderQuoteCard(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const gap = Math.round(s.base * 0.015);
  const rad = Math.round(s.base * 0.025);
  const isLand = s.mode === 'landscape';

  if (isLand) {
    const textW = Math.round(width * 0.55);
    const photoW = width - textW - gap * 3;
    const innerH = height - gap * 2;
    const textMaxW = textW - s.pad * 2;

    const photo = await fetchImg(photoUrl, photoW, innerH);
    const photoR = await sharp(photo).composite([{ input: rrMask(photoW, innerH, rad), blend: 'dest-in' }]).png().toBuffer();

    const quoteFs = Math.round(s.hookFs * 0.8);
    const hookT = svgText({ text: hook, x: gap + s.pad, y: gap + s.pad + quoteFs, fs: s.hookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.hookMax });
    const bodyT = svgText({ text: body, x: gap + s.pad, y: gap + s.pad + quoteFs + hookT.totalH + s.pad * 0.4, fs: s.bodyFs, bold: false, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.bodyMax, opacity: 0.7 });
    const subT = svgText({ text: subtitle, x: gap + s.pad, y: gap + s.pad + quoteFs + hookT.totalH + bodyT.totalH + s.pad * 0.6, fs: s.subFs, bold: false, fill: `#${accent}`, maxPx: textMaxW, maxLines: 2 });

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0a0a0a"/>
      <rect x="${gap}" y="${gap}" width="${textW}" height="${innerH}" rx="${rad}" fill="#${bg}"/>
      ${textToPath('„', gap + s.pad, gap + s.pad + quoteFs * 0.8, quoteFs, `#${textColor}`, 0.15)}
      ${hookT.svg}${bodyT.svg}${subT.svg}
    </svg>`;

    const composite: sharp.OverlayOptions[] = [
      { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
      { input: photoR, top: gap, left: textW + gap * 2 },
    ];
    // Logo bottom-left inside text panel for quote_card landscape
    const logo = await fetchLogo(ctx.logoUrl, s.logoSz);
    if (logo) composite.push({ input: logo, top: height - gap - s.pad - s.logoSz, left: gap + s.pad });

    return sharp({ create: { width, height, channels: 4, background: { r: 10, g: 10, b: 10 } } }).composite(composite).png().toBuffer();
  } else {
    const textH = Math.round(height * 0.55);
    const photoH = height - textH - gap * 3;
    const innerW = width - gap * 2;
    const textMaxW = innerW - s.pad * 2;

    const photo = await fetchImg(photoUrl, innerW, photoH);
    const photoR = await sharp(photo).composite([{ input: rrMask(innerW, photoH, rad), blend: 'dest-in' }]).png().toBuffer();

    const quoteFs = Math.round(s.hookFs * 0.8);
    const hookT = svgText({ text: hook, x: gap + s.pad, y: gap + s.pad + quoteFs, fs: s.hookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.hookMax });
    const bodyT = svgText({ text: body, x: gap + s.pad, y: gap + s.pad + quoteFs + hookT.totalH + s.pad * 0.4, fs: s.bodyFs, bold: false, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.bodyMax, opacity: 0.7 });
    const subT = svgText({ text: subtitle, x: gap + s.pad, y: gap + s.pad + quoteFs + hookT.totalH + bodyT.totalH + s.pad * 0.6, fs: s.subFs, bold: false, fill: `#${accent}`, maxPx: textMaxW, maxLines: 2 });

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0a0a0a"/>
      <rect x="${gap}" y="${gap}" width="${innerW}" height="${textH}" rx="${rad}" fill="#${bg}"/>
      ${textToPath('„', gap + s.pad, gap + s.pad + quoteFs * 0.8, quoteFs, `#${textColor}`, 0.15)}
      ${hookT.svg}${bodyT.svg}${subT.svg}
    </svg>`;

    const composite: sharp.OverlayOptions[] = [
      { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
      { input: photoR, top: textH + gap * 2, left: gap },
    ];
    const logo = await fetchLogo(ctx.logoUrl, s.logoSz);
    if (logo) composite.push({ input: logo, top: textH - s.logoSz - s.pad + gap, left: gap + s.pad });

    return sharp({ create: { width, height, channels: 4, background: { r: 10, g: 10, b: 10 } } }).composite(composite).png().toBuffer();
  }
}

// ─── Template 8: Diagonal ────────────────────────────────────
// Photo background, large bg-colored circle top-right, bold hook text top-left,
// body text below hook, logo in circular accent-bordered frame bottom-right.

async function renderDiagonal(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const isLand = s.mode === 'landscape';

  const photo = await fetchImg(photoUrl, width, height);

  // Large circle — ACCENT color, far top-right (center partially outside canvas)
  const circleR = Math.round(Math.min(width, height) * (isLand ? 0.55 : 0.55));
  const circleCx = Math.round(width * (isLand ? 0.82 : 0.78));
  const circleCy = Math.round(height * (isLand ? 0.15 : 0.12));

  // Text layout — large hook + body, top-left
  const textPad = Math.round(s.pad * 1.5);
  const hookFs = isLand ? Math.round(s.base * 0.1) : Math.round(s.base * 0.085);
  const textMaxW = isLand ? Math.round(width * 0.5) : Math.round(width * 0.7);

  const hookT = svgText({ text: hook, x: textPad, y: textPad, fs: hookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: isLand ? 3 : 5, lh: 1.1 });
  const bodyY = textPad + hookT.totalH + Math.round(s.pad * 0.4);
  const bodyFs = isLand ? Math.round(s.base * 0.04) : Math.round(s.base * 0.038);
  const bodyT = svgText({ text: body, x: textPad, y: bodyY, fs: bodyFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: isLand ? 2 : 3, opacity: 0.85 });

  // Text backdrop height — bg color gradient for readability
  const backdropH = bodyY + bodyT.totalH + Math.round(s.pad * 1.2);

  // Logo — clean, bottom-right, no frame
  const logoSz = Math.round(s.base * 0.08);

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- BG gradient backdrop for text readability -->
    <defs>
      <linearGradient id="txtBg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#${bg}" stop-opacity="0.75"/>
        <stop offset="60%" stop-color="#${bg}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#${bg}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${backdropH}" fill="url(#txtBg)"/>
    <!-- Large accent circle far top-right -->
    <circle cx="${circleCx}" cy="${circleCy}" r="${circleR}" fill="#${accent}" opacity="0.8"/>
    <!-- Text -->
    ${hookT.svg}
    ${bodyT.svg}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];

  
  // Place logo clean, bottom-right
  const logo = await fetchLogo(ctx.logoUrl, logoSz);
  if (logo) {
    composite.push({
      input: logo,
      top: height - textPad - logoSz,
      left: width - textPad - logoSz,
    });
  }

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } }).composite(composite).png().toBuffer();
}

// ─── Template 9: Quote Overlay ──────────────────────────────
// Photo background (person), dark gradient bottom, large quote mark, citation + author.
// Inspired by First Class podcast style.

async function renderQuoteOverlay(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const isLand = s.mode === 'landscape';

  const photo = await fetchImg(photoUrl, width, height);

  // Quote mark size and position
  const quoteFs = Math.round(s.base * (isLand ? 0.12 : 0.1));
  const quoteMark = textToPath('\u201e', s.pad, Math.round(height * 0.48), quoteFs, `#${accent}`, 1, true);

  // Hook = the quote text, positioned below quote mark
  const hookFs = isLand ? Math.round(s.base * 0.065) : Math.round(s.base * 0.06);
  const hookY = Math.round(height * 0.50);
  const textMaxW = isLand ? Math.round(width * 0.7) : Math.round(width * 0.85);
  const hookT = svgText({ text: hook, x: s.pad, y: hookY, fs: hookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: isLand ? 4 : 5, lh: 1.25 });

  // Body = author name, below hook
  const bodyY = hookY + hookT.totalH + Math.round(s.pad * 0.6);
  const bodyT = svgText({ text: body, x: s.pad, y: bodyY, fs: s.bodyFs, bold: false, fill: `#${textColor}`, maxPx: textMaxW, maxLines: 2, opacity: 0.8 });

  // Gradient: transparent top -> dark bottom (covers ~60% of image height)
  const gradTop = Math.round(height * 0.35);
  const { r, g, b } = hexToRgb(bg);

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="qog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgb(${r},${g},${b})" stop-opacity="0"/>
        <stop offset="0.3" stop-color="rgb(${r},${g},${b})" stop-opacity="0.6"/>
        <stop offset="1" stop-color="rgb(${r},${g},${b})" stop-opacity="0.95"/>
      </linearGradient>
    </defs>
    <rect y="${gradTop}" width="${width}" height="${height - gradTop}" fill="url(#qog)"/>
    ${quoteMark}
    ${hookT.svg}${bodyT.svg}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];

  // Logo top-right
  const logoSz = Math.round(s.base * 0.1);
  const logo = await fetchLogo(ctx.logoUrl, logoSz);
  if (logo) composite.push({ input: logo, top: s.pad, left: width - s.pad - logoSz });

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } }).composite(composite).png().toBuffer();
}

// ─── Template 10: CTA Card ──────────────────────────────────
// Deel style: photo on top, accent colored panel at bottom with rounded top corners,
// large hook text + CTA button (body text) + logo bottom-right.

async function renderCtaCard(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const isLand = s.mode === 'landscape';

  // Panel dimensions
  const panelH = Math.round(height * (isLand ? 0.38 : 0.40));
  const panelY = height - panelH;
  const panelRad = Math.round(s.base * 0.03);
  const panelPad = Math.round(s.pad * 1.3);

  const photo = await fetchImg(photoUrl, width, height);

  // Accent icon circle above panel (left side)
  const iconR = Math.round(s.base * 0.04);
  const iconCx = panelPad + iconR;
  const iconCy = panelY - iconR - Math.round(s.pad * 0.3);

  // Hook text on panel — dark text on accent bg
  const hookFs = isLand ? Math.round(s.base * 0.075) : Math.round(s.base * 0.065);
  const textMaxW = isLand ? Math.round(width * 0.65) : Math.round(width * 0.85);
  const hookTextY = panelY + panelPad;
  const hookT = svgText({ text: hook, x: panelPad, y: hookTextY, fs: hookFs, bold: true, fill: `#${bg}`, maxPx: textMaxW, maxLines: isLand ? 3 : 4, lh: 1.2 });

  // CTA button (body text inside rounded rect)
  const ctaFs = Math.round(s.base * 0.028);
  const ctaH = Math.round(ctaFs * 2.8);
  const ctaY = hookTextY + hookT.totalH + Math.round(s.pad * 0.6);
  const ctaPadX = Math.round(ctaFs * 1.5);
  const font = getFont(true);
  const ctaTextW = Math.round(font.getAdvanceWidth(body || 'Více info', ctaFs));
  const ctaW = ctaTextW + ctaPadX * 2;
  const ctaRad = Math.round(ctaH / 2);
  const ctaTextPath = textToPath(body || 'Více info', panelPad + ctaPadX, ctaY + ctaH * 0.65, ctaFs, `#${accent}`, 1, true);

  // Logo bottom-right on panel
  const logoSz = Math.round(s.base * 0.1);

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Accent panel with rounded top corners -->
    <path d="M0,${panelY + panelRad} Q0,${panelY} ${panelRad},${panelY} L${width - panelRad},${panelY} Q${width},${panelY} ${width},${panelY + panelRad} L${width},${height} L0,${height} Z" fill="#${accent}"/>
    <!-- Icon circle above panel -->
    <circle cx="${iconCx}" cy="${iconCy}" r="${iconR}" fill="#${accent}"/>
    ${textToPath('\u2193', iconCx - Math.round(iconR * 0.4), iconCy + Math.round(iconR * 0.4), Math.round(iconR * 1.2), `#${textColor}`, 1, true)}
    <!-- Hook text -->
    ${hookT.svg}
    <!-- CTA button -->
    <rect x="${panelPad}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${ctaRad}" fill="#${bg}"/>
    ${ctaTextPath}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];

  const logo = await fetchLogo(ctx.logoUrl, logoSz);
  if (logo) composite.push({ input: logo, top: height - panelPad - logoSz, left: width - panelPad - logoSz });

  return sharp({ create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255 } } }).composite(composite).png().toBuffer();
}

// ─── Template 11: Circle CTA ───────────────────────────────
// odhad.online style: photo background, large ACCENT circle left with WHITE hook text,
// white CTA button with accent text below circle, logo on accent badge top-right.

async function renderCircleCta(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const isLand = s.mode === 'landscape';

  const photo = await fetchImg(photoUrl, width, height);

  // Circle — ACCENT color, left side, centered vertically
  const circleR = Math.round(Math.min(width, height) * (isLand ? 0.4 : 0.42));
  const circleCx = Math.round(width * (isLand ? 0.25 : 0.22));
  const circleCy = Math.round(height * (isLand ? 0.45 : 0.42));

  // Hook text inside circle — WHITE on accent
  const textPad = Math.round(s.pad * 1.2);
  const hookFs = isLand ? Math.round(s.base * 0.06) : Math.round(s.base * 0.055);
  const textMaxW = Math.round(circleR * 1.2);
  const textX = Math.max(textPad, Math.round(circleCx - circleR * 0.45));
  const textY = Math.round(circleCy - circleR * 0.35);
  const hookT = svgText({ text: hook, x: textX, y: textY, fs: hookFs, bold: true, fill: '#ffffff', maxPx: textMaxW, maxLines: isLand ? 5 : 6, lh: 1.15 });

  // CTA button — WHITE rounded rect with ACCENT text, below circle
  const ctaFs = Math.round(s.base * 0.035);
  const ctaH = Math.round(ctaFs * 2.6);
  const ctaY = circleCy + circleR + Math.round(s.pad * 0.3);
  const ctaPadX = Math.round(ctaFs * 2);
  const font = getFont(true);
  const ctaLabel = body || 'Více info';
  const ctaTextW = Math.round(font.getAdvanceWidth(ctaLabel, ctaFs));
  const ctaW = ctaTextW + ctaPadX * 2;
  const ctaRad = Math.round(ctaH / 2);
  const ctaTextPath = textToPath(ctaLabel, textX + ctaPadX, ctaY + ctaH * 0.65, ctaFs, `#${accent}`, 1, true);

  // Logo badge — accent rect with logo, top-right
  const logoSz = Math.round(s.base * 0.05);
  const badgePad = Math.round(s.pad * 0.5);
  const badgeH = Math.round(logoSz + badgePad * 1.6);
  const badgeW = Math.round(logoSz * 3.5);
  const badgeX = width - badgeW - Math.round(s.pad * 0.6);
  const badgeY = Math.round(s.pad * 0.6);
  const badgeR = Math.round(badgeH * 0.25);

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Accent circle left -->
    <circle cx="${circleCx}" cy="${circleCy}" r="${circleR}" fill="#${accent}"/>
    <!-- Hook text (white on accent) -->
    ${hookT.svg}
    <!-- CTA button (white with accent text) -->
    <rect x="${textX}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${ctaRad}" fill="#ffffff"/>
    ${ctaTextPath}
    <!-- Logo badge top-right -->
    <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="${badgeR}" fill="#${accent}"/>
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];

  // Place logo inside accent badge
  const logo = await fetchLogo(ctx.logoUrl, logoSz);
  if (logo) {
    composite.push({
      input: logo,
      top: badgeY + Math.round((badgeH - logoSz) / 2),
      left: badgeX + Math.round(badgePad * 0.8),
    });
  }

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } }).composite(composite).png().toBuffer();
}
