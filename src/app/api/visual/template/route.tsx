import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Brand Template Engine
 * 
 * Generuje výrazné vizuály pro social media posty.
 * Každý template má per-platform rozměry a brand barvy.
 * Logo vždy vpravo dole.
 * 
 * GET /api/visual/template?t=photo_strip&hook=...&body=...&bg=1a1a2e&accent=e94560&...
 * 
 * Templates:
 * - photo_strip: Fotka + výrazný brand pás dole
 * - split: Půlka fotka, půlka bold text
 * - gradient: Fotka na pozadí + gradient + výrazný text
 * - bold_card: Výrazné číslo s efekty, barvy, glow
 * - minimal: Fotka + malý brand badge
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

  // Per-platform dimensions
  const dims = getPlatformDimensions(platform);
  const width = parseInt(searchParams.get('w') || String(dims.w));
  const height = parseInt(searchParams.get('h') || String(dims.h));

  const logoMode: 'img' | 'fallback' = (logoUrl && logoUrl.length > 5) ? 'img' : 'fallback';
  const hasPhoto = !!(photoUrl && photoUrl.length > 5);
  const props = { hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height, logoMode, hasPhoto };

  let element: React.ReactElement;

  switch (template) {
    case 'photo_strip':
      element = hasPhoto ? <PhotoStripWithPhoto {...props} /> : <PhotoStripNoPhoto {...props} />;
      break;
    case 'split':
      element = <SplitTemplate {...props} />;
      break;
    case 'gradient':
      element = <GradientTemplate {...props} />;
      break;
    case 'text_logo':
      element = <TextLogoTemplate {...props} />;
      break;
    case 'minimal':
      element = <MinimalTemplate {...props} />;
      break;
    case 'quote_card':
      element = <QuoteCardTemplate {...props} />;
      break;
    case 'bold_card':
    default:
      element = <BoldCardTemplate {...props} />;
      break;
  }

  return new ImageResponse(element, { width, height });
}

function getPlatformDimensions(platform: string): { w: number; h: number } {
  const dims: Record<string, { w: number; h: number }> = {
    // Facebook variants (default = portrait 4:5 for best engagement)
    facebook: { w: 1080, h: 1350 },
    facebook_portrait: { w: 1080, h: 1350 },
    facebook_square: { w: 1200, h: 1200 },
    facebook_landscape: { w: 1200, h: 630 },
    facebook_story: { w: 1080, h: 1920 },
    // Instagram
    instagram: { w: 1080, h: 1350 },
    instagram_square: { w: 1080, h: 1080 },
    instagram_story: { w: 1080, h: 1920 },
    // LinkedIn
    linkedin: { w: 1200, h: 627 },
    linkedin_square: { w: 1080, h: 1080 },
    linkedin_portrait: { w: 1080, h: 1350 },
    // Others
    x: { w: 1200, h: 675 },
    tiktok: { w: 1080, h: 1920 },
    pinterest: { w: 1000, h: 1500 },
    threads: { w: 1080, h: 1350 },
    youtube: { w: 1280, h: 720 },
  };
  return dims[platform] || { w: 1200, h: 630 };
}

interface TemplateProps {
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
  logoMode: 'img' | 'fallback';
  hasPhoto: boolean;
}

// ─── Shared sizing (all relative to image dimensions) ────────

function getTemplateSizes(width: number, height: number) {
  const base = Math.min(width, height);
  return {
    logo: Math.round(base * 0.1),
    logoBorderRadius: Math.round(base * 0.012),
    padding: Math.round(base * 0.04),
    hookFont: Math.round(width * 0.055),
    bodyFont: Math.round(width * 0.028),
    subtitleFont: Math.round(width * 0.022),
    accentBar: Math.round(base * 0.005),
    dividerWidth: Math.round(base * 0.07),
  };
}

// ─── Logo Component (vždy vpravo dole) ──────────────────────
// Single component with early return — NO ternary in JSX (Satori bug workaround)

