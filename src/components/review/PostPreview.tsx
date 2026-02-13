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

  return (
    <div className="space-y-4">
      {/* Platform tabs */}
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-500 mr-2">Náhled:</span>
        {platforms.map(p => {
          const v = validatePost(text, p);
          return (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
      <div className="rounded-xl overflow-hidden border border-slate-700">
        {activePlatform === 'facebook' && (
          <FacebookPreview text={text} validation={validation} projectName={projectName} mediaUrl={mediaUrl} />
        )}
        {activePlatform === 'linkedin' && (
          <LinkedInPreview text={text} validation={validation} projectName={projectName} mediaUrl={mediaUrl} />
        )}
        {activePlatform === 'instagram' && (
          <InstagramPreview text={text} validation={validation} projectName={projectName} mediaUrl={mediaUrl} />
        )}
        {activePlatform === 'x' && (
          <XPreview text={text} validation={validation} projectName={projectName} mediaUrl={mediaUrl} />
        )}
        {activePlatform === 'tiktok' && (
          <TikTokPreview text={text} validation={validation} projectName={projectName} />
        )}
      </div>

      {/* Validation results */}
      <ValidationBadges validation={validation} platformName={limits.name} />
    </div>
  );
}

// ============================================
// Validation Badges
// ============================================

function ValidationBadges({ validation, platformName }: { validation: ValidationResult; platformName: string }) {
  const { stats, errors, warnings } = validation;

  return (
    <div className="space-y-2">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs">
        <span className={`font-medium ${stats.isOverLimit ? 'text-red-400' : 'text-slate-400'}`}>
          {stats.charCount} znaků
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">{stats.hashtagCount} hashtagů</span>
        <span className="text-slate-600">|</span>
        {stats.isTruncated ? (
          <span className="text-amber-400">Ořízne se po {PLATFORM_LIMITS[Object.keys(PLATFORM_LIMITS).find(k => PLATFORM_LIMITS[k].name === platformName) || '']?.visibleChars || '?'} znacích</span>
        ) : (
          <span className="text-emerald-400">Celý text viditelný</span>
        )}
      </div>

      {/* Errors */}
      {errors.map((err, i) => (
        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-red-300">{err}</span>
        </div>
      ))}

      {/* Warnings */}
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
// Platform Mockups
// ============================================

function TruncatedText({ text, visibleChars, truncationText }: { text: string; visibleChars: number; truncationText: string }) {
  const [expanded, setExpanded] = useState(false);
  const isTruncated = text.length > visibleChars;

  if (!isTruncated || expanded) {
    return (
      <span style={{ whiteSpace: 'pre-wrap' }}>
        {text}
        {isTruncated && (
          <button onClick={() => setExpanded(false)} className="text-slate-400 ml-1 text-xs">
            méně
          </button>
        )}
      </span>
    );
  }

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {text.substring(0, visibleChars)}
      <button onClick={() => setExpanded(true)} className="text-blue-500 hover:underline">
        {truncationText}
      </button>
    </span>
  );
}

// ---- Facebook ----
function FacebookPreview({ text, validation, projectName, mediaUrl }: { text: string; validation: ValidationResult; projectName?: string; mediaUrl?: string | null }) {
  return (
    <div style={{ backgroundColor: '#ffffff', fontFamily: PLATFORM_LIMITS.facebook.previewFont }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3 pb-2">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {(projectName || 'P')[0]}
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{projectName || 'Projekt'}</div>
          <div className="text-xs text-gray-500">Právě · 🌐</div>
        </div>
      </div>

      {/* Text */}
      <div className="px-3 pb-3 text-sm text-gray-900 leading-relaxed">
        <TruncatedText text={text} visibleChars={477} truncationText="... Zobrazit více" />
      </div>

      {/* Media */}
      {mediaUrl && (
        <div className="border-t border-gray-200">
          <img src={mediaUrl} alt="" className="w-full" loading="lazy" />
        </div>
      )}

      {/* Engagement bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 text-xs text-gray-500">
        <span>👍 To se mi líbí</span>
        <span>💬 Komentář</span>
        <span>↗️ Sdílet</span>
      </div>

      {/* Validation overlay */}
      {!validation.valid && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-200 text-xs text-red-600">
          ⚠️ Post nesplňuje limity pro Facebook
        </div>
      )}
    </div>
  );
}

// ---- LinkedIn ----
function LinkedInPreview({ text, validation, projectName, mediaUrl }: { text: string; validation: ValidationResult; projectName?: string; mediaUrl?: string | null }) {
  return (
    <div style={{ backgroundColor: '#ffffff', fontFamily: PLATFORM_LIMITS.linkedin.previewFont }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3 pb-2">
        <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm">
          {(projectName || 'P')[0]}
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{projectName || 'Projekt'}</div>
          <div className="text-xs text-gray-500">Správce stránky · Právě teď</div>
          <div className="text-xs text-gray-400">🌐</div>
        </div>
      </div>

      {/* Text */}
      <div className="px-3 pb-3 text-sm text-gray-800 leading-relaxed">
        <TruncatedText text={text} visibleChars={210} truncationText="...zobrazit více" />
      </div>

      {/* Media */}
      {mediaUrl && (
        <div className="border-t border-gray-200">
          <img src={mediaUrl} alt="" className="w-full" loading="lazy" />
        </div>
      )}

      {/* Engagement */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 text-xs text-gray-500 font-medium">
        <span>👍 To se mi líbí</span>
        <span>💬 Komentovat</span>
        <span>🔄 Sdílet</span>
        <span>📤 Odeslat</span>
      </div>

      {!validation.valid && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-200 text-xs text-red-600">
          ⚠️ Post nesplňuje limity pro LinkedIn
        </div>
      )}
    </div>
  );
}

// ---- Instagram ----
function InstagramPreview({ text, validation, projectName, mediaUrl }: { text: string; validation: ValidationResult; projectName?: string; mediaUrl?: string | null }) {
  return (
    <div style={{ backgroundColor: '#000000', fontFamily: PLATFORM_LIMITS.instagram.previewFont }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs ring-2 ring-pink-500 ring-offset-2 ring-offset-black">
          {(projectName || 'P')[0]}
        </div>
        <span className="text-sm font-semibold text-white">{projectName?.toLowerCase().replace(/\s+/g, '') || 'projekt'}</span>
      </div>

      {/* Image area */}
      {mediaUrl ? (
        <img src={mediaUrl} alt="" className="w-full aspect-square object-cover" loading="lazy" />
      ) : (
        <div className="w-full aspect-square bg-gray-900 flex items-center justify-center">
          <span className="text-gray-600 text-sm">Obrázek povinný pro Instagram</span>
        </div>
      )}

      {/* Engagement icons */}
      <div className="flex items-center gap-4 px-3 py-2.5 text-white">
        <span>♡</span>
        <span>💬</span>
        <span>📤</span>
        <span className="ml-auto">🔖</span>
      </div>

      {/* Caption */}
      <div className="px-3 pb-3 text-sm text-white leading-relaxed">
        <span className="font-semibold mr-1.5">{projectName?.toLowerCase().replace(/\s+/g, '') || 'projekt'}</span>
        <TruncatedText text={text} visibleChars={125} truncationText="...více" />
      </div>

      {!validation.valid && (
        <div className="px-3 py-2 bg-red-900/50 border-t border-red-800 text-xs text-red-300">
          ⚠️ Post nesplňuje limity pro Instagram
        </div>
      )}
    </div>
  );
}

// ---- X (Twitter) ----
function XPreview({ text, validation, projectName, mediaUrl }: { text: string; validation: ValidationResult; projectName?: string; mediaUrl?: string | null }) {
  const charCount = text.length;
  const isOverLimit = charCount > 280;

  return (
    <div style={{ backgroundColor: '#000000', fontFamily: PLATFORM_LIMITS.x.previewFont }}>
      <div className="flex gap-3 p-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {(projectName || 'P')[0]}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-bold text-white">{projectName || 'Projekt'}</span>
            <span className="text-sm text-gray-500">@{projectName?.toLowerCase().replace(/\s+/g, '') || 'projekt'}</span>
            <span className="text-sm text-gray-500">· 1m</span>
          </div>

          {/* Text */}
          <div className="text-sm text-white leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
            {isOverLimit ? (
              <>
                <span>{text.substring(0, 280)}</span>
                <span className="text-red-400 bg-red-400/10">{text.substring(280)}</span>
              </>
            ) : (
              text
            )}
          </div>

          {/* Media */}
          {mediaUrl && (
            <div className="mt-2 rounded-xl overflow-hidden border border-gray-800">
              <img src={mediaUrl} alt="" className="w-full" loading="lazy" />
            </div>
          )}

          {/* Engagement */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 max-w-xs">
            <span>💬</span>
            <span>🔄</span>
            <span>♡</span>
            <span>📊</span>
            <span>📤</span>
          </div>
        </div>
      </div>

      {/* Character counter */}
      <div className={`px-3 pb-2 text-right text-xs ${isOverLimit ? 'text-red-400' : charCount > 260 ? 'text-amber-400' : 'text-gray-600'}`}>
        {charCount}/280
      </div>

      {!validation.valid && (
        <div className="px-3 py-2 bg-red-900/50 border-t border-red-800 text-xs text-red-300">
          ⚠️ Post překračuje limit 280 znaků pro X
        </div>
      )}
    </div>
  );
}

// ---- TikTok ----
function TikTokPreview({ text, validation, projectName }: { text: string; validation: ValidationResult; projectName?: string }) {
  return (
    <div style={{ backgroundColor: '#000000', fontFamily: PLATFORM_LIMITS.tiktok.previewFont }}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
            {(projectName || 'P')[0]}
          </div>
          <span className="text-sm font-semibold text-white">{projectName || 'Projekt'}</span>
        </div>
        <div className="text-sm text-white leading-relaxed">
          <TruncatedText text={text} visibleChars={150} truncationText="...více" />
        </div>
      </div>

      {!validation.valid && (
        <div className="px-3 py-2 bg-red-900/50 border-t border-red-800 text-xs text-red-300">
          ⚠️ Post nesplňuje limity pro TikTok
        </div>
      )}
    </div>
  );
}
