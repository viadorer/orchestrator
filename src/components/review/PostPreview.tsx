'use client';

import { useState } from 'react';
import { PLATFORM_LIMITS, validatePost, type ValidationResult } from '@/lib/platforms';
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

interface PostPreviewProps {
  text: string;
  platforms: string[];
  projectName?: string;
  imageUrl?: string | null;
  chartUrl?: string | null;
  cardUrl?: string | null;
}

export function PostPreview({ text, platforms, projectName, imageUrl, chartUrl, cardUrl }: PostPreviewProps) {
  const [activePlatform, setActivePlatform] = useState(platforms[0] || 'facebook');

  const validation = validatePost(text, activePlatform);
  const limits = PLATFORM_LIMITS[activePlatform];

  if (!limits) return null;

  const mediaUrl = imageUrl || chartUrl || cardUrl;
  const handle = projectName?.toLowerCase().replace(/\s+/g, '') || 'projekt';
  const initial = (projectName || 'P')[0];

  return (
    <div className="space-y-4">
      {/* Platform tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Eye className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500 mr-1">Náhled:</span>
        {platforms.map(p => {
          const v = validatePost(text, p);
          return (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                activePlatform === p
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {v.valid ? (
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-red-400" />
              )}
              {PLATFORM_LIMITS[p]?.name || p}
            </button>
          );
        })}
      </div>

      {/* Preview mockup */}
      <div className="rounded-xl overflow-hidden border border-slate-700 max-w-md">
        <PlatformMockup
          platform={activePlatform}
          text={text}
          validation={validation}
          projectName={projectName || 'Projekt'}
          handle={handle}
          initial={initial}
          mediaUrl={mediaUrl}
        />
      </div>

      {/* Validation results */}
      <ValidationBadges validation={validation} platform={activePlatform} />
    </div>
  );
}

// ============================================
// Validation Badges
// ============================================

