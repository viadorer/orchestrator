'use client';

/**
 * Photos gallery — library-wide grid of every photo asset.
 *
 * Filters at the top (real / AI / all, by project, by tag) update the GET
 * /api/media query params. The grid is virtualisation-free for now: we cap
 * limit at 200 and render a CSS grid of <img> thumbnails.
 *
 * Click a thumbnail → modal preview with full metadata (tags, AI description,
 * project, source, dimensions). No editing here — this is a browser/QA tool.
 */

import { useEffect, useMemo, useState } from 'react';
import { Camera, Sparkles, Filter, X, ExternalLink, Search, Loader2 } from 'lucide-react';

interface MediaAsset {
  id: string;
  project_id: string | null;
  storage_path: string;
  public_url: string;
  file_name: string;
  file_type: string;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  ai_description: string | null;
  ai_tags: string[] | null;
  ai_mood: string | null;
  ai_scene: string | null;
  ai_quality_score: number | null;
  manual_tags: string[] | null;
  is_shared: boolean | null;
  is_processed: boolean | null;
  source: string | null;
  times_used: number | null;
  last_used_at: string | null;
  created_at: string;
  projects: { name: string; slug: string } | null;
}

type SourceFilter = 'all' | 'upload' | 'imagen_generated';

const SOURCE_LABELS: Record<SourceFilter, string> = {
  all: 'Vše',
  upload: 'Reálné fotky',
  imagen_generated: 'AI generované',
};

export function PhotosGalleryView() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('upload');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MediaAsset | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({
        all: 'true',
        file_type: 'image',
        limit: '200',
      });
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      try {
        const res = await fetch(`/api/media?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setAssets(data.assets || []);
      } catch {
        if (!cancelled) setAssets([]);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [sourceFilter]);

  // Client-side text search across filename + AI description + tags. Cheap on
  // a list capped at 200 items, no need for an API roundtrip per keystroke.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => {
      const haystack = [
        a.file_name,
        a.ai_description || '',
        a.projects?.name || '',
        ...(a.ai_tags || []),
        ...(a.manual_tags || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [assets, search]);

  // Quick stats for the header — total + how many real vs AI in current view.
  const realCount = useMemo(() => assets.filter((a) => a.source === 'upload').length, [assets]);
  const aiCount = useMemo(() => assets.filter((a) => a.source === 'imagen_generated').length, [assets]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-violet-400" />
            Knihovna fotek
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Všechny fotky napříč projekty.{' '}
            <span className="text-violet-300">{realCount} reálných</span>
            {' • '}
            <span className="text-amber-300">{aiCount} AI</span>
            {' • celkem '}{assets.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {(Object.keys(SOURCE_LABELS) as SourceFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSourceFilter(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sourceFilter === key
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {key === 'upload' && <Camera className="w-3.5 h-3.5 inline mr-1" />}
              {key === 'imagen_generated' && <Sparkles className="w-3.5 h-3.5 inline mr-1" />}
              {SOURCE_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat podle tagů, popisu, projektu…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
          <Filter className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm text-slate-400">Žádné fotky pro vybrané filtry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {visible.map((a) => (
            <PhotoTile key={a.id} asset={a} onClick={() => setSelected(a)} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && <PhotoDetailModal asset={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tile ─────────────────────────────────────────────────────

function PhotoTile({ asset, onClick }: { asset: MediaAsset; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);

  // Source badge — green for real, amber for AI.
  const sourceColor = asset.source === 'upload'
    ? 'bg-emerald-500/80'
    : asset.source === 'imagen_generated'
      ? 'bg-amber-500/80'
      : 'bg-slate-600/80';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition-colors text-left"
    >
      {imgError || !asset.public_url ? (
        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs p-2 text-center">
          {asset.file_name}
        </div>
      ) : (
        // Native <img> on purpose — Next/Image would need every R2 host whitelisted
        // in next.config and we want this view to "just work" for any uploaded asset.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.public_url}
          alt={asset.ai_description || asset.file_name}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      )}

      {/* Source badge — top-left */}
      <div className={`absolute top-1.5 left-1.5 ${sourceColor} backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-medium text-white`}>
        {asset.source === 'upload' ? 'real' : asset.source === 'imagen_generated' ? 'AI' : '?'}
      </div>

      {/* Used badge — top-right */}
      {(asset.times_used ?? 0) > 0 && (
        <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] text-white">
          {asset.times_used}×
        </div>
      )}

      {/* Hover meta strip */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[10px] text-white/90 truncate">
          {asset.projects?.name || (asset.is_shared ? 'Sdílená knihovna' : '—')}
        </div>
        {asset.ai_tags && asset.ai_tags.length > 0 && (
          <div className="text-[10px] text-white/60 truncate">
            {asset.ai_tags.slice(0, 3).join(' · ')}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Detail modal ────────────────────────────────────────────

function PhotoDetailModal({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white truncate">{asset.file_name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {asset.projects?.name || (asset.is_shared ? 'Sdílená knihovna' : 'Bez projektu')}
              {asset.width && asset.height && (
                <> • {asset.width}×{asset.height}</>
              )}
              {asset.file_size && (
                <> • {formatFileSize(asset.file_size)}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={asset.public_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Otevřít v novém okně"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Zavřít"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body — image + meta sidebar */}
        <div className="flex-1 overflow-auto grid md:grid-cols-[1fr_240px] gap-0">
          <div className="bg-black flex items-center justify-center min-h-[300px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.public_url}
              alt={asset.ai_description || asset.file_name}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
          <div className="p-4 space-y-3 text-sm border-t md:border-t-0 md:border-l border-slate-800">
            <DetailRow label="Zdroj" value={asset.source === 'upload' ? 'Reálná fotka' : asset.source === 'imagen_generated' ? 'AI (Imagen)' : '—'} />
            <DetailRow label="Sdílená" value={asset.is_shared ? 'Ano' : 'Ne'} />
            <DetailRow label="Použito" value={(asset.times_used ?? 0).toString() + '×'} />
            {asset.ai_quality_score && (
              <DetailRow label="Kvalita" value={`${asset.ai_quality_score.toFixed(1)} / 10`} />
            )}
            {asset.ai_mood && <DetailRow label="Mood" value={asset.ai_mood} />}
            {asset.ai_scene && <DetailRow label="Scéna" value={asset.ai_scene} />}
            <DetailRow label="Vytvořeno" value={formatDate(asset.created_at)} />
            {asset.ai_description && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Popis</div>
                <p className="text-xs text-slate-300 leading-relaxed">{asset.ai_description}</p>
              </div>
            )}
            {asset.ai_tags && asset.ai_tags.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Tagy AI</div>
                <div className="flex flex-wrap gap-1">
                  {asset.ai_tags.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {asset.manual_tags && asset.manual_tags.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Vlastní tagy</div>
                <div className="flex flex-wrap gap-1">
                  {asset.manual_tags.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 font-medium truncate">{value}</span>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}
