import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';
import opentype from 'opentype.js';
import path from 'path';

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
  const { searchParams } = request.nextUrl;

  const template = searchParams.get('t') || 'bold_card';
  const hook = searchParams.get('hook') || '';
  const body = searchParams.get('body') || '';
  const subtitle = searchParams.get('subtitle') || '';
  const project = searchParams.get('project') || '';
  const bg = searchParams.get('bg') || '0f0f23';
  const accent = searchParams.get('accent') || 'e94560';
  const textColor = searchParams.get('text') || 'ffffff';
  const logoUrl = searchParams.get('logo') || '';
  const photoUrl = searchParams.get('photo') || '';
  const platform = searchParams.get('platform') || 'facebook';

  const dims = getPlatformDimensions(platform);
  const width = parseInt(searchParams.get('w') || String(dims.w));
  const height = parseInt(searchParams.get('h') || String(dims.h));

  const ctx: TemplateContext = {
    hook, body, subtitle, project, bg, accent, textColor,
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

let _fontBold: opentype.Font | null = null;
let _fontReg: opentype.Font | null = null;
function getFont(bold: boolean = false): opentype.Font {
  if (bold) {
    if (!_fontBold) {
      _fontBold = opentype.loadSync(path.join(process.cwd(), 'fonts', 'Inter-Bold.ttf'));
    }
    return _fontBold;
  }
  if (!_fontReg) {
    _fontReg = opentype.loadSync(path.join(process.cwd(), 'fonts', 'Inter-Regular.ttf'));
  }
  return _fontReg;
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

/** Word-wrap text, clamped to maxLines. Last line gets "…" if truncated. */
function wrap(text: string, fontSize: number, maxPx: number, bold: boolean, maxLines: number): string[] {
  if (!text) return [];
  const cw = fontSize * (bold ? 0.57 : 0.47);
  const maxChars = Math.max(6, Math.floor(maxPx / cw));
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (test.length > maxChars && cur) {
      lines.push(cur);
      if (lines.length >= maxLines) { lines[lines.length - 1] += '…'; return lines; }
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) {
    if (lines.length >= maxLines) { lines[lines.length - 1] += '…'; }
    else lines.push(cur);
  }
  return lines;
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

function rrMask(w: number, h: number, r: number): Buffer {
  return Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/></svg>`, 'utf-8');
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
// Photo on top (~75%), brand strip at bottom with hook + logo.

async function renderPhotoStrip(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const stripRatio = s.mode === 'landscape' ? 0.30 : s.mode === 'story' ? 0.22 : 0.25;
  const stripH = Math.round(height * stripRatio);
  const photoH = height - stripH;
  const fadeH = Math.round(s.base * 0.06);
  const textMaxW = width - s.pad * 2 - s.logoSz - s.pad;
  // Font sizes relative to strip height so text always fits
  const stripHookFs = Math.round(stripH * 0.22);
  const stripBodyFs = Math.round(stripH * 0.13);

  const photo = await fetchImg(photoUrl, width, photoH);

  const hookT = svgText({ text: hook, x: s.pad, y: photoH + s.pad, fs: stripHookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: 2 });
  const bodyT = svgText({ text: body, x: s.pad, y: photoH + s.pad + hookT.totalH + 4, fs: stripBodyFs, bold: false, fill: `#${textColor}`, maxPx: textMaxW, maxLines: 2, opacity: 0.7 });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="${photoH}" width="${width}" height="${stripH}" fill="#${bg}"/>
    <rect x="0" y="${photoH}" width="${width}" height="${s.barH}" fill="#${accent}"/>
    <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#${bg}" stop-opacity="0"/><stop offset="100%" stop-color="#${bg}" stop-opacity="1"/></linearGradient></defs>
    <rect x="0" y="${photoH - fadeH}" width="${width}" height="${fadeH}" fill="url(#fade)"/>
    ${hookT.svg}${bodyT.svg}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];
  // Logo vertically centered in strip, right side
  const logo = await fetchLogo(ctx.logoUrl, s.logoSz);
  if (logo) composite.push({ input: logo, top: photoH + Math.round((stripH - s.logoSz) / 2), left: width - s.pad - s.logoSz });

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } })
    .composite(composite).png().toBuffer();
}

// ─── Template 3: Gradient ────────────────────────────────────
// Full-bleed photo, dark gradient from bottom, text at bottom, logo bottom-right.