function ValidationBadges({ validation, platform }: { validation: ValidationResult; platform: string }) {
  const { stats, errors, warnings } = validation;
  const limits = PLATFORM_LIMITS[platform];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs flex-wrap">
        <span className={`font-medium ${stats.isOverLimit ? 'text-red-400' : 'text-slate-400'}`}>
          {stats.charCount}/{limits?.maxChars || '?'}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">{stats.hashtagCount} hashtagů</span>
        <span className="text-slate-600">|</span>
        {stats.isTruncated ? (
          <span className="text-amber-400">Ořízne se po {limits?.visibleChars} zn.</span>
        ) : (
          <span className="text-emerald-400">Celý text viditelný</span>
        )}
      </div>

      {errors.map((err, i) => (
        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-red-300">{err}</span>
        </div>
      ))}

      {warnings.map((warn, i) => (
        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-amber-300">{warn}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Truncated Text
// ============================================

function TruncatedText({ text, visibleChars, truncationText, linkColor }: {
  text: string; visibleChars: number; truncationText: string; linkColor?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isTruncated = text.length > visibleChars;

  if (!isTruncated || expanded) {
    return (
      <span style={{ whiteSpace: 'pre-wrap' }}>
        {text}
        {isTruncated && (
          <button onClick={() => setExpanded(false)} className="opacity-50 ml-1 text-xs">méně</button>
        )}
      </span>
    );
  }

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {text.substring(0, visibleChars)}
      <button onClick={() => setExpanded(true)} className="hover:underline" style={{ color: linkColor || '#3b82f6' }}>
        {truncationText}
      </button>
    </span>
  );
}

// ============================================
// Platform Mockup Router
// ============================================

interface MockupProps {
  platform: string;
  text: string;
  validation: ValidationResult;
  projectName: string;
  handle: string;
  initial: string;
  mediaUrl?: string | null;
}

function PlatformMockup(props: MockupProps) {
  switch (props.platform) {
    case 'facebook': return <FacebookMockup {...props} />;
    case 'instagram': return <InstagramMockup {...props} />;
    case 'linkedin': return <LinkedInMockup {...props} />;
    case 'x': return <XMockup {...props} />;
    case 'tiktok': return <TikTokMockup {...props} />;
    case 'youtube': return <YouTubeMockup {...props} />;
    case 'threads': return <ThreadsMockup {...props} />;
    case 'bluesky': return <BlueskyMockup {...props} />;
    case 'pinterest': return <PinterestMockup {...props} />;
    case 'reddit': return <RedditMockup {...props} />;
    case 'google-business': return <GoogleBusinessMockup {...props} />;
    case 'telegram': return <TelegramMockup {...props} />;
    case 'snapchat': return <SnapchatMockup {...props} />;
    default: return <GenericMockup {...props} />;
  }
}

// ============================================
// Shared Components
// ============================================

function Avatar({ initial, bg, size = 10 }: { initial: string; bg: string; size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`} style={{ backgroundColor: bg, width: size * 4, height: size * 4 }}>
      {initial}
    </div>
  );
}

function MediaBlock({ url, aspect }: { url: string; aspect?: string }) {
  return <img src={url} alt="" className={`w-full ${aspect || ''}`} loading="lazy" />;
}

function ErrorBar({ validation, name }: { validation: ValidationResult; name: string }) {
  if (validation.valid) return null;
  return (
    <div className="px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
      Post nesplňuje limity pro {name}
    </div>
  );
}

// ============================================
// Facebook
// ============================================
function FacebookMockup({ text, validation, projectName, initial, mediaUrl }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1c1e21' }}>
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-1.5">
        <Avatar initial={initial} bg="#1877F2" />
        <div><div className="text-[13px] font-semibold">{projectName}</div><div className="text-[11px]" style={{ color: '#65676b' }}>Právě teď · 🌐</div></div>
      </div>
      <div className="px-3 pb-2 text-[14px] leading-[1.35]">
        <TruncatedText text={text} visibleChars={477} truncationText="... Zobrazit více" linkColor="#385898" />
      </div>
      {mediaUrl && <div style={{ borderTop: '1px solid #e4e6eb' }}><MediaBlock url={mediaUrl} /></div>}
      <div className="flex justify-around py-1.5 text-[12px] font-medium" style={{ borderTop: '1px solid #e4e6eb', color: '#65676b' }}>
        <span>👍 To se mi líbí</span><span>💬 Komentář</span><span>↗ Sdílet</span>
      </div>
      <ErrorBar validation={validation} name="Facebook" />
    </div>
  );
}

// ============================================
// Instagram
// ============================================
function InstagramMockup({ text, validation, projectName, handle, initial, mediaUrl }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#000', fontFamily: '-apple-system, sans-serif', color: '#fff' }}>
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>{initial}</div>
        <span className="text-[13px] font-semibold">{handle}</span>
      </div>
      {mediaUrl ? <MediaBlock url={mediaUrl} aspect="aspect-square object-cover" /> : (
        <div className="w-full aspect-square flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
          <span className="text-[13px]" style={{ color: '#555' }}>Obrázek povinný pro Instagram</span>
        </div>
      )}
      <div className="flex items-center gap-4 px-3 py-2 text-[20px]">
        <span>♡</span><span>💬</span><span>📤</span><span className="ml-auto">🔖</span>
      </div>
      <div className="px-3 pb-3 text-[13px] leading-[1.4]">
        <span className="font-semibold mr-1">{handle}</span>
        <TruncatedText text={text} visibleChars={125} truncationText="...více" linkColor="#a8a8a8" />
      </div>
      <ErrorBar validation={validation} name="Instagram" />
    </div>
  );
}

// ============================================
// LinkedIn
// ============================================
function LinkedInMockup({ text, validation, projectName, initial, mediaUrl }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#fff', fontFamily: '-apple-system, system-ui, sans-serif', color: '#000000e6' }}>
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-1.5">
        <Avatar initial={initial} bg="#0A66C2" size={12} />
        <div><div className="text-[13px] font-semibold">{projectName}</div><div className="text-[11px]" style={{ color: '#00000099' }}>Správce stránky · Právě teď · 🌐</div></div>
      </div>
      <div className="px-3 pb-2 text-[13px] leading-[1.4]">
        <TruncatedText text={text} visibleChars={210} truncationText="...zobrazit více" linkColor="#0a66c2" />
      </div>
      {mediaUrl && <div style={{ borderTop: '1px solid #e0e0e0' }}><MediaBlock url={mediaUrl} /></div>}
      <div className="flex justify-around py-2 text-[11px] font-medium" style={{ borderTop: '1px solid #e0e0e0', color: '#00000099' }}>
        <span>👍 Líbí se mi</span><span>💬 Komentovat</span><span>🔄 Sdílet</span><span>📤 Odeslat</span>
      </div>
      <ErrorBar validation={validation} name="LinkedIn" />
    </div>
  );
}

// ============================================
// X (Twitter)
// ============================================
function XMockup({ text, validation, projectName, handle, initial, mediaUrl }: MockupProps) {
  const len = text.length;
  const over = len > 280;
  return (
    <div style={{ backgroundColor: '#000', fontFamily: '-apple-system, sans-serif', color: '#e7e9ea' }}>
      <div className="flex gap-2.5 p-3">
        <Avatar initial={initial} bg="#333" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5 text-[13px]">
            <span className="font-bold">{projectName}</span>
            <span style={{ color: '#71767b' }}>@{handle} · 1m</span>
          </div>
          <div className="text-[14px] leading-[1.35]" style={{ whiteSpace: 'pre-wrap' }}>
            {over ? (<><span>{text.substring(0, 280)}</span><span style={{ color: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)' }}>{text.substring(280)}</span></>) : text}
          </div>
          {mediaUrl && <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid #2f3336' }}><MediaBlock url={mediaUrl} /></div>}
          <div className="flex justify-between mt-2 text-[12px] max-w-[280px]" style={{ color: '#71767b' }}>
            <span>💬</span><span>🔄</span><span>♡</span><span>📊</span><span>📤</span>
          </div>
        </div>
      </div>
      <div className={`px-3 pb-1.5 text-right text-[11px] ${over ? 'text-red-400' : len > 260 ? 'text-amber-400' : ''}`} style={{ color: over ? '#f87171' : len > 260 ? '#fbbf24' : '#333' }}>{len}/280</div>
      <ErrorBar validation={validation} name="X" />
    </div>
  );
}

// ============================================
// TikTok
// ============================================
function TikTokMockup({ text, validation, projectName, handle, initial }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#000', fontFamily: '-apple-system, sans-serif', color: '#fff' }}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar initial={initial} bg="#FE2C55" size={8} />
          <span className="text-[13px] font-semibold">{handle}</span>
        </div>
        <div className="text-[13px] leading-[1.4]">
          <TruncatedText text={text} visibleChars={150} truncationText="...více" linkColor="#aaa" />
        </div>
        <div className="mt-2 text-[11px]" style={{ color: '#888' }}>🎵 originální zvuk – {projectName}</div>
      </div>
      <ErrorBar validation={validation} name="TikTok" />
    </div>
  );
}

// ============================================
// YouTube
// ============================================
function YouTubeMockup({ text, validation, projectName, initial }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#0f0f0f', fontFamily: 'Roboto, Arial, sans-serif', color: '#fff' }}>
      <div className="w-full aspect-video flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
        <span className="text-[40px]">▶</span>
      </div>
      <div className="p-3">
        <div className="text-[14px] font-medium leading-[1.3] mb-1.5">{text.substring(0, 100)}{text.length > 100 ? '...' : ''}</div>
        <div className="flex items-center gap-2 mb-2">
          <Avatar initial={initial} bg="#FF0000" size={6} />
          <span className="text-[12px]" style={{ color: '#aaa' }}>{projectName}</span>
        </div>
        <div className="text-[12px] leading-[1.4]" style={{ color: '#aaa' }}>
          <TruncatedText text={text} visibleChars={200} truncationText="...ZOBRAZIT VÍCE" linkColor="#3ea6ff" />
        </div>
      </div>
      <ErrorBar validation={validation} name="YouTube" />
    </div>
  );
}

// ============================================
// Threads
// ============================================
function ThreadsMockup({ text, validation, projectName, handle, initial, mediaUrl }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#101010', fontFamily: '-apple-system, sans-serif', color: '#f5f5f5' }}>
      <div className="flex gap-2.5 p-3">
        <Avatar initial={initial} bg="#333" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5 text-[13px]">
            <span className="font-semibold">{handle}</span>
            <span style={{ color: '#777' }}>· 1m</span>
          </div>
          <div className="text-[14px] leading-[1.4]" style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
          {mediaUrl && <div className="mt-2 rounded-lg overflow-hidden"><MediaBlock url={mediaUrl} /></div>}
          <div className="flex gap-5 mt-2 text-[18px]" style={{ color: '#777' }}>
            <span>♡</span><span>💬</span><span>🔄</span><span>📤</span>
          </div>
        </div>
      </div>
      <div className="text-right px-3 pb-1.5 text-[11px]" style={{ color: '#555' }}>{text.length}/500</div>
      <ErrorBar validation={validation} name="Threads" />
    </div>
  );
}

// ============================================
// Bluesky
// ============================================
function BlueskyMockup({ text, validation, projectName, handle, initial, mediaUrl }: MockupProps) {
  const len = text.length;
  const over = len > 300;
  return (
    <div style={{ backgroundColor: '#fff', fontFamily: '-apple-system, sans-serif', color: '#000' }}>
      <div className="flex gap-2.5 p-3">
        <Avatar initial={initial} bg="#0085FF" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5 text-[13px]">
            <span className="font-bold">{projectName}</span>
            <span style={{ color: '#888' }}>@{handle}.bsky.social</span>
          </div>
          <div className="text-[14px] leading-[1.4]" style={{ whiteSpace: 'pre-wrap' }}>
            {over ? (<><span>{text.substring(0, 300)}</span><span style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>{text.substring(300)}</span></>) : text}
          </div>
          {mediaUrl && <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid #e5e7eb' }}><MediaBlock url={mediaUrl} /></div>}
          <div className="flex gap-6 mt-2 text-[12px]" style={{ color: '#888' }}>
            <span>💬</span><span>🔄</span><span>♡</span><span>📤</span>
          </div>
        </div>
      </div>
      <div className={`px-3 pb-1.5 text-right text-[11px]`} style={{ color: over ? '#ef4444' : '#ccc' }}>{len}/300</div>
      <ErrorBar validation={validation} name="Bluesky" />
    </div>
  );
}

// ============================================
// Pinterest
// ============================================
function PinterestMockup({ text, validation, projectName, initial, mediaUrl }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#fff', fontFamily: '-apple-system, sans-serif', color: '#111' }}>
      {mediaUrl ? (
        <div className="rounded-t-2xl overflow-hidden"><MediaBlock url={mediaUrl} /></div>
      ) : (
        <div className="w-full aspect-[2/3] flex items-center justify-center rounded-t-2xl" style={{ backgroundColor: '#f5f5f5' }}>
          <span className="text-[13px]" style={{ color: '#999' }}>Obrázek povinný pro Pinterest</span>
        </div>
      )}
      <div className="p-3">
        <div className="text-[14px] font-semibold mb-1">{text.substring(0, 100)}{text.length > 100 ? '...' : ''}</div>
        <div className="text-[12px] leading-[1.4]" style={{ color: '#555' }}>
          <TruncatedText text={text} visibleChars={100} truncationText="...Více" linkColor="#E60023" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Avatar initial={initial} bg="#E60023" size={6} />
          <span className="text-[12px] font-medium">{projectName}</span>
        </div>
      </div>
      <ErrorBar validation={validation} name="Pinterest" />
    </div>
  );
}

// ============================================
// Reddit
// ============================================
function RedditMockup({ text, validation, projectName, handle, initial, mediaUrl }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#1a1a1b', fontFamily: '-apple-system, Noto Sans, sans-serif', color: '#d7dadc' }}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2 text-[11px]" style={{ color: '#818384' }}>
          <Avatar initial={initial} bg="#FF4500" size={5} />
          <span className="font-bold" style={{ color: '#d7dadc' }}>r/{handle}</span>
          <span>· Právě teď</span>
        </div>
        <div className="text-[15px] font-medium mb-1.5">{text.substring(0, 80)}</div>
        <div className="text-[13px] leading-[1.5]" style={{ color: '#b0b3b8' }}>
          <TruncatedText text={text} visibleChars={300} truncationText="...read more" linkColor="#4fbcff" />
        </div>
        {mediaUrl && <div className="mt-2 rounded-lg overflow-hidden"><MediaBlock url={mediaUrl} /></div>}
        <div className="flex gap-4 mt-3 text-[11px] font-bold" style={{ color: '#818384' }}>
          <span>⬆ Vote</span><span>💬 Comments</span><span>📤 Share</span>
        </div>
      </div>
      <ErrorBar validation={validation} name="Reddit" />
    </div>
  );
}

// ============================================
// Google Business
// ============================================
function GoogleBusinessMockup({ text, validation, projectName, initial, mediaUrl }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#fff', fontFamily: 'Google Sans, Roboto, Arial, sans-serif', color: '#202124' }}>
      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar initial={initial} bg="#4285F4" />
          <div>
            <div className="text-[14px] font-medium">{projectName}</div>
            <div className="text-[11px]" style={{ color: '#70757a' }}>Právě teď · Aktualizace</div>
          </div>
        </div>
        <div className="text-[13px] leading-[1.5]">
          <TruncatedText text={text} visibleChars={200} truncationText="...Více" linkColor="#1a73e8" />
        </div>
        {mediaUrl && <div className="mt-2 rounded-lg overflow-hidden"><MediaBlock url={mediaUrl} /></div>}
      </div>
      <div className="flex gap-3 px-3 pb-3">
        <button className="px-4 py-1.5 rounded-full text-[12px] font-medium" style={{ backgroundColor: '#1a73e8', color: '#fff' }}>Zjistit více</button>
        <button className="px-4 py-1.5 rounded-full text-[12px] font-medium" style={{ border: '1px solid #dadce0', color: '#1a73e8' }}>Zavolat</button>
      </div>
      <ErrorBar validation={validation} name="Google Business" />
    </div>
  );
}

// ============================================
// Telegram
// ============================================
function TelegramMockup({ text, validation, projectName, initial, mediaUrl }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#17212b', fontFamily: '-apple-system, sans-serif', color: '#fff' }}>
      <div className="flex items-center gap-2.5 px-3 py-2" style={{ backgroundColor: '#1e2c3a' }}>
        <Avatar initial={initial} bg="#5288c1" size={8} />
        <div>
          <div className="text-[13px] font-semibold">{projectName}</div>
          <div className="text-[11px]" style={{ color: '#6d8da7' }}>kanál · 1 234 odběratelů</div>
        </div>
      </div>
      {mediaUrl && <MediaBlock url={mediaUrl} />}
      <div className="px-3 py-2.5">
        <div className="text-[14px] leading-[1.5]" style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
        <div className="text-right mt-1 text-[10px]" style={{ color: '#6d8da7' }}>✓✓ 20:00</div>
      </div>
      <ErrorBar validation={validation} name="Telegram" />
    </div>
  );
}

// ============================================
// Snapchat
// ============================================
function SnapchatMockup({ text, validation, projectName, initial }: MockupProps) {
  return (
    <div style={{ backgroundColor: '#000', fontFamily: '-apple-system, sans-serif', color: '#fff' }}>
      <div className="w-full aspect-[9/16] relative flex flex-col justify-end" style={{ backgroundColor: '#1a1a1a', maxHeight: '300px' }}>
        <div className="p-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#FFFC00', color: '#000' }}>{initial}</div>
            <span className="text-[12px] font-semibold">{projectName}</span>
          </div>
          <div className="text-[13px] leading-[1.3]">{text.length > 250 ? text.substring(0, 250) : text}</div>
        </div>
      </div>
      <div className="flex justify-around py-2 text-[11px]" style={{ color: '#aaa' }}>
        <span>📤 Odeslat</span><span>💬 Chat</span><span>📸 Snap</span>
      </div>
      <ErrorBar validation={validation} name="Snapchat" />
    </div>
  );
}

// ============================================
// Generic fallback
// ============================================
function GenericMockup({ text, validation, projectName, initial, mediaUrl, platform }: MockupProps) {
  const limits = PLATFORM_LIMITS[platform];
  return (
    <div style={{ backgroundColor: limits?.previewBg || '#1a1a1a', fontFamily: limits?.previewFont || 'sans-serif', color: limits?.previewBg === '#ffffff' ? '#000' : '#fff' }}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar initial={initial} bg={limits?.previewAccent || '#666'} size={8} />
          <div>
            <div className="text-[13px] font-semibold">{projectName}</div>
            <div className="text-[11px] opacity-50">{limits?.name || platform} · Právě teď</div>
          </div>
        </div>
        <div className="text-[13px] leading-[1.4]">
          <TruncatedText text={text} visibleChars={limits?.visibleChars || 300} truncationText={limits?.truncationText || '...více'} linkColor={limits?.previewAccent} />
        </div>
        {mediaUrl && <div className="mt-2 rounded-lg overflow-hidden"><MediaBlock url={mediaUrl} /></div>}
      </div>
      <ErrorBar validation={validation} name={limits?.name || platform} />
    </div>
  );
}