function LogoBadge({ mode, logoUrl, project, accent, logoSize, borderRadius }: { mode: 'img' | 'fallback'; logoUrl: string; project: string; accent: string; logoSize: number; borderRadius: number }) {
  if (mode === 'img') {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={logoUrl} width={logoSize} height={logoSize} style={{ borderRadius: `${borderRadius}px` }} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        width: `${logoSize}px`,
        height: `${logoSize}px`,
        borderRadius: `${borderRadius}px`,
        backgroundColor: `#${accent}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.round(logoSize * 0.5)}px`,
        fontWeight: 900,
        color: '#ffffff',
      }}>
        {project[0]?.toUpperCase()}
      </div>
    </div>
  );
}

// ─── Photo helpers (avoid ternary JSX in @vercel/og) ────────

function PhotoFull({ photoUrl }: { photoUrl: string }) {
  return <img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />;
}

function PhotoFallback({ bg, accent, textColor }: { bg: string; accent: string; textColor: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'absolute', top: 0, left: 0,
      background: `linear-gradient(135deg, #${bg} 0%, #${accent}33 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: '80px', opacity: 0.15, color: `#${textColor}` }}>📷</div>
    </div>
  );
}

// ─── Template 1: Bold Card (výrazné číslo s efekty) ─────────