async function renderGradient(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, accent, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const textMaxW = width - s.pad * 2 - s.logoSz - s.pad;

  // Text starts higher in landscape (less vertical space)
  const textStartY = s.mode === 'landscape' ? height * 0.38 : height * 0.55;
  const gradStart = s.mode === 'landscape' ? '15%' : '25%';

  const photo = await fetchImg(photoUrl, width, height);

  const hookT = svgText({ text: hook, x: s.pad, y: textStartY, fs: s.hookFs, bold: true, fill: '#ffffff', maxPx: textMaxW, maxLines: s.hookMax });
  const bodyT = svgText({ text: body, x: s.pad, y: textStartY + hookT.totalH + s.pad * 0.3, fs: s.bodyFs, bold: false, fill: '#ffffff', maxPx: textMaxW, maxLines: s.bodyMax, opacity: 0.85 });
  const subT = svgText({ text: subtitle, x: s.pad, y: textStartY + hookT.totalH + bodyT.totalH + s.pad * 0.5, fs: s.subFs, bold: false, fill: `#${accent}`, maxPx: textMaxW, maxLines: 2 });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="${gradStart}" stop-color="#000" stop-opacity="0.3"/>
      <stop offset="65%" stop-color="#000" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.92"/>
    </linearGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#grad)"/>
    ${hookT.svg}${bodyT.svg}${subT.svg}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];
  await addLogo(composite, ctx, s, true);

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
// RE/MAX style: large colored panel top-left with text, diagonal cut reveals photo bottom-right,
// white logo strip at bottom with subtle curve transition.

async function renderDiagonal(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, bg, accent, textColor, photoUrl, width, height } = ctx;
  const s = sizing(width, height);
  const isLand = s.mode === 'landscape';

  // Logo strip at bottom
  const logoStripH = Math.round(height * 0.12);
  const logoSz = Math.round(logoStripH * 0.55);

  // Diagonal cut points — color panel covers ~60% top-left, photo reveals bottom-right
  // The diagonal goes from left ~75% down to right ~15% down
  const cutLeftY = Math.round(height * (isLand ? 0.78 : 0.72));
  const cutRightY = Math.round(height * (isLand ? 0.18 : 0.22));

  // Curve transition above logo strip
  const curveY = height - logoStripH;
  const curveCtrl = Math.round(width * 0.3);

  const photo = await fetchImg(photoUrl, width, height);

  // Text layout — large hook, accent bar, body, subtitle
  const hookFs = isLand ? Math.round(s.base * 0.11) : Math.round(s.base * 0.085);
  const textMaxW = isLand ? Math.round(width * 0.48) : Math.round(width * 0.82);
  const textPad = Math.round(s.pad * 1.5);

  const hookT = svgText({ text: hook, x: textPad, y: textPad, fs: hookFs, bold: true, fill: `#${textColor}`, maxPx: textMaxW, maxLines: isLand ? 4 : 6 });
  const barY = textPad + hookT.totalH + Math.round(s.pad * 0.5);
  const barW = Math.round(s.base * 0.08);
  const barH = Math.round(s.base * 0.006);
  const bodyY = barY + barH + Math.round(s.pad * 0.5);
  const bodyT = svgText({ text: body, x: textPad, y: bodyY, fs: s.bodyFs, bold: false, fill: `#${textColor}`, maxPx: textMaxW, maxLines: s.bodyMax, opacity: 0.85 });
  const subY = bodyY + bodyT.totalH + Math.round(s.pad * 0.3);
  const subT = svgText({ text: subtitle, x: textPad, y: subY, fs: s.subFs, bold: false, fill: `#${accent}`, maxPx: textMaxW, maxLines: 2 });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Colored diagonal panel -->
    <polygon points="0,0 ${width},0 ${width},${cutRightY} 0,${cutLeftY}" fill="#${bg}"/>
    <!-- Left edge fill to curve -->
    <rect x="0" y="${cutLeftY}" width="${Math.round(width * 0.04)}" height="${curveY - cutLeftY}" fill="#${bg}"/>
    <!-- White logo strip with curve transition -->
    <path d="M0,${curveY} Q${curveCtrl},${curveY - Math.round(logoStripH * 0.4)} ${width},${curveY} L${width},${height} L0,${height} Z" fill="#ffffff"/>
    <!-- Text -->
    ${hookT.svg}
    <!-- Accent bar -->
    <rect x="${textPad}" y="${barY}" width="${barW}" height="${barH}" rx="1" fill="#${accent}"/>
    ${bodyT.svg}${subT.svg}
  </svg>`;

  const composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];
  const logo = await fetchLogo(ctx.logoUrl, logoSz);
  if (logo) composite.push({ input: logo, top: height - logoStripH + Math.round((logoStripH - logoSz) / 2), left: textPad });

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } }).composite(composite).png().toBuffer();
}
