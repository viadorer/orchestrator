'use client';

import { useState } from 'react';
import { Pencil, ImageIcon, Check, X, Trash2, Send, ChevronLeft, ChevronRight, Save, TrendingUp, Sparkles } from 'lucide-react';

interface QueueItem {
  id: string;
  project_id: string;
  text_content: string;
  image_prompt: string | null;
  content_type: string;
  platforms: string[];
  ai_scores: {
    creativity?: number;
    tone_match?: number;
    hallucination_risk?: number;
    value_score?: number;
    overall?: number;
  };
  status: string;
  source: string;
  created_at: string;
  projects?: { name: string; slug: string; platforms?: string[] };
  visual_type?: string;
  chart_url?: string | null;
  card_url?: string | null;
  template_url?: string | null;
  editor_review?: Record<string, unknown> | null;
  image_url?: string | null;
  generation_context?: Record<string, unknown> | null;
  engagement_score?: number | null;
  engagement_metrics?: Record<string, unknown> | null;
  media_urls?: string[] | null;
}

interface PostCardProps {
  item: QueueItem;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onMediaPicker: () => void;
  onApprove: () => void;
  onPublish: () => void;
  onReject: () => void;
  platformLabels: Record<string, string>;
  platformBadgeColors: Record<string, string>;
  platformOverrides: string[];
  onPlatformToggle: (platform: string, isActive: boolean) => void;
  statusFilter: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn',
  x: 'X (Twitter)', tiktok: 'TikTok', youtube: 'YouTube',
  threads: 'Threads', bluesky: 'Bluesky', pinterest: 'Pinterest',
  reddit: 'Reddit', 'google-business': 'Google Business', telegram: 'Telegram',
  snapchat: 'Snapchat',
};

const PLATFORM_BADGE_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600', instagram: 'bg-purple-600',
  linkedin: 'bg-blue-700', x: 'bg-zinc-700', tiktok: 'bg-zinc-700',
  youtube: 'bg-red-600', threads: 'bg-zinc-700', bluesky: 'bg-sky-500',
  pinterest: 'bg-red-700', reddit: 'bg-orange-600',
  'google-business': 'bg-blue-500', telegram: 'bg-sky-600', snapchat: 'bg-yellow-500',
};

export function PostCard({
  item,
  selected,
  onToggleSelect,
  onEdit,
  onMediaPicker,
  onApprove,
  onPublish,
  onReject,
  platformOverrides,
  onPlatformToggle,
  statusFilter,
}: PostCardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const mediaItems = item.media_urls && item.media_urls.length > 0 
    ? item.media_urls 
    : item.template_url 
    ? [item.template_url]
    : item.image_url 
    ? [item.image_url]
    : item.chart_url 
    ? [item.chart_url]
    : item.card_url 
    ? [item.card_url]
    : [];

  const hasMedia = mediaItems.length > 0;
  const isVideo = (url: string) => /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);

  const scoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-slate-500';
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  const projectPlatforms = item.projects?.platforms || [];
  const allPlatforms = [...new Set([...item.platforms, ...projectPlatforms])];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  return (
    <div
      className={`bg-slate-900 border rounded-xl overflow-hidden transition-all hover:border-slate-700 ${
        selected ? 'border-violet-500/50 ring-2 ring-violet-500/20' : 'border-slate-800'
      }`}
    >
      {/* Header - Project + Checkbox */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSelect}
            className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              selected
                ? 'bg-violet-600 border-violet-600'
                : 'border-slate-600 hover:border-slate-400'
            }`}
          >
            {selected && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="text-sm font-medium text-violet-400">{item.projects?.name || 'Unknown'}</span>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-slate-500">{item.content_type}</span>
        </div>
        <div className={`text-lg font-bold ${scoreColor(item.ai_scores?.overall)}`}>
          {item.ai_scores?.overall ?? '?'}
        </div>
      </div>

      {/* Media Slider */}
      {hasMedia && (
        <div className="relative bg-slate-950 aspect-[4/3] overflow-hidden">
          {isVideo(mediaItems[currentSlide]) ? (
            <video
              src={mediaItems[currentSlide]}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={mediaItems[currentSlide]}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Slider controls */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {mediaItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentSlide ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Visual type badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {item.visual_type === 'matched_photo' && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/90 text-xs text-white font-medium">📷 library</span>
            )}
            {item.visual_type === 'generated_photo' && (
              <span className="px-1.5 py-0.5 rounded bg-violet-500/90 text-xs text-white font-medium">🎨 imagen</span>
            )}
            {item.template_url && (
              <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/90 text-xs text-white font-medium">🖼 template</span>
            )}
            {item.chart_url && (
              <span className="px-1.5 py-0.5 rounded bg-blue-500/90 text-xs text-white font-medium">📊 graf</span>
            )}
            {item.card_url && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/90 text-xs text-white font-medium">🃏 karta</span>
            )}
          </div>

          {/* Media count */}
          {mediaItems.length > 1 && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-white font-medium">
              {currentSlide + 1}/{mediaItems.length}
            </div>
          )}
        </div>
      )}

      {/* Text Content */}
      <div className="p-3">
        <p className="text-sm text-slate-200 whitespace-pre-wrap line-clamp-6">
          {item.text_content}
        </p>
      </div>

      {/* Platform Badges */}
      <div className="px-3 pb-3 flex flex-wrap gap-1">
        {allPlatforms.map(p => {
          const isActive = platformOverrides.includes(p);
          return (
            <button
              key={p}
              onClick={() => onPlatformToggle(p, isActive)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? `${PLATFORM_BADGE_COLORS[p] || 'bg-slate-600'} text-white`
                  : 'bg-slate-800/50 text-slate-600 line-through'
              }`}
              title={isActive ? `${PLATFORM_LABELS[p] || p} — klikni pro vypnutí` : `${PLATFORM_LABELS[p] || p} — klikni pro zapnutí`}
            >
              {PLATFORM_LABELS[p] || p}
            </button>
          );
        })}
        {item.engagement_score != null && item.engagement_score > 0 && (
          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/20 text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3" /> {item.engagement_score}
          </span>
        )}
        {item.source === 'ab_variant' && (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-xs text-amber-400 font-medium">A/B</span>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 pt-0 flex gap-2">
        {statusFilter === 'review' && (
          <>
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors text-sm font-medium"
              title="Upravit text"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onMediaPicker}
              className="flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors"
              title="Změnit fotky"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onApprove}
              className="flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
              title="Schválit"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onReject}
              className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
              title="Smazat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        {statusFilter === 'approved' && (
          <button
            onClick={onPublish}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            Publikovat
          </button>
        )}
      </div>
    </div>
  );
}