function BoldCardTemplate({ hook, body, subtitle, project, bg, accent, textColor, logoUrl, width, height, logoMode }: TemplateProps) {
  const s = getTemplateSizes(width, height);
  const isVertical = height > width;
  const hookSize = Math.round(width * 0.18);
  const bodySize = Math.round(width * 0.04);
  const subtitleSize = Math.round(width * 0.028);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `#${bg}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow effect */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `${Math.round(width * 0.7)}px`,
        height: `${Math.round(width * 0.7)}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle, #${accent}33 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
      }} />

      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: `${s.accentBar}px`,
        background: `linear-gradient(90deg, #${accent}, #${accent}88, #${accent})`,
      }} />

      {/* Decorative corner elements */}
      <div style={{
        position: 'absolute',
        top: `${s.padding}px`,
        left: `${s.padding}px`,
        width: `${s.dividerWidth}px`,
        height: `${s.dividerWidth}px`,
        borderTop: `${s.accentBar}px solid #${accent}`,
        borderLeft: `${s.accentBar}px solid #${accent}`,
        opacity: 0.4,
      }} />
      <div style={{
        position: 'absolute',
        bottom: `${s.padding}px`,
        right: `${s.padding}px`,
        width: `${s.dividerWidth}px`,
        height: `${s.dividerWidth}px`,
        borderBottom: `${s.accentBar}px solid #${accent}`,
        borderRight: `${s.accentBar}px solid #${accent}`,
        opacity: 0.4,
      }} />

      {/* Hook number — BIG and BOLD */}
      {hook && (
        <div style={{
          fontSize: `${hookSize}px`,
          fontWeight: 900,
          color: `#${textColor}`,
          lineHeight: 1,
          textAlign: 'center',
          marginBottom: '16px',
          textShadow: `0 0 80px #${accent}66, 0 4px 20px rgba(0,0,0,0.5)`,
          letterSpacing: '-2px',
        }}>
          {hook}
        </div>
      )}

      {/* Accent divider */}
      <div style={{
        width: `${s.dividerWidth}px`,
        height: `${s.accentBar}px`,
        backgroundColor: `#${accent}`,
        borderRadius: '2px',
        marginBottom: `${s.padding}px`,
      }} />

      {/* Body text */}
      {body && (
        <div style={{
          fontSize: `${bodySize}px`,
          fontWeight: 500,
          color: `#${textColor}`,
          opacity: 0.9,
          textAlign: 'center',
          maxWidth: '75%',
          lineHeight: 1.5,
          marginBottom: '12px',
        }}>
          {body}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <div style={{
          fontSize: `${subtitleSize}px`,
          fontWeight: 400,
          color: `#${accent}`,
          textAlign: 'center',
          maxWidth: '65%',
          lineHeight: 1.4,
        }}>
          {subtitle}
        </div>
      )}

      {/* Logo — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: `${s.padding}px`,
        right: `${s.padding}px`,
        display: 'flex',
      }}>
        <LogoBadge mode={logoMode} logoUrl={logoUrl} project={project} accent={accent} logoSize={s.logo} borderRadius={s.logoBorderRadius} />
      </div>

      {/* Bottom accent bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${s.accentBar}px`,
        background: `linear-gradient(90deg, #${accent}, #${accent}88, #${accent})`,
      }} />
    </div>
  );
}

// ─── Template 2: Photo + Brand Strip ────────────────────────
// Split into two components to avoid ALL ternary JSX in Satori

function PhotoStripBrandArea({ hook, body, accent, textColor, stripHeight, logoUrl, project, logoMode, width, height }: { hook: string; body: string; accent: string; textColor: string; stripHeight: number; logoUrl: string; project: string; logoMode: 'img' | 'fallback'; width: number; height: number }) {
  const s = getTemplateSizes(width, height);
  const hookSize = Math.round(stripHeight * 0.28);
  const bodySize = Math.round(stripHeight * 0.15);
  return (
    <div style={{
      height: `${stripHeight}px`,
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: `0 ${s.padding}px`,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: `${s.padding}px`,
        right: `${s.padding}px`,
        height: `${s.accentBar}px`,
        background: `linear-gradient(90deg, #${accent}, transparent)`,
      }} />
      {/* Text area — left */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {hook && (
          <div style={{
            display: 'flex',
            fontSize: `${hookSize}px`,
            fontWeight: 900,
            color: `#${textColor}`,
            lineHeight: 1.2,
            marginBottom: `${Math.round(stripHeight * 0.03)}px`,
          }}>
            {hook}
          </div>
        )}
        {body && (
          <div style={{
            fontSize: `${bodySize}px`,
            fontWeight: 400,
            color: `#${textColor}`,
            opacity: 0.7,
            lineHeight: 1.4,
          }}>
            {body}
          </div>
        )}
      </div>
      {/* Logo — right */}
      <div style={{ display: 'flex', marginLeft: `${s.padding}px` }}>
        <LogoBadge mode={logoMode} logoUrl={logoUrl} project={project} accent={accent} logoSize={s.logo} borderRadius={s.logoBorderRadius} />
      </div>
    </div>
  );
}

function PhotoStripWithPhoto({ hook, body, project, bg, accent, textColor, logoUrl, photoUrl, width, height, logoMode }: TemplateProps) {
  const stripHeight = Math.round(height * 0.22);
  const photoHeight = height - stripHeight;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: `#${bg}` }}>
      <div style={{ width: `${width}px`, height: `${photoHeight}px`, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <img src={photoUrl} width={width} height={photoHeight} style={{ objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: `linear-gradient(transparent, #${bg})` }} />
      </div>
      <PhotoStripBrandArea hook={hook} body={body} accent={accent} textColor={textColor} stripHeight={stripHeight} logoUrl={logoUrl} project={project} logoMode={logoMode} width={width} height={height} />
    </div>
  );
}

function PhotoStripNoPhoto({ hook, body, project, bg, accent, textColor, logoUrl, width, height, logoMode }: TemplateProps) {
  const stripHeight = Math.round(height * 0.22);
  const photoHeight = height - stripHeight;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: `#${bg}` }}>
      <div style={{ width: `${width}px`, height: `${photoHeight}px`, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          width: '100%', height: '100%',
          background: `linear-gradient(135deg, #${bg} 0%, #${accent}33 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '80px', opacity: 0.15, color: `#${textColor}` }}>📷</div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: `linear-gradient(transparent, #${bg})` }} />
      </div>
      <PhotoStripBrandArea hook={hook} body={body} accent={accent} textColor={textColor} stripHeight={stripHeight} logoUrl={logoUrl} project={project} logoMode={logoMode} width={width} height={height} />
    </div>
  );
}

