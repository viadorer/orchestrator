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

  const props = { hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height };

  let element: React.ReactElement;

  switch (template) {
    case 'photo_strip':
      element = <PhotoStripTemplate {...props} />;
      break;
    case 'split':
      element = <SplitTemplate {...props} />;
      break;
    case 'gradient':
      element = <GradientTemplate {...props} />;
      break;
    case 'minimal':
      element = <MinimalTemplate {...props} />;
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
    instagram: { w: 1080, h: 1350 },
    facebook: { w: 1200, h: 630 },
    linkedin: { w: 1200, h: 627 },
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
}

// ─── Logo Component (vždy vpravo dole) ──────────────────────

function LogoBadge({ logoUrl, project, textColor, accent, size = 'normal' }: { logoUrl: string; project: string; textColor: string; accent: string; size?: 'normal' | 'small' }) {
  const logoSize = size === 'small' ? 28 : 40;
  const fontSize = size === 'small' ? 12 : 16;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {logoUrl ? (
        <img src={logoUrl} width={logoSize} height={logoSize} style={{ borderRadius: '8px' }} />
      ) : project ? (
        <div style={{
          width: `${logoSize}px`,
          height: `${logoSize}px`,
          borderRadius: '8px',
          backgroundColor: `#${accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${logoSize * 0.5}px`,
          fontWeight: 900,
          color: '#ffffff',
        }}>
          {project[0]?.toUpperCase()}
        </div>
      ) : null}
      {project && (
        <span style={{
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          color: `#${textColor}`,
          opacity: 0.7,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>
          {project}
        </span>
      )}
    </div>
  );
}

// ─── Template 1: Bold Card (výrazné číslo s efekty) ─────────

function BoldCardTemplate({ hook, body, subtitle, project, bg, accent, textColor, logoUrl, width, height }: TemplateProps) {
  const isVertical = height > width;
  const hookSize = Math.min(width * 0.18, isVertical ? 180 : 140);
  const bodySize = Math.min(width * 0.04, 36);
  const subtitleSize = Math.min(width * 0.028, 24);

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
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: `radial-gradient(circle, #${accent}22 0%, transparent 70%)`,
        transform: 'translate(-50%, -50%)',
      }} />

      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '5px',
        background: `linear-gradient(90deg, #${accent}, #${accent}88, #${accent})`,
      }} />

      {/* Decorative corner elements */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '30px',
        width: '60px',
        height: '60px',
        borderTop: `3px solid #${accent}`,
        borderLeft: `3px solid #${accent}`,
        opacity: 0.4,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        borderBottom: `3px solid #${accent}`,
        borderRight: `3px solid #${accent}`,
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
        width: '80px',
        height: '4px',
        backgroundColor: `#${accent}`,
        borderRadius: '2px',
        marginBottom: '20px',
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
        bottom: '24px',
        right: '30px',
        display: 'flex',
      }}>
        <LogoBadge logoUrl={logoUrl} project={project} textColor={textColor} accent={accent} />
      </div>

      {/* Bottom accent bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '5px',
        background: `linear-gradient(90deg, #${accent}, #${accent}88, #${accent})`,
      }} />
    </div>
  );
}

// ─── Template 2: Photo + Brand Strip ────────────────────────

function PhotoStripTemplate({ hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height }: TemplateProps) {
  const stripHeight = Math.round(height * 0.28);
  const hookSize = Math.min(stripHeight * 0.45, 52);
  const bodySize = Math.min(stripHeight * 0.2, 22);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Photo area */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: `#${bg}`,
      }}>
        {photoUrl ? (
          <img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, #${bg} 0%, #${accent}33 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ fontSize: '80px', opacity: 0.1, color: `#${textColor}` }}>📷</div>
          </div>
        )}
        {/* Gradient fade to strip */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: `linear-gradient(transparent, #${bg})`,
        }} />
      </div>

      {/* Brand strip */}
      <div style={{
        height: `${stripHeight}px`,
        backgroundColor: `#${bg}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 40px',
        position: 'relative',
      }}>
        {/* Accent line top of strip */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '40px',
          right: '40px',
          height: '3px',
          background: `linear-gradient(90deg, #${accent}, transparent)`,
        }} />

        {hook && (
          <div style={{
            fontSize: `${hookSize}px`,
            fontWeight: 900,
            color: `#${textColor}`,
            lineHeight: 1.2,
            marginBottom: '6px',
          }}>
            <span style={{ color: `#${accent}` }}>{hook.match(/[\d,.%]+/)?.[0] || ''}</span>
            {hook.replace(/[\d,.%]+/, '')}
          </div>
        )}

        {body && (
          <div style={{
            fontSize: `${bodySize}px`,
            fontWeight: 400,
            color: `#${textColor}`,
            opacity: 0.8,
            lineHeight: 1.4,
          }}>
            {body}
          </div>
        )}

        {/* Logo — bottom right of strip */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '30px',
          display: 'flex',
        }}>
          <LogoBadge logoUrl={logoUrl} project={project} textColor={textColor} accent={accent} size="small" />
        </div>
      </div>
    </div>
  );
}

