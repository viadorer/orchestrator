import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * Sharp-based Brand Template Engine (v2)
 * 
 * Same query params as v1 (Satori), but renders via Sharp + SVG overlays.
 * Produces much higher quality output with proper text rendering,
 * diagonal masks, rounded corners, and gradient overlays.
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

    return new NextResponse(buffer, {
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

// ─── Helpers ─────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Fetch an image from URL and return as Sharp buffer, resized to fit */
async function fetchImage(url: string, w: number, h: number): Promise<Buffer> {
  if (!url || url.length < 5) {
    // Return a solid gray placeholder
    return sharp({ create: { width: w, height: h, channels: 3, background: { r: 40, g: 40, b: 40 } } })
      .png()
      .toBuffer();
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const arrayBuf = await res.arrayBuffer();
    return sharp(Buffer.from(arrayBuf))
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();
  } catch {
    return sharp({ create: { width: w, height: h, channels: 3, background: { r: 40, g: 40, b: 40 } } })
      .png()
      .toBuffer();
  }
}

/** Fetch logo and return resized buffer, or null */
async function fetchLogo(url: string, size: number): Promise<Buffer | null> {
  if (!url || url.length < 5) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const arrayBuf = await res.arrayBuffer();
    return sharp(Buffer.from(arrayBuf))
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) || 0,
    g: parseInt(h.substring(2, 4), 16) || 0,
    b: parseInt(h.substring(4, 6), 16) || 0,
  };
}