// ─── Template 3: Split Layout ───────────────────────────────

function SplitTemplate({ hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height, logoMode, hasPhoto }: TemplateProps) {
  const s = getTemplateSizes(width, height);
  const isVertical = height > width;
  const hookSize = s.hookFont;
  const bodySize = s.bodyFont;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: isVertical ? 'column' : 'row',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Photo half */}
      <div style={{
        width: isVertical ? '100%' : '50%',
        height: isVertical ? '50%' : '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {hasPhoto ? <PhotoFull photoUrl={photoUrl} /> : <PhotoFallback bg={bg} accent={accent} textColor={textColor} />}
        {/* Diagonal accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: isVertical ? 0 : '-20px',
          bottom: isVertical ? '-20px' : 0,
          width: isVertical ? '100%' : '40px',
          height: isVertical ? '40px' : '100%',
          background: `linear-gradient(${isVertical ? '180deg' : '90deg'}, transparent, #${bg})`,
        }} />
      </div>

      {/* Text half */}
      <div style={{
        width: isVertical ? '100%' : '50%',
        height: isVertical ? '50%' : '100%',
        backgroundColor: `#${bg}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: `${s.padding}px`,
        position: 'relative',
      }}>
        {/* Accent vertical bar */}
        <div style={{
          position: 'absolute',
          top: `${s.padding}px`,
          left: isVertical ? `${s.padding}px` : '0',
          width: `${s.accentBar}px`,
          height: `${s.dividerWidth}px`,
          backgroundColor: `#${accent}`,
          borderRadius: '2px',
        }} />

        {hook && (
          <div style={{
            fontSize: `${hookSize}px`,
            fontWeight: 900,
            color: `#${textColor}`,
            lineHeight: 1.1,
            marginBottom: '16px',
            marginLeft: isVertical ? '0' : '20px',
          }}>
            {hook}
          </div>
        )}

        {body && (
          <div style={{
            fontSize: `${bodySize}px`,
            fontWeight: 500,
            color: `#${textColor}`,
            opacity: 0.85,
            lineHeight: 1.5,
            marginBottom: '12px',
            marginLeft: isVertical ? '0' : '20px',
          }}>
            {body}
          </div>
        )}

        {subtitle && (
          <div style={{
            fontSize: `${bodySize - 4}px`,
            fontWeight: 400,
            color: `#${textColor}`,
            opacity: 0.6,
            lineHeight: 1.4,
            marginLeft: isVertical ? '0' : '20px',
          }}>
            {subtitle}
          </div>
        )}

        {/* Logo — bottom right */}
        <div style={{
          position: 'absolute',
          bottom: `${s.padding}px`,
          right: `${s.padding}px`,
          display: 'flex',
        }}>
          <LogoBadge mode={logoMode} logoUrl={logoUrl} project={project} accent={accent} logoSize={s.logo} borderRadius={s.logoBorderRadius} />
        </div>
      </div>
    </div>
  );
}

// ─── Template 4: Gradient Overlay ───────────────────────────

