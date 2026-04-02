import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';
import opentype from 'opentype.js';
import path from 'path';
import { requireAuth } from '@/lib/api/require-auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Carousel Generator API
 *
 * POST /api/visual/carousel
 * Body: { slides: CarouselSlide[], style: CarouselStyle }
 * Returns: { slides: { index: number; png_base64: string }[] }
 *
 * Generates multi-slide carousel images for Instagram/LinkedIn/TikTok.
 * Each slide is a branded PNG with consistent styling.
 */

interface CarouselSlide {
  /** Slide type determines layout */
  type: 'cover' | 'content' | 'cta';
  /** Main text (large) */
  hook: string;
  /** Secondary text */
  body?: string;
  /** Slide number label (e.g. "01", "2/5") */
  number?: string;
  /** Photo URL for background */
  photoUrl?: string;
}

interface CarouselStyle {
  bg: string;        // hex without #
  accent: string;
  text: string;
  logoUrl?: string;
  platform: 'instagram' | 'linkedin' | 'facebook' | 'tiktok';
  /** Template style */
  template?: 'minimal' | 'bold' | 'magazine';
}

interface CarouselRequest {
  slides: CarouselSlide[];
  style: CarouselStyle;
}

// ─── Font loading (shared with template-v2) ──────────────────
let _fontBold: opentype.Font | null = null;
let _fontReg: opentype.Font | null = null;
function getFont(bold: boolean = false): opentype.Font {
  if (bold) {
    if (!_fontBold) _fontBold = opentype.loadSync(path.join(process.cwd(), 'fonts', 'Inter-Bold.ttf'));
    return _fontBold;
  }
  if (!_fontReg) _fontReg = opentype.loadSync(path.join(process.cwd(), 'fonts', 'Inter-Regular.ttf'));
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

/** Word-wrap using real font metrics */
function wrap(text: string, fontSize: number, maxPx: number, bold: boolean, maxLines: number): string[] {
  if (!text) return [];
  const font = getFont(bold);
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (font.getAdvanceWidth(test, fontSize) > maxPx && cur) {
      lines.push(cur);
      if (lines.length >= maxLines) return lines;
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

function svgTextBlock(text: string, x: number, y: number, fs: number, bold: boolean, fill: string, maxPx: number, maxLines: number, lh: number = 1.3): { svg: string; totalH: number } {
  const lines = wrap(text, fs, maxPx, bold, maxLines);
  const lineH = Math.round(fs * lh);
  let svg = '';
  for (let i = 0; i < lines.length; i++) {
    svg += textToPath(lines[i], x, y + i * lineH + fs, fs, fill, 1, bold) + '\n';
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

// ─── Platform dimensions ─────────────────────────────────────
function getCarouselDims(platform: string): { w: number; h: number } {
  switch (platform) {
    case 'instagram': return { w: 1080, h: 1350 };
    case 'linkedin': return { w: 1080, h: 1080 };
    case 'tiktok': return { w: 1080, h: 1920 };
    case 'facebook': return { w: 1080, h: 1080 };
    default: return { w: 1080, h: 1350 };
  }
}

// ─── Slide Renderers ─────────────────────────────────────────

/** COVER slide — big hook text, accent bar, logo */
async function renderCover(
  slide: CarouselSlide, style: CarouselStyle, w: number, h: number,
): Promise<Buffer> {
  const pad = Math.round(w * 0.06);
  const hookFs = Math.round(w * 0.09);
  const bodyFs = Math.round(w * 0.035);
  const textMaxW = w - pad * 2;
  const barH = Math.round(w * 0.006);

  const composites: sharp.OverlayOptions[] = [];

  // Photo background if provided
  if (slide.photoUrl) {
    const photo = await fetchImg(slide.photoUrl, w, h);
    composites.push({ input: photo, top: 0, left: 0 });
  }

  // Hook text — centered vertically
  const hookT = svgTextBlock(slide.hook, pad, Math.round(h * 0.30), hookFs, true, `#${style.text}`, textMaxW, 5, 1.15);
  const bodyT = slide.body
    ? svgTextBlock(slide.body, pad, Math.round(h * 0.30) + hookT.totalH + pad, bodyFs, false, `#${style.text}`, textMaxW, 3, 1.4)
    : { svg: '', totalH: 0 };

  // Overlay gradient if photo background
  const gradientSvg = slide.photoUrl
    ? `<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#${style.bg}" stop-opacity="0.7"/>
        <stop offset="50%" stop-color="#${style.bg}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#${style.bg}" stop-opacity="0.95"/>
       </linearGradient></defs>
       <rect width="${w}" height="${h}" fill="url(#cg)"/>`
    : `<rect width="${w}" height="${h}" fill="#${style.bg}"/>`;

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${gradientSvg}
    <rect x="${pad}" y="${Math.round(h * 0.28)}" width="${Math.round(w * 0.08)}" height="${barH}" fill="#${style.accent}" rx="2"/>
    ${hookT.svg}${bodyT.svg}
    <rect x="0" y="${h - barH}" width="${w}" height="${barH}" fill="#${style.accent}"/>
  </svg>`;

  composites.push({ input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 });

  // Logo bottom-right
  const logoSz = Math.round(w * 0.1);
  const logo = await fetchLogo(style.logoUrl || '', logoSz);
  if (logo) composites.push({ input: logo, top: h - pad - logoSz, left: w - pad - logoSz });

  // Swipe hint arrow bottom-center
  const arrowSvg = Buffer.from(`<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8 L28 20 L12 32" stroke="#${style.accent}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`, 'utf-8');
  composites.push({ input: arrowSvg, top: h - pad - 20, left: Math.round(w / 2) - 20 });

  return sharp({ create: { width: w, height: h, channels: 4, background: hexToRgb(style.bg) } })
    .composite(composites).png().toBuffer();
}

/** CONTENT slide — number badge, hook, body text */
async function renderContent(
  slide: CarouselSlide, style: CarouselStyle, w: number, h: number, slideIndex: number, totalSlides: number,
): Promise<Buffer> {
  const pad = Math.round(w * 0.06);
  const hookFs = Math.round(w * 0.065);
  const bodyFs = Math.round(w * 0.038);
  const numFs = Math.round(w * 0.15);
  const textMaxW = w - pad * 2;
  const barH = Math.round(w * 0.006);

  const composites: sharp.OverlayOptions[] = [];

  if (slide.photoUrl) {
    const photo = await fetchImg(slide.photoUrl, w, h);
    composites.push({ input: photo, top: 0, left: 0 });
  }

  // Number badge — large accent number top-left
  const numLabel = slide.number || String(slideIndex);
  const numPath = textToPath(numLabel, pad, Math.round(h * 0.12) + numFs, numFs, `#${style.accent}`, 0.15, true);

  // Hook text
  const hookY = Math.round(h * 0.22);
  const hookT = svgTextBlock(slide.hook, pad, hookY, hookFs, true, `#${style.text}`, textMaxW, 4, 1.2);

  // Body text
  const bodyY = hookY + hookT.totalH + Math.round(pad * 0.6);
  const bodyT = slide.body
    ? svgTextBlock(slide.body, pad, bodyY, bodyFs, false, `#${style.text}`, textMaxW, 8, 1.45)
    : { svg: '', totalH: 0 };

  // Slide counter bottom
  const counterFs = Math.round(w * 0.025);
  const counterText = `${slideIndex} / ${totalSlides}`;
  const counterPath = textToPath(counterText, pad, h - pad, counterFs, `#${style.text}`, 0.4, false);

  const bgSvg = slide.photoUrl
    ? `<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#${style.bg}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#${style.bg}" stop-opacity="0.95"/>
       </linearGradient></defs><rect width="${w}" height="${h}" fill="url(#cg)"/>`
    : `<rect width="${w}" height="${h}" fill="#${style.bg}"/>`;

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${bgSvg}
    ${numPath}
    <rect x="${pad}" y="${hookY - Math.round(pad * 0.3)}" width="${Math.round(w * 0.06)}" height="${barH}" fill="#${style.accent}" rx="2"/>
    ${hookT.svg}${bodyT.svg}
    ${counterPath}
    <rect x="0" y="${h - barH}" width="${w}" height="${barH}" fill="#${style.accent}"/>
  </svg>`;

  composites.push({ input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 });

  return sharp({ create: { width: w, height: h, channels: 4, background: hexToRgb(style.bg) } })
    .composite(composites).png().toBuffer();
}

/** CTA slide — accent background, big text, logo centered */
async function renderCta(
  slide: CarouselSlide, style: CarouselStyle, w: number, h: number,
): Promise<Buffer> {
  const pad = Math.round(w * 0.08);
  const hookFs = Math.round(w * 0.075);
  const bodyFs = Math.round(w * 0.035);
  const textMaxW = w - pad * 2;

  // Use accent as background
  const { r, g, b } = hexToRgb(style.accent);

  // Determine text color for contrast on accent bg
  const lum = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  const ctaTextColor = lum > 0.5 ? '000000' : 'ffffff';

  const hookT = svgTextBlock(slide.hook, pad, Math.round(h * 0.35), hookFs, true, `#${ctaTextColor}`, textMaxW, 4, 1.2);
  const bodyT = slide.body
    ? svgTextBlock(slide.body, pad, Math.round(h * 0.35) + hookT.totalH + pad, bodyFs, false, `#${ctaTextColor}`, textMaxW, 3, 1.4)
    : { svg: '', totalH: 0 };

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#${style.accent}"/>
    ${hookT.svg}${bodyT.svg}
  </svg>`;

  const composites: sharp.OverlayOptions[] = [
    { input: Buffer.from(svg, 'utf-8'), top: 0, left: 0 },
  ];

  // Logo centered bottom
  const logoSz = Math.round(w * 0.15);
  const logo = await fetchLogo(style.logoUrl || '', logoSz);
  if (logo) composites.push({ input: logo, top: h - pad * 2 - logoSz, left: Math.round((w - logoSz) / 2) });

  return sharp({ create: { width: w, height: h, channels: 4, background: { r, g, b } } })
    .composite(composites).png().toBuffer();
}

// ─── Main handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  let body: CarouselRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { slides, style } = body;
  if (!slides || !Array.isArray(slides) || slides.length < 2 || slides.length > 10) {
    return NextResponse.json({ error: 'slides must be array of 2-10 items' }, { status: 400 });
  }
  if (!style?.bg || !style?.accent || !style?.text) {
    return NextResponse.json({ error: 'style.bg, style.accent, style.text required' }, { status: 400 });
  }

  const dims = getCarouselDims(style.platform || 'instagram');
  const totalSlides = slides.length;

  try {
    const results: { index: number; png_base64: string }[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      let buffer: Buffer;

      switch (slide.type) {
        case 'cover':
          buffer = await renderCover(slide, style, dims.w, dims.h);
          break;
        case 'cta':
          buffer = await renderCta(slide, style, dims.w, dims.h);
          break;
        case 'content':
        default:
          buffer = await renderContent(slide, style, dims.w, dims.h, i + 1, totalSlides);
          break;
      }

      results.push({ index: i, png_base64: buffer.toString('base64') });
    }

    return NextResponse.json({ slides: results, count: results.length });
  } catch (err) {
    console.error('[carousel] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Carousel render failed' },
      { status: 500 },
    );
  }
}
