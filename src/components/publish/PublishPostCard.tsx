'use client';

import { useState } from 'react';
import { CheckCircle, Pencil, Trash2, Eye, Save, X, Loader2, ChevronLeft, ChevronRight, Clock, Send as SendIcon } from 'lucide-react';

interface QueueItem {
  id: string;
  project_id: string;
  text_content: string;
  platforms: string[];
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  late_post_id: string | null;
  created_at: string;
  image_url: string | null;
  chart_url: string | null;
  card_url: string | null;
  template_url?: string | null;
  media_urls?: string[] | null;
  projects?: { name: string; slug: string };
}

interface PublishPostCardProps {
  item: QueueItem;
  selected?: boolean;
  onToggle?: () => void;
  selectable?: boolean;
  editable?: boolean;
  isEditing?: boolean;
  editText?: string;
  saving?: boolean;
  isDeleting?: boolean;
  onEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onEditTextChange?: (text: string) => void;
  onDelete?: () => void;
  onPreview?: (item: QueueItem) => void;
  onSchedule?: (id: string, scheduledFor?: string) => Promise<void>;
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn',
  x: 'X', tiktok: 'TikTok', youtube: 'YouTube',
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

export function PublishPostCard({
  item,
  selected,
  onToggle,
  selectable,
  editable,
  isEditing,
  editText,
  saving,
  isDeleting,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onDelete,
  onPreview,
  onSchedule,
}: PublishPostCardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scheduleDate, setScheduleDate] = useState('');
  const [sending, setSending] = useState(false);
  
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  return (
    <div
      className={`bg-slate-900 border rounded-xl overflow-hidden transition-all hover:border-slate-700 ${
        selected ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : isEditing ? 'border-violet-500/50' : 'border-slate-800'
      }`}
    >
      {/* Header - Project + Checkbox + Status */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {selectable && onToggle && (
            <button
              onClick={onToggle}
              className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                selected
                  ? 'bg-emerald-600 border-emerald-600'
                  : 'border-slate-600 hover:border-slate-400'
              }`}
            >
              {selected && <CheckCircle className="w-3 h-3 text-white" />}
            </button>
          )}
          <span className="text-sm font-medium text-violet-400">{item.projects?.name || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.scheduled_for && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <Clock className="w-3 h-3" />
              {new Date(item.scheduled_for).toLocaleString('cs-CZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          {item.sent_at && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <SendIcon className="w-3 h-3" />
              {new Date(item.sent_at).toLocaleString('cs-CZ', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {/* Media Slider */}
      {hasMedia && !isEditing && (
        <div className="relative bg-slate-950 aspect-[4/3] overflow-hidden flex items-center justify-center">
          {isVideo(mediaItems[currentSlide]) ? (
            <video
              src={mediaItems[currentSlide]}
              className="w-full h-full object-contain"
              controls
              playsInline
            />
          ) : (
            <img
              src={mediaItems[currentSlide]}
              alt=""
              className="w-full h-full object-contain"
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
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => onEditTextChange?.(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-violet-500/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={onSaveEdit}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Uložit
              </button>
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600 transition-colors"
              >
                <X className="w-3 h-3" />
                Zrušit
              </button>
              <span className="text-xs text-slate-500 ml-auto">{editText?.length || 0} znaků</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-200 whitespace-pre-wrap line-clamp-6">
            {item.text_content}
          </p>
        )}
      </div>

      {/* Platform Badges */}
      {!isEditing && (
        <div className="px-3 pb-3 flex flex-wrap gap-1">
          {item.platforms.map(p => (
            <span
              key={p}
              className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_BADGE_COLORS[p] || 'bg-slate-600'} text-white`}
            >
              {PLATFORM_LABELS[p] || p}
            </span>
          ))}
        </div>
      )}

      {/* Per-post scheduling */}
      {!isEditing && onSchedule && item.status === 'approved' && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-0"
            />
            <button
              onClick={async () => {
                setSending(true);
                await onSchedule(item.id, scheduleDate ? new Date(scheduleDate).toISOString() : undefined);
                setSending(false);
                setScheduleDate('');
              }}
              disabled={sending}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                scheduleDate
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              } disabled:opacity-50`}
            >
              {sending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : scheduleDate ? (
                <><Clock className="w-3 h-3" /> Naplánovat</>
              ) : (
                <><SendIcon className="w-3 h-3" /> Odeslat</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="p-3 pt-0 flex gap-2">
          <button
            onClick={() => onPreview?.(item)}
            className="flex items-center justify-center px-3 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
            title="Náhled"
          >
            <Eye className="w-4 h-4" />
          </button>
          {editable && (
            <>
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors text-sm font-medium"
                title="Upravit"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50"
                title="Smazat"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