function GradientTemplate({ hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height, logoMode, hasPhoto }: TemplateProps) {
  const s = getTemplateSizes(width, height);
  const hookSize = s.hookFont;
  const bodySize = s.bodyFont;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Full-bleed photo */}
      {hasPhoto ? <PhotoFull photoUrl={photoUrl} /> : <PhotoFallback bg={bg} accent={accent} textColor={textColor} />}

      {/* Dark gradient overlay — always dark for text readability */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '75%',
        background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.92) 100%)',
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: `${s.accentBar}px`,
        backgroundColor: `#${accent}`,
      }} />

      {/* Content at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: `${s.padding}px`,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {hook && (
          <div style={{
            fontSize: `${hookSize}px`,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.15,
            marginBottom: '12px',
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          }}>
            {hook}
          </div>
        )}

        {body && (
          <div style={{
            fontSize: `${bodySize}px`,
            fontWeight: 500,
            color: '#ffffffee',
            lineHeight: 1.5,
            marginBottom: '8px',
            textShadow: '0 1px 10px rgba(0,0,0,0.6)',
            maxWidth: '80%',
          }}>
            {body}
          </div>
        )}

        {subtitle && (
          <div style={{
            fontSize: `${bodySize - 6}px`,
            fontWeight: 400,
            color: `#${accent}`,
            lineHeight: 1.4,
            textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}>
            {subtitle}
          </div>
        )}

        {/* Logo — bottom right */}
        <div style={{
          position: 'absolute',
          bottom: `${s.padding}px`,
          right: `${s.padding}px`,
          display: 'flex',
        }}>
          <LogoBadge mode={logoMode} logoUrl={logoUrl} project={project} accent={accent} logoSize={s.logo} borderRadius={s.logoBorderRadius} />
        </div>
      </div>
    </div>
  );
}

// ─── Template 6: Text Logo (text vlevo nahoře, logo vpravo dole) ────