/** Word-wrap text to fit within maxWidth at given fontSize (approximate) */
function wrapText(text: string, fontSize: number, maxWidth: number, fontWeight: string = 'bold'): string[] {
  if (!text) return [];
  // Approximate character width: bold ~0.6em, normal ~0.5em
  const charWidth = fontSize * (fontWeight === 'bold' || fontWeight === '900' ? 0.58 : 0.48);
  const maxChars = Math.floor(maxWidth / charWidth);
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Generate SVG text block with word wrapping */
function svgTextBlock(opts: {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight?: string;
  fill: string;
  maxWidth: number;
  opacity?: number;
  lineHeight?: number;
  anchor?: string;
}): { svg: string; height: number } {
  const { text, x, y, fontSize, fontWeight = 'bold', fill, maxWidth, opacity = 1, lineHeight = 1.25, anchor = 'start' } = opts;
  const lines = wrapText(text, fontSize, maxWidth, fontWeight);
  const lh = fontSize * lineHeight;
  
  let svg = '';
  for (let i = 0; i < lines.length; i++) {
    svg += `<text x="${x}" y="${y + i * lh}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" opacity="${opacity}" text-anchor="${anchor}">${escapeXml(lines[i])}</text>\n`;
  }
  return { svg, height: lines.length * lh };
}

/** Create a rounded rectangle SVG mask */
function roundedRectMask(w: number, h: number, r: number): Buffer {
  const svg = `<svg width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/></svg>`;
  return Buffer.from(svg);
}

// ─── Template: Bold Card ─────────────────────────────────────

async function renderBoldCard(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, project, bg, accent, textColor, logoUrl, width, height } = ctx;
  const rgb = hexToRgb(bg);
  const accentRgb = hexToRgb(accent);
  const pad = Math.round(Math.min(width, height) * 0.06);
  const hookSize = Math.round(width * 0.16);
  const bodySize = Math.round(width * 0.038);
  const subtitleSize = Math.round(width * 0.028);
  const barH = Math.round(Math.min(width, height) * 0.005);
  const divW = Math.round(Math.min(width, height) * 0.07);
  const logoSize = Math.round(Math.min(width, height) * 0.1);

  // Build SVG overlay
  const hookBlock = svgTextBlock({ text: hook, x: width / 2, y: height * 0.35, fontSize: hookSize, fontWeight: '900', fill: `#${textColor}`, maxWidth: width * 0.8, anchor: 'middle' });
  const bodyBlock = svgTextBlock({ text: body, x: width / 2, y: height * 0.35 + hookBlock.height + pad, fontSize: bodySize, fontWeight: '500', fill: `#${textColor}`, maxWidth: width * 0.75, opacity: 0.9, anchor: 'middle' });
  const subY = height * 0.35 + hookBlock.height + bodyBlock.height + pad * 1.5;
  const subBlock = svgTextBlock({ text: subtitle, x: width / 2, y: subY, fontSize: subtitleSize, fontWeight: '400', fill: `#${accent}`, maxWidth: width * 0.65, anchor: 'middle' });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="#${bg}"/>
    <!-- Glow -->
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="40%">
        <stop offset="0%" stop-color="rgb(${accentRgb.r},${accentRgb.g},${accentRgb.b})" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="rgb(${accentRgb.r},${accentRgb.g},${accentRgb.b})" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${width / 2}" cy="${height / 2}" rx="${width * 0.35}" ry="${width * 0.35}" fill="url(#glow)"/>
    <!-- Top bar -->
    <rect x="0" y="0" width="${width}" height="${barH}" fill="#${accent}"/>
    <!-- Corner accents -->
    <rect x="${pad}" y="${pad}" width="${divW}" height="${barH}" fill="#${accent}" opacity="0.4"/>
    <rect x="${pad}" y="${pad}" width="${barH}" height="${divW}" fill="#${accent}" opacity="0.4"/>
    <rect x="${width - pad - divW}" y="${height - pad - barH}" width="${divW}" height="${barH}" fill="#${accent}" opacity="0.4"/>
    <rect x="${width - pad - barH}" y="${height - pad - divW}" width="${barH}" height="${divW}" fill="#${accent}" opacity="0.4"/>
    <!-- Divider -->
    <rect x="${(width - divW) / 2}" y="${height * 0.35 + hookBlock.height + pad * 0.3}" width="${divW}" height="${barH}" rx="2" fill="#${accent}"/>
    <!-- Text -->
    ${hookBlock.svg}
    ${bodyBlock.svg}
    ${subBlock.svg}
    <!-- Bottom bar -->
    <rect x="0" y="${height - barH}" width="${width}" height="${barH}" fill="#${accent}"/>
  </svg>`;

  let composite: sharp.OverlayOptions[] = [
    { input: Buffer.from(svg), top: 0, left: 0 },
  ];

  // Logo
  const logo = await fetchLogo(logoUrl, logoSize);
  if (logo) {
    composite.push({ input: logo, top: height - pad - logoSize, left: width - pad - logoSize });
  }

  return sharp({ create: { width, height, channels: 4, background: { ...rgb, alpha: 255 } } })
    .composite(composite)
    .png()
    .toBuffer();
}

// ─── Template: Photo Strip ───────────────────────────────────

async function renderPhotoStrip(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, bg, accent, textColor, logoUrl, photoUrl, width, height } = ctx;
  const stripH = Math.round(height * 0.22);
  const photoH = height - stripH;
  const pad = Math.round(Math.min(width, height) * 0.04);
  const hookSize = Math.round(stripH * 0.28);
  const bodySize = Math.round(stripH * 0.15);
  const logoSize = Math.round(Math.min(width, height) * 0.1);
  const barH = Math.round(Math.min(width, height) * 0.005);

  const photo = await fetchImage(photoUrl, width, photoH);
  const logo = await fetchLogo(logoUrl, logoSize);

  // Strip SVG overlay
  const hookBlock = svgTextBlock({ text: hook, x: pad, y: photoH + pad + hookSize, fontSize: hookSize, fontWeight: '900', fill: `#${textColor}`, maxWidth: width - pad * 2 - logoSize - pad });
  const bodyBlock = svgTextBlock({ text: body, x: pad, y: photoH + pad + hookSize + hookBlock.height + 4, fontSize: bodySize, fontWeight: '400', fill: `#${textColor}`, maxWidth: width - pad * 2 - logoSize - pad, opacity: 0.7 });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Strip background -->
    <rect x="0" y="${photoH}" width="${width}" height="${stripH}" fill="#${bg}"/>
    <!-- Accent line -->
    <rect x="${pad}" y="${photoH}" width="${width - pad * 2}" height="${barH}" fill="#${accent}"/>
    <!-- Gradient fade from photo to strip -->
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#${bg}" stop-opacity="0"/>
        <stop offset="100%" stop-color="#${bg}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${photoH - 60}" width="${width}" height="60" fill="url(#fade)"/>
    ${hookBlock.svg}
    ${bodyBlock.svg}
  </svg>`;

  let composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg), top: 0, left: 0 },
  ];

  if (logo) {
    composite.push({ input: logo, top: photoH + Math.round((stripH - logoSize) / 2), left: width - pad - logoSize });
  }

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } })
    .composite(composite)
    .png()
    .toBuffer();
}

// ─── Template: Gradient ──────────────────────────────────────

async function renderGradient(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, accent, textColor, logoUrl, photoUrl, width, height } = ctx;
  const pad = Math.round(Math.min(width, height) * 0.05);
  const hookSize = Math.round(width * 0.055);
  const bodySize = Math.round(width * 0.028);
  const logoSize = Math.round(Math.min(width, height) * 0.1);
  const barH = Math.round(Math.min(width, height) * 0.005);

  const photo = await fetchImage(photoUrl, width, height);
  const logo = await fetchLogo(logoUrl, logoSize);

  const hookBlock = svgTextBlock({ text: hook, x: pad, y: height * 0.62, fontSize: hookSize, fontWeight: '900', fill: '#ffffff', maxWidth: width - pad * 2 });
  const bodyBlock = svgTextBlock({ text: body, x: pad, y: height * 0.62 + hookBlock.height + 12, fontSize: bodySize, fontWeight: '500', fill: '#ffffffee', maxWidth: width * 0.8 });
  const subBlock = svgTextBlock({ text: subtitle, x: pad, y: height * 0.62 + hookBlock.height + bodyBlock.height + 24, fontSize: bodySize - 4, fontWeight: '400', fill: `#${accent}`, maxWidth: width * 0.7 });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="35%" stop-color="#000000" stop-opacity="0.55"/>
        <stop offset="70%" stop-color="#000000" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.92"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${height * 0.25}" width="${width}" height="${height * 0.75}" fill="url(#grad)"/>
    <rect x="0" y="0" width="${width}" height="${barH}" fill="#${accent}"/>
    ${hookBlock.svg}
    ${bodyBlock.svg}
    ${subBlock.svg}
  </svg>`;

  let composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg), top: 0, left: 0 },
  ];

  if (logo) {
    composite.push({ input: logo, top: height - pad - logoSize, left: width - pad - logoSize });
  }

  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0 } } })
    .composite(composite)
    .png()
    .toBuffer();
}

// ─── Template: Split ─────────────────────────────────────────

async function renderSplit(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, bg, accent, textColor, logoUrl, photoUrl, width, height } = ctx;
  const isVertical = height > width;
  const pad = Math.round(Math.min(width, height) * 0.05);
  const hookSize = Math.round(width * 0.055);
  const bodySize = Math.round(width * 0.028);
  const logoSize = Math.round(Math.min(width, height) * 0.1);
  const barH = Math.round(Math.min(width, height) * 0.005);
  const divW = Math.round(Math.min(width, height) * 0.07);

  if (isVertical) {
    // Top: photo, Bottom: text
    const photoH = Math.round(height * 0.5);
    const photo = await fetchImage(photoUrl, width, photoH);
    const logo = await fetchLogo(logoUrl, logoSize);

    const textY = photoH + pad * 1.5;
    const hookBlock = svgTextBlock({ text: hook, x: pad, y: textY + hookSize, fontSize: hookSize, fontWeight: '900', fill: `#${textColor}`, maxWidth: width - pad * 2 });
    const bodyBlock = svgTextBlock({ text: body, x: pad, y: textY + hookSize + hookBlock.height + 12, fontSize: bodySize, fontWeight: '500', fill: `#${textColor}`, maxWidth: width - pad * 2, opacity: 0.85 });
    const subBlock = svgTextBlock({ text: subtitle, x: pad, y: textY + hookSize + hookBlock.height + bodyBlock.height + 24, fontSize: bodySize - 4, fontWeight: '400', fill: `#${textColor}`, maxWidth: width - pad * 2, opacity: 0.6 });

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${photoH}" width="${width}" height="${height - photoH}" fill="#${bg}"/>
      <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#${bg}" stop-opacity="0"/><stop offset="100%" stop-color="#${bg}" stop-opacity="1"/></linearGradient></defs>
      <rect x="0" y="${photoH - 40}" width="${width}" height="40" fill="url(#fade)"/>
      <rect x="${pad}" y="${photoH + pad * 0.5}" width="${barH}" height="${divW}" fill="#${accent}"/>
      ${hookBlock.svg}
      ${bodyBlock.svg}
      ${subBlock.svg}
    </svg>`;

    let composite: sharp.OverlayOptions[] = [
      { input: photo, top: 0, left: 0 },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ];
    if (logo) composite.push({ input: logo, top: height - pad - logoSize, left: width - pad - logoSize });

    return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } })
      .composite(composite)
      .png()
      .toBuffer();
  } else {
    // Left: photo, Right: text
    const photoW = Math.round(width * 0.5);
    const photo = await fetchImage(photoUrl, photoW, height);
    const logo = await fetchLogo(logoUrl, logoSize);

    const textX = photoW + pad;
    const hookBlock = svgTextBlock({ text: hook, x: textX + 20, y: height * 0.3, fontSize: hookSize, fontWeight: '900', fill: `#${textColor}`, maxWidth: width - photoW - pad * 2 });
    const bodyBlock = svgTextBlock({ text: body, x: textX + 20, y: height * 0.3 + hookBlock.height + 16, fontSize: bodySize, fontWeight: '500', fill: `#${textColor}`, maxWidth: width - photoW - pad * 2, opacity: 0.85 });
    const subBlock = svgTextBlock({ text: subtitle, x: textX + 20, y: height * 0.3 + hookBlock.height + bodyBlock.height + 28, fontSize: bodySize - 4, fontWeight: '400', fill: `#${textColor}`, maxWidth: width - photoW - pad * 2, opacity: 0.6 });

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${photoW}" y="0" width="${width - photoW}" height="${height}" fill="#${bg}"/>
      <defs><linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#${bg}" stop-opacity="0"/><stop offset="100%" stop-color="#${bg}" stop-opacity="1"/></linearGradient></defs>
      <rect x="${photoW - 40}" y="0" width="40" height="${height}" fill="url(#fade)"/>
      <rect x="${textX}" y="${pad}" width="${barH}" height="${divW}" fill="#${accent}"/>
      ${hookBlock.svg}
      ${bodyBlock.svg}
      ${subBlock.svg}
    </svg>`;

    let composite: sharp.OverlayOptions[] = [
      { input: photo, top: 0, left: 0 },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ];
    if (logo) composite.push({ input: logo, top: height - pad - logoSize, left: width - pad - logoSize });

    return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } })
      .composite(composite)
      .png()
      .toBuffer();
  }
}

// ─── Template: Text + Logo ───────────────────────────────────

async function renderTextLogo(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, bg, accent, textColor, logoUrl, photoUrl, width, height } = ctx;
  const pad = Math.round(Math.min(width, height) * 0.05);
  const hookSize = Math.round(width * 0.055);
  const bodySize = Math.round(width * 0.028);
  const subtitleSize = Math.round(width * 0.022);
  const logoSize = Math.round(Math.min(width, height) * 0.1);
  const barH = Math.round(Math.min(width, height) * 0.005);
  const divW = Math.round(Math.min(width, height) * 0.07);

  const photo = await fetchImage(photoUrl, width, height);
  const logo = await fetchLogo(logoUrl, logoSize);

  const hookBlock = svgTextBlock({ text: hook, x: pad, y: pad + hookSize, fontSize: hookSize, fontWeight: '900', fill: `#${textColor}`, maxWidth: width * 0.6 });
  const bodyBlock = svgTextBlock({ text: body, x: pad, y: pad + hookSize + hookBlock.height + divW * 0.3 + barH + 14, fontSize: bodySize, fontWeight: '500', fill: `#${textColor}`, maxWidth: width * 0.6, opacity: 0.9 });
  const subBlock = svgTextBlock({ text: subtitle, x: pad, y: pad + hookSize + hookBlock.height + bodyBlock.height + divW * 0.3 + barH + 24, fontSize: subtitleSize, fontWeight: '400', fill: `#${accent}`, maxWidth: width * 0.6 });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="overlay" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#${bg}" stop-opacity="0.87"/>
        <stop offset="35%" stop-color="#${bg}" stop-opacity="0.55"/>
        <stop offset="65%" stop-color="#${bg}" stop-opacity="0"/>
        <stop offset="100%" stop-color="#${bg}" stop-opacity="0.8"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#overlay)"/>
    <!-- Corner accent -->
    <rect x="0" y="0" width="${barH}" height="${Math.round(height * 0.09)}" fill="#${accent}"/>
    <rect x="0" y="0" width="${Math.round(width * 0.1)}" height="${barH}" fill="#${accent}"/>
    <!-- Divider -->
    <rect x="${pad}" y="${pad + hookSize + hookBlock.height + 6}" width="${divW}" height="${barH}" rx="2" fill="#${accent}"/>
    ${hookBlock.svg}
    ${bodyBlock.svg}
    ${subBlock.svg}
    <!-- Bottom corner -->
    <rect x="${width - barH}" y="${height - Math.round(height * 0.06)}" width="${barH}" height="${Math.round(height * 0.06)}" fill="#${accent}"/>
    <rect x="${width - Math.round(width * 0.07)}" y="${height - barH}" width="${Math.round(width * 0.07)}" height="${barH}" fill="#${accent}"/>
  </svg>`;

  let composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg), top: 0, left: 0 },
  ];
  if (logo) composite.push({ input: logo, top: height - pad - logoSize, left: width - pad - logoSize });

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } })
    .composite(composite)
    .png()
    .toBuffer();
}

// ─── Template: Minimal ───────────────────────────────────────

async function renderMinimal(ctx: TemplateContext): Promise<Buffer> {
  const { accent, logoUrl, photoUrl, width, height } = ctx;
  const pad = Math.round(Math.min(width, height) * 0.04);
  const logoSize = Math.round(Math.min(width, height) * 0.1);

  const photo = await fetchImage(photoUrl, width, height);
  const logo = await fetchLogo(logoUrl, logoSize);

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${height - Math.round(height * 0.15)}" width="${width}" height="${Math.round(height * 0.15)}" fill="url(#grad)"/>
  </svg>`;

  let composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg), top: 0, left: 0 },
  ];
  if (logo) composite.push({ input: logo, top: height - pad - logoSize, left: width - pad - logoSize });

  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0 } } })
    .composite(composite)
    .png()
    .toBuffer();
}

