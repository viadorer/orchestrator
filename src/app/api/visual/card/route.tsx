import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Generuje textovou kartu jako PNG obrázek.
 * Používá @vercel/og (Satori) – nativní řešení pro Vercel.
 * 
 * GET /api/visual/card?hook=1,37&body=dětí na ženu&project=ČeskoSobě&bg=1a1a2e&accent=e94560&text=ffffff
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const hook = searchParams.get('hook') || '1,37';
  const body = searchParams.get('body') || '';
  const subtitle = searchParams.get('subtitle') || '';
  const project = searchParams.get('project') || '';
  const bg = searchParams.get('bg') || '1a1a2e';
  const accent = searchParams.get('accent') || 'e94560';
  const textColor = searchParams.get('text') || 'ffffff';
  const width = parseInt(searchParams.get('w') || '1200');
  const height = parseInt(searchParams.get('h') || '630');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: `#${bg}`,
          padding: '60px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Accent line top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            backgroundColor: `#${accent}`,
          }}
        />

        {/* Hook number */}
        <div
          style={{
            fontSize: '120px',
            fontWeight: 900,
            color: `#${textColor}`,
            lineHeight: 1,
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          {hook}
        </div>

        {/* Body text */}
        {body && (
          <div
            style={{
              fontSize: '28px',
              fontWeight: 400,
              color: `#${textColor}`,
              opacity: 0.85,
              textAlign: 'center',
              maxWidth: '80%',
              lineHeight: 1.4,
              marginBottom: '16px',
            }}
          >
            {body}
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: '20px',
              fontWeight: 300,
              color: `#${accent}`,
              textAlign: 'center',
              maxWidth: '70%',
              lineHeight: 1.3,
              marginTop: '8px',
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Project name bottom */}
        {project && (
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '40px',
              fontSize: '18px',
              fontWeight: 600,
              color: `#${textColor}`,
              opacity: 0.5,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {project}
          </div>
        )}

        {/* Accent line bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            backgroundColor: `#${accent}`,
          }}
        />
      </div>
    ),
    {
      width,
      height,
    },
  );
}