function TextLogoTemplate({ hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height, logoMode, hasPhoto }: TemplateProps) {
  const s = getTemplateSizes(width, height);
  const hookSize = s.hookFont;
  const bodySize = s.bodyFont;
  const subtitleSize = s.subtitleFont;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Full-bleed photo */}
      {hasPhoto ? <PhotoFull photoUrl={photoUrl} /> : <PhotoFallback bg={bg} accent={accent} textColor={textColor} />}

      {/* Dark overlay for text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(160deg, #${bg}dd 0%, #${bg}88 35%, transparent 65%, #${bg}cc 100%)`,
      }} />

      {/* Top-left accent corner */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${s.accentBar}px`,
        height: `${Math.round(height * 0.09)}px`,
        backgroundColor: `#${accent}`,
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${Math.round(width * 0.1)}px`,
        height: `${s.accentBar}px`,
        backgroundColor: `#${accent}`,
      }} />

      {/* Text content — top left */}
      <div style={{
        position: 'absolute',
        top: `${s.padding}px`,
        left: `${s.padding}px`,
        right: '40%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {hook && (
          <div style={{
            fontSize: `${hookSize}px`,
            fontWeight: 900,
            color: `#${textColor}`,
            lineHeight: 1.15,
            marginBottom: '14px',
            textShadow: `0 2px 30px #${accent}44, 0 2px 10px rgba(0,0,0,0.6)`,
          }}>
            {hook}
          </div>
        )}

        {/* Accent divider */}
        <div style={{
          width: `${s.dividerWidth}px`,
          height: `${s.accentBar}px`,
          backgroundColor: `#${accent}`,
          borderRadius: '2px',
          marginBottom: `${Math.round(s.padding * 0.5)}px`,
        }} />

        {body && (
          <div style={{
            fontSize: `${bodySize}px`,
            fontWeight: 500,
            color: `#${textColor}`,
            opacity: 0.9,
            lineHeight: 1.5,
            marginBottom: '10px',
            textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}>
            {body}
          </div>
        )}

        {subtitle && (
          <div style={{
            fontSize: `${subtitleSize}px`,
            fontWeight: 400,
            color: `#${accent}`,
            lineHeight: 1.4,
            textShadow: '0 1px 6px rgba(0,0,0,0.4)',
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Bottom-right accent corner */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: `${s.accentBar}px`,
        height: `${Math.round(height * 0.06)}px`,
        backgroundColor: `#${accent}`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: `${Math.round(width * 0.07)}px`,
        height: `${s.accentBar}px`,
        backgroundColor: `#${accent}`,
      }} />

      {/* Logo — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: `${s.padding}px`,
        right: `${s.padding}px`,
        display: 'flex',
      }}>
        <LogoBadge mode={logoMode} logoUrl={logoUrl} project={project} accent={accent} logoSize={s.logo} borderRadius={s.logoBorderRadius} />
      </div>
    </div>
  );
}

// ─── Template 7: Quote Card (citát nahoře, fotka dole) ──────

function QuoteCardTemplate({ hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height, logoMode, hasPhoto }: TemplateProps) {
  const s = getTemplateSizes(width, height);
  const isVertical = height > width;
  const isLandscape = width > height * 1.3;

  // For landscape: side-by-side layout (text left, photo right)
  // For portrait/square: stacked layout (text top, photo bottom)
  const gap = Math.round(s.padding * 0.4);
  const innerRadius = Math.round(s.padding * 0.6);

  // Font sizes adapt to available space
  const base = isLandscape ? height : width;
  const hookSize = Math.round(base * (isLandscape ? 0.09 : 0.058));
  const bodySize = Math.round(base * (isLandscape ? 0.045 : 0.03));
  const subtitleSize = Math.round(base * (isLandscape ? 0.035 : 0.024));
  const logoSize = Math.round(Math.min(width, height) * 0.08);

  if (isLandscape) {
    // Landscape: text panel LEFT, photo RIGHT
    const textPanelWidth = Math.round(width * 0.55);
    const photoPanelWidth = width - textPanelWidth;

    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#0a0a0a',
        padding: `${gap}px`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Text panel — left */}
        <div style={{
          width: `${textPanelWidth - gap}px`,
          height: '100%',
          backgroundColor: `#${bg}`,
          borderRadius: `${innerRadius}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `${s.padding}px ${s.padding * 1.2}px`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: `${Math.round(height * 0.8)}px`,
            height: `${Math.round(height * 0.8)}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, #${accent}15 0%, transparent 70%)`,
          }} />

          <div style={{
            fontSize: `${Math.round(hookSize * 0.5)}px`,
            fontWeight: 900,
            color: `#${textColor}`,
            opacity: 0.2,
            lineHeight: 1,
            marginBottom: `${Math.round(s.padding * 0.2)}px`,
          }}>
            {"\u201E"}
          </div>

          {hook && (
            <div style={{
              fontSize: `${hookSize}px`,
              fontWeight: 900,
              color: `#${textColor}`,
              lineHeight: 1.2,
              marginBottom: `${Math.round(s.padding * 0.6)}px`,
            }}>
              {hook}
            </div>
          )}

          {body && (
            <div style={{
              fontSize: `${bodySize}px`,
              fontWeight: 400,
              color: `#${textColor}`,
              opacity: 0.7,
              lineHeight: 1.4,
              marginBottom: `${Math.round(s.padding * 0.3)}px`,
            }}>
              {body}
            </div>
          )}

          {subtitle && (
            <div style={{
              fontSize: `${subtitleSize}px`,
              fontWeight: 400,
              color: `#${accent}`,
              lineHeight: 1.4,
            }}>
              {subtitle}
            </div>
          )}

          <div style={{
            position: 'absolute',
            bottom: `${Math.round(s.padding * 0.8)}px`,
            left: `${Math.round(s.padding * 1.2)}px`,
            display: 'flex',
          }}>
            <LogoBadge mode={logoMode} logoUrl={logoUrl} project={project} accent={accent} logoSize={logoSize} borderRadius={s.logoBorderRadius} />
          </div>
        </div>

        {/* Photo panel — right */}
        <div style={{
          width: `${photoPanelWidth - gap}px`,
          height: '100%',
          borderRadius: `${innerRadius}px`,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          marginLeft: `${gap}px`,
        }}>
          {hasPhoto ? <PhotoFull photoUrl={photoUrl} /> : <PhotoFallback bg={bg} accent={accent} textColor={textColor} />}
        </div>
      </div>
    );
  }

  // Portrait / square: stacked layout (text top, photo bottom)
  const textPanelRatio = 0.55;
  const textPanelHeight = Math.round(height * textPanelRatio);
  const photoHeight = height - textPanelHeight;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      padding: `${gap}px`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Text panel — colored background with rounded corners */}
      <div style={{
        width: '100%',
        height: `${textPanelHeight - gap}px`,
        backgroundColor: `#${bg}`,
        borderRadius: `${innerRadius}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: `${s.padding * 1.5}px ${s.padding * 1.2}px`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle accent glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: `${Math.round(width * 0.5)}px`,
          height: `${Math.round(width * 0.5)}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, #${accent}15 0%, transparent 70%)`,
        }} />

        {/* Quote mark */}
        <div style={{
          fontSize: `${Math.round(hookSize * 0.6)}px`,
          fontWeight: 900,
          color: `#${textColor}`,
          opacity: 0.2,
          lineHeight: 1,
          marginBottom: `${Math.round(s.padding * 0.3)}px`,
        }}>
          {"\u201E"}
        </div>

        {/* Hook — main quote text */}
        {hook && (
          <div style={{
            fontSize: `${hookSize}px`,
            fontWeight: 900,
            color: `#${textColor}`,
            lineHeight: 1.2,
            marginBottom: `${s.padding}px`,
          }}>
            {hook}
          </div>
        )}

        {/* Body — author / attribution */}
        {body && (
          <div style={{
            fontSize: `${bodySize}px`,
            fontWeight: 400,
            color: `#${textColor}`,
            opacity: 0.7,
            lineHeight: 1.4,
            marginBottom: `${Math.round(s.padding * 0.5)}px`,
          }}>
            {body}
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div style={{
            fontSize: `${subtitleSize}px`,
            fontWeight: 400,
            color: `#${accent}`,
            lineHeight: 1.4,
          }}>
            {subtitle}
          </div>
        )}

        {/* Logo — bottom left of text panel */}
        <div style={{
          position: 'absolute',
          bottom: `${s.padding}px`,
          left: `${Math.round(s.padding * 1.2)}px`,
          display: 'flex',
        }}>
          <LogoBadge mode={logoMode} logoUrl={logoUrl} project={project} accent={accent} logoSize={logoSize} borderRadius={s.logoBorderRadius} />
        </div>
      </div>

      {/* Photo panel — bottom, rounded corners */}
      <div style={{
        width: '100%',
        height: `${photoHeight - gap}px`,
        borderRadius: `${innerRadius}px`,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        marginTop: `${gap}px`,
      }}>
        {hasPhoto ? <PhotoFull photoUrl={photoUrl} /> : <PhotoFallback bg={bg} accent={accent} textColor={textColor} />}
      </div>
    </div>
  );
}

// ─── Template 5: Minimal Badge ──────────────────────────────

function MinimalTemplate({ project, bg, accent, textColor, logoUrl, photoUrl, width, height, logoMode, hasPhoto }: TemplateProps) {
  const s = getTemplateSizes(width, height);
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Full photo */}
      {hasPhoto ? <PhotoFull photoUrl={photoUrl} /> : <PhotoFallback bg={bg} accent={accent} textColor={textColor} />}

      {/* Subtle bottom gradient for logo readability */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${Math.round(height * 0.1)}px`,
        background: `linear-gradient(transparent, rgba(0,0,0,0.5))`,
      }} />

      {/* Logo badge — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: `${s.padding}px`,
        right: `${s.padding}px`,
        display: 'flex',
      }}>
        <LogoBadge mode={logoMode} logoUrl={logoUrl} project={project} accent={accent} logoSize={s.logo} borderRadius={s.logoBorderRadius} />
      </div>
    </div>
  );
}