// ─── Template: Quote Card ────────────────────────────────────

async function renderQuoteCard(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height } = ctx;
  const isLandscape = width > height * 1.3;
  const gap = Math.round(Math.min(width, height) * 0.015);
  const radius = Math.round(Math.min(width, height) * 0.025);
  const pad = Math.round(Math.min(width, height) * 0.06);
  const logoSize = Math.round(Math.min(width, height) * 0.08);

  if (isLandscape) {
    // Side-by-side: text left, photo right
    const textW = Math.round(width * 0.55);
    const photoW = width - textW - gap * 3;
    const innerH = height - gap * 2;

    const base = height;
    const hookSize = Math.round(base * 0.085);
    const bodySize = Math.round(base * 0.042);
    const subtitleSize = Math.round(base * 0.033);

    const photo = await fetchImage(photoUrl, photoW, innerH);
    const photoRounded = await sharp(photo).composite([{ input: roundedRectMask(photoW, innerH, radius), blend: 'dest-in' }]).png().toBuffer();
    const logo = await fetchLogo(logoUrl, logoSize);

    const hookBlock = svgTextBlock({ text: hook, x: gap + pad, y: gap + pad + hookSize * 0.8 + hookSize, fontSize: hookSize, fontWeight: '900', fill: `#${textColor}`, maxWidth: textW - pad * 2 });
    const bodyBlock = svgTextBlock({ text: body, x: gap + pad, y: gap + pad + hookSize * 0.8 + hookSize + hookBlock.height + pad * 0.5, fontSize: bodySize, fontWeight: '400', fill: `#${textColor}`, maxWidth: textW - pad * 2, opacity: 0.7 });
    const subBlock = svgTextBlock({ text: subtitle, x: gap + pad, y: gap + pad + hookSize * 0.8 + hookSize + hookBlock.height + bodyBlock.height + pad * 0.8, fontSize: subtitleSize, fontWeight: '400', fill: `#${accent}`, maxWidth: textW - pad * 2 });

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0a0a0a"/>
      <rect x="${gap}" y="${gap}" width="${textW}" height="${innerH}" rx="${radius}" fill="#${bg}"/>
      <!-- Quote mark -->
      <text x="${gap + pad}" y="${gap + pad + hookSize * 0.8}" font-family="Georgia, serif" font-size="${Math.round(hookSize * 0.7)}" font-weight="900" fill="#${textColor}" opacity="0.15">„</text>
      ${hookBlock.svg}
      ${bodyBlock.svg}
      ${subBlock.svg}
    </svg>`;

    let composite: sharp.OverlayOptions[] = [
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: photoRounded, top: gap, left: textW + gap * 2 },
    ];
    if (logo) composite.push({ input: logo, top: height - gap - pad - logoSize, left: gap + pad });

    return sharp({ create: { width, height, channels: 4, background: { r: 10, g: 10, b: 10 } } })
      .composite(composite)
      .png()
      .toBuffer();
  } else {
    // Stacked: text top, photo bottom
    const textH = Math.round(height * 0.55);
    const photoH = height - textH - gap * 3;
    const innerW = width - gap * 2;

    const base = width;
    const hookSize = Math.round(base * 0.055);
    const bodySize = Math.round(base * 0.028);
    const subtitleSize = Math.round(base * 0.022);

    const photo = await fetchImage(photoUrl, innerW, photoH);
    const photoRounded = await sharp(photo).composite([{ input: roundedRectMask(innerW, photoH, radius), blend: 'dest-in' }]).png().toBuffer();
    const logo = await fetchLogo(logoUrl, logoSize);

    const hookBlock = svgTextBlock({ text: hook, x: gap + pad, y: gap + pad + hookSize * 0.8 + hookSize, fontSize: hookSize, fontWeight: '900', fill: `#${textColor}`, maxWidth: innerW - pad * 2 });
    const bodyBlock = svgTextBlock({ text: body, x: gap + pad, y: gap + pad + hookSize * 0.8 + hookSize + hookBlock.height + pad * 0.4, fontSize: bodySize, fontWeight: '400', fill: `#${textColor}`, maxWidth: innerW - pad * 2, opacity: 0.7 });
    const subBlock = svgTextBlock({ text: subtitle, x: gap + pad, y: gap + pad + hookSize * 0.8 + hookSize + hookBlock.height + bodyBlock.height + pad * 0.7, fontSize: subtitleSize, fontWeight: '400', fill: `#${accent}`, maxWidth: innerW - pad * 2 });

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#0a0a0a"/>
      <rect x="${gap}" y="${gap}" width="${innerW}" height="${textH}" rx="${radius}" fill="#${bg}"/>
      <text x="${gap + pad}" y="${gap + pad + hookSize * 0.8}" font-family="Georgia, serif" font-size="${Math.round(hookSize * 0.7)}" font-weight="900" fill="#${textColor}" opacity="0.15">„</text>
      ${hookBlock.svg}
      ${bodyBlock.svg}
      ${subBlock.svg}
    </svg>`;

    let composite: sharp.OverlayOptions[] = [
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: photoRounded, top: textH + gap * 2, left: gap },
    ];
    if (logo) composite.push({ input: logo, top: textH - pad - logoSize + gap, left: gap + pad });

    return sharp({ create: { width, height, channels: 4, background: { r: 10, g: 10, b: 10 } } })
      .composite(composite)
      .png()
      .toBuffer();
  }
}

// ─── Template: Diagonal ──────────────────────────────────────

async function renderDiagonal(ctx: TemplateContext): Promise<Buffer> {
  const { hook, body, subtitle, bg, accent, textColor, logoUrl, photoUrl, width, height } = ctx;
  const isLandscape = width > height * 1.3;
  const pad = Math.round(Math.min(width, height) * 0.06);
  const base = isLandscape ? height : width;
  const hookSize = Math.round(base * (isLandscape ? 0.1 : 0.065));
  const bodySize = Math.round(base * (isLandscape ? 0.045 : 0.03));
  const subtitleSize = Math.round(base * (isLandscape ? 0.035 : 0.024));
  const logoStripH = Math.round(height * 0.1);
  const logoSize = Math.round(logoStripH * 0.6);
  const barH = Math.round(base * 0.008);
  const divW = Math.round(base * 0.08);

  const photo = await fetchImage(photoUrl, width, height);
  const logo = await fetchLogo(logoUrl, logoSize);

  // Diagonal: colored polygon covering top-left, revealing photo bottom-right
  // The diagonal line goes from (0, height*0.65) to (width, height*0.3)
  const dY1 = Math.round(height * (isLandscape ? 0.7 : 0.65));
  const dY2 = Math.round(height * (isLandscape ? 0.25 : 0.3));

  const hookBlock = svgTextBlock({ text: hook, x: pad, y: pad + hookSize, fontSize: hookSize, fontWeight: '900', fill: `#${textColor}`, maxWidth: width * (isLandscape ? 0.55 : 0.85) });
  const dividerY = pad + hookSize + hookBlock.height + 8;
  const bodyBlock = svgTextBlock({ text: body, x: pad, y: dividerY + barH + 12, fontSize: bodySize, fontWeight: '500', fill: `#${textColor}`, maxWidth: width * (isLandscape ? 0.5 : 0.7), opacity: 0.85 });
  const subBlock = svgTextBlock({ text: subtitle, x: pad, y: dividerY + barH + 12 + bodyBlock.height + 8, fontSize: subtitleSize, fontWeight: '400', fill: `#${accent}`, maxWidth: width * 0.6 });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Diagonal colored overlay -->
    <polygon points="0,0 ${width},0 ${width},${dY2} 0,${dY1}" fill="#${bg}"/>
    <!-- Extend left side down to logo strip -->
    <rect x="0" y="${dY1}" width="${Math.round(width * 0.08)}" height="${height - dY1 - logoStripH}" fill="#${bg}"/>
    <!-- Text -->
    ${hookBlock.svg}
    <!-- Accent divider -->
    <rect x="${pad}" y="${dividerY}" width="${divW}" height="${barH}" rx="2" fill="#${accent}"/>
    ${bodyBlock.svg}
    ${subBlock.svg}
    <!-- White logo strip at bottom -->
    <rect x="0" y="${height - logoStripH}" width="${width}" height="${logoStripH}" fill="#ffffff"/>
  </svg>`;

  let composite: sharp.OverlayOptions[] = [
    { input: photo, top: 0, left: 0 },
    { input: Buffer.from(svg), top: 0, left: 0 },
  ];
  if (logo) {
    composite.push({ input: logo, top: height - logoStripH + Math.round((logoStripH - logoSize) / 2), left: pad });
  }

  return sharp({ create: { width, height, channels: 4, background: hexToRgb(bg) } })
    .composite(composite)
    .png()
    .toBuffer();
}