// ─── Template 3: Split Layout ───────────────────────────────

function SplitTemplate({ hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height }: TemplateProps) {
  const isVertical = height > width;
  const hookSize = isVertical ? 48 : 56;
  const bodySize = isVertical ? 18 : 22;

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
        {photoUrl ? (
          <img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, #${accent}44 0%, #${bg} 100%)`,
          }} />
        )}
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
        padding: '40px',
        position: 'relative',
      }}>
        {/* Accent vertical bar */}
        <div style={{
          position: 'absolute',
          top: '40px',
          left: isVertical ? '40px' : '0',
          width: '4px',
          height: '60px',
          backgroundColor: `#${accent}`,
          borderRadius: '2px',
        }} />

        {hook && (
          <div style={{
            fontSize: `${hookSize}px`,
            fontWeight: 900,
            color: `#${accent}`,
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
            opacity: 0.9,
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
          bottom: '24px',
          right: '30px',
          display: 'flex',
        }}>
          <LogoBadge logoUrl={logoUrl} project={project} textColor={textColor} accent={accent} size="small" />
        </div>
      </div>
    </div>
  );
}

// ─── Template 4: Gradient Overlay ───────────────────────────

function GradientTemplate({ hook, body, subtitle, project, bg, accent, textColor, logoUrl, photoUrl, width, height }: TemplateProps) {
  const hookSize = Math.min(width * 0.065, 72);
  const bodySize = Math.min(width * 0.03, 28);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Full-bleed photo */}
      {photoUrl ? (
        <img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} />
      ) : (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, #${bg} 0%, #${accent}44 50%, #${bg} 100%)`,
        }} />
      )}

      {/* Heavy gradient overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
        background: `linear-gradient(transparent 0%, #${bg}cc 40%, #${bg}ee 100%)`,
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: `#${accent}`,
      }} />

      {/* Content at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {hook && (
          <div style={{
            fontSize: `${hookSize}px`,
            fontWeight: 900,
            color: `#${textColor}`,
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
            color: `#${textColor}`,
            opacity: 0.9,
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
          bottom: '24px',
          right: '30px',
          display: 'flex',
        }}>
          <LogoBadge logoUrl={logoUrl} project={project} textColor="ffffff" accent={accent} size="small" />
        </div>
      </div>
    </div>
  );
}

// ─── Template 5: Minimal Badge ──────────────────────────────

function MinimalTemplate({ project, bg, accent, textColor, logoUrl, photoUrl, width, height }: TemplateProps) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Full photo */}
      {photoUrl ? (
        <img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, #${bg} 0%, #${accent}33 100%)`,
        }} />
      )}

      {/* Subtle bottom gradient for logo readability */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '120px',
        background: `linear-gradient(transparent, rgba(0,0,0,0.5))`,
      }} />

      {/* Logo badge — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '12px',
        backgroundColor: `#${bg}cc`,
        border: `1px solid #${accent}44`,
      }}>
        <LogoBadge logoUrl={logoUrl} project={project} textColor="ffffff" accent={accent} size="small" />
      </div>
    </div>
  );
}
