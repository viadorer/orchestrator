'use client';

/**
 * Mobile photo + video upload — single-page app for iPhone home-screen use.
 *
 * Flow:
 *   1. User taps "Vyfotit", "Natočit video", or "Z galerie".
 *   2a. Files ≤ 8 MB → /api/media/upload (server upload — fast, simple)
 *   2b. Files > 8 MB → /api/media/presign + direct PUT to R2 (bypasses server)
 *      → POST /api/media/presign with metadata
 *      → PUT file directly to R2 using returned presigned URL
 *      → PATCH /api/media/presign to confirm + trigger AI analysis
 *   3. Backend kicks off Gemini Vision tagging async.
 *   4. Page polls /api/media/[id] every 4s until is_processed=true.
 *
 * Supports iPhone formats: HEIC/HEIF photos, MOV videos.
 */

import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Video,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Film,
} from 'lucide-react';
import { resizeImageForUpload, isClientResizable } from '@/lib/media/client-resize';

type UploadStatus = 'queued' | 'uploading' | 'tagging' | 'tagged' | 'failed';

interface UploadEntry {
  /** Local key for React reconciliation; uses crypto.randomUUID */
  key: string;
  /** Original file name */
  name: string;
  /** image | video — drives preview rendering */
  kind: 'image' | 'video';
  /** Local objectURL preview rendered immediately */
  previewUrl: string;
  /** Bytes */
  size: number;
  status: UploadStatus;
  /** 0–100 upload progress for direct R2 uploads (presigned flow) */
  progress?: number;
  errorMessage?: string;
  /** Soft warning shown alongside other states (oversize video, long duration, etc.) */
  warningMessage?: string;
  /** Asset row id once uploaded */
  assetId?: string;
  /** Public R2 / Supabase URL */
  publicUrl?: string;
  /** AI-generated description (cs) */
  aiDescription?: string;
  /** AI-generated tags */
  aiTags?: string[];
}

/** Max single file size — matches /api/media/presign (500 MB for videos). */
const MAX_FILE_SIZE = 500 * 1024 * 1024;
/** Threshold above which we use direct R2 presigned upload (bypass server body limit). */
const DIRECT_UPLOAD_THRESHOLD = 8 * 1024 * 1024; // 8 MB
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 120_000; // longer for videos — vision analysis takes longer

/** Soft warning thresholds for videos (we still allow them — just inform the user). */
const VIDEO_RECOMMENDED_MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const VIDEO_RECOMMENDED_MAX_SECONDS = 180; // 3 minutes — covers IG Reels (90s) + TikTok (10m) safely

/** Probe a video file for duration (returns NaN if unreadable). */
async function probeVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      const d = v.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? d : NaN);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(NaN);
    };
    v.src = url;
  });
}

function detectKind(file: File): 'image' | 'video' {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  // Fallback for iOS browsers that send application/octet-stream for HEIC/MOV
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (['mov', 'mp4', 'webm', 'avi', 'mkv', 'm4v'].includes(ext)) return 'video';
  return 'image';
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function MobileUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Auth guard — bounce to /login if not authenticated.
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    // Render placeholder cards immediately so the user sees feedback.
    const newEntries: UploadEntry[] = files.map((file) => ({
      key: crypto.randomUUID(),
      name: file.name,
      kind: detectKind(file),
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      status: file.size > MAX_FILE_SIZE ? 'failed' : 'uploading',
      errorMessage: file.size > MAX_FILE_SIZE
        ? `Soubor je větší než ${MAX_FILE_SIZE / 1024 / 1024} MB.`
        : undefined,
    }));

    setEntries((prev) => [...newEntries, ...prev]);

    // Upload sequentially so a 4G connection doesn't choke; preserves order.
    for (let i = 0; i < files.length; i++) {
      const original = files[i];
      const entry = newEntries[i];
      if (entry.status === 'failed') continue;

      // Step 1 — preprocess on the client when possible (cheap, fast, saves bandwidth).
      let prepared = original;

      if (entry.kind === 'image' && isClientResizable(original)) {
        // Resize to ≤ 2160 px and re-encode as JPEG q=85.
        // HEIC + GIF + SVG fall through to server-side normalization.
        try {
          prepared = await resizeImageForUpload(original);
          if (prepared !== original) {
            // Update card with new size + preview.
            updateEntry(entry.key, {
              name: prepared.name,
              size: prepared.size,
              previewUrl: URL.createObjectURL(prepared),
            });
          }
        } catch {
          // If anything goes wrong, fall back to the original — never block the upload.
          prepared = original;
        }
      } else if (entry.kind === 'video') {
        // Soft validation: warn the user about size + duration but still upload.
        const duration = await probeVideoDuration(original);
        const warnings: string[] = [];
        if (original.size > VIDEO_RECOMMENDED_MAX_BYTES) {
          warnings.push(`${(original.size / 1024 / 1024).toFixed(0)} MB (doporučeno ≤ ${VIDEO_RECOMMENDED_MAX_BYTES / 1024 / 1024} MB)`);
        }
        if (Number.isFinite(duration) && duration > VIDEO_RECOMMENDED_MAX_SECONDS) {
          warnings.push(`${Math.round(duration)} s (doporučeno ≤ ${VIDEO_RECOMMENDED_MAX_SECONDS} s)`);
        }
        if (warnings.length > 0) {
          updateEntry(entry.key, {
            warningMessage: `Velké video — ${warnings.join(', ')}. Nahraje se, ale nemusí projít na všechny sítě.`,
          });
        }
      }

      // Step 2 — route based on the prepared file size:
      // ≤ 8 MB → server (single round-trip); > 8 MB → direct R2 PUT (bypasses Vercel limit).
      if (prepared.size > DIRECT_UPLOAD_THRESHOLD) {
        await uploadDirectToR2(entry.key, prepared);
      } else {
        await uploadViaServer(entry.key, prepared);
      }
    }
  };

  /** Server-mediated upload — small files (≤ 8 MB). Triggers AI analysis automatically. */
  const uploadViaServer = async (key: string, file: File) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('is_shared', 'true');
    formData.append('auto_analyze', 'true');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        updateEntry(key, { status: 'failed', errorMessage: err?.error || `HTTP ${res.status}` });
        return;
      }
      const data = await res.json() as {
        results?: Array<{ success: boolean; asset_id?: string; public_url?: string; error?: string }>;
      };
      const result = data.results?.[0];
      if (!result || !result.success || !result.asset_id) {
        updateEntry(key, { status: 'failed', errorMessage: result?.error || 'Server vrátil chybu.' });
        return;
      }
      updateEntry(key, {
        status: 'tagging',
        progress: 100,
        assetId: result.asset_id,
        publicUrl: result.public_url,
      });
      pollForTags(key, result.asset_id);
    } catch (err) {
      updateEntry(key, {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Síťová chyba.',
      });
    }
  };

  /** Direct-to-R2 upload — large files (videos). Uses presigned PUT URLs. */
  const uploadDirectToR2 = async (key: string, file: File) => {
    try {
      // Step 1 — request a presigned URL + create the media_assets row.
      const presignRes = await fetch('/api/media/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shared: true,
          files: [{ name: file.name, type: file.type || 'application/octet-stream', size: file.size }],
        }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({ error: `HTTP ${presignRes.status}` }));
        updateEntry(key, { status: 'failed', errorMessage: err?.error || `Presign HTTP ${presignRes.status}` });
        return;
      }
      const presignData = await presignRes.json() as {
        files: Array<{ asset_id: string; upload_url: string; public_url: string }>;
      };
      const target = presignData.files?.[0];
      if (!target?.upload_url || !target.asset_id) {
        updateEntry(key, { status: 'failed', errorMessage: 'Presign nevrátil upload URL.' });
        return;
      }

      // Step 2 — PUT directly to R2 with progress tracking via XHR (fetch lacks upload progress).
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', target.upload_url);
        if (file.type) xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            updateEntry(key, { progress: pct });
          }
        });
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`R2 PUT failed: HTTP ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('R2 PUT network error'));
        xhr.send(file);
      });

      // Step 3 — confirm upload, trigger Gemini Vision analysis.
      updateEntry(key, {
        status: 'tagging',
        progress: 100,
        assetId: target.asset_id,
        publicUrl: target.public_url,
      });
      await fetch('/api/media/presign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_ids: [target.asset_id] }),
      }).catch(() => { /* not fatal — cron picks up unprocessed assets */ });

      pollForTags(key, target.asset_id);
    } catch (err) {
      updateEntry(key, {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Chyba při přímém uploadu.',
      });
    }
  };

  const updateEntry = (key: string, patch: Partial<UploadEntry>) => {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  };

  const pollForTags = async (key: string, assetId: string) => {
    const start = Date.now();
    while (Date.now() - start < POLL_TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      try {
        const res = await fetch(`/api/media/${assetId}`);
        if (!res.ok) continue;
        const data = await res.json() as {
          asset?: {
            is_processed?: boolean;
            ai_description?: string | null;
            ai_tags?: string[] | null;
          };
        };
        if (data.asset?.is_processed) {
          updateEntry(key, {
            status: 'tagged',
            aiDescription: data.asset.ai_description ?? undefined,
            aiTags: data.asset.ai_tags ?? [],
          });
          return;
        }
      } catch {
        // Transient network error, keep polling.
      }
    }
    // Timeout — leave in tagging state so user sees we tried; re-poll
    // happens implicitly if they reload.
    updateEntry(key, { status: 'tagging' });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="p-2 -ml-2 rounded-lg text-slate-300 hover:bg-slate-800"
            aria-label="Zpět do administrace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold truncate">Nahrát do knihovny</h1>
            <p className="text-xs text-slate-500 truncate">Fotky i videa · sdílená knihovna · AI tagování</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-5 max-w-md w-full mx-auto">
        {/* Primary action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 py-5 rounded-2xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium shadow-lg shadow-violet-600/20 transition-colors"
          >
            <Camera className="w-6 h-6" />
            <span className="text-xs">Vyfotit</span>
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-medium shadow-lg shadow-rose-600/20 transition-colors"
          >
            <Video className="w-6 h-6" />
            <span className="text-xs">Natočit</span>
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-medium border border-slate-700 transition-colors"
          >
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Galerie</span>
          </button>
        </div>

        {/* iOS recognises capture="environment" → opens rear camera in photo mode. */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
        />
        {/* iOS opens the camcorder when accept includes only video and capture is set. */}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
        />
        {/* Photo + video pickers from the iOS Photos app — multi-select OK. */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
        />

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center">
            <Sparkles className="w-6 h-6 mx-auto text-violet-400 mb-2" />
            <p className="text-sm text-slate-400">
              Fotky a videa jdou rovnou do sdílené knihovny. AI je automaticky
              otaguje a budou dostupné všem projektům.
            </p>
            <p className="text-[11px] text-slate-500 mt-3">
              Fotky se před uploadem zmenší na 2160 px (JPEG q85), HEIC převede
              server. Velká videa jdou přímo do R2.
            </p>
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Nahrané fotky">
            {entries.map((entry) => (
              <UploadCard key={entry.key} entry={entry} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function UploadCard({ entry }: { entry: UploadEntry }) {
  const statusBadge = STATUS_BADGE[entry.status];
  const progressPct = entry.progress ?? 0;
  const isVideo = entry.kind === 'video';

  return (
    <li className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="flex">
        <div className="w-24 h-24 flex-shrink-0 bg-slate-950 relative">
          {isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <Film className="w-7 h-7 text-slate-500" />
            </div>
          ) : (
            // Local preview is fine even if upload still in flight.
            // HEIC won't render natively in some browsers; fall back to icon.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.previewUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          {(entry.status === 'uploading' || entry.status === 'tagging') && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start gap-2">
            <p className="text-sm text-slate-300 truncate flex-1" title={entry.name}>
              {entry.name}
            </p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-0.5">
            {isVideo ? 'Video' : 'Fotka'} · {formatSize(entry.size)}
          </p>

          {entry.status === 'uploading' && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">{progressPct}% nahráno</p>
            </div>
          )}

          {entry.status === 'failed' && entry.errorMessage && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              <span>{entry.errorMessage}</span>
            </div>
          )}

          {entry.status !== 'failed' && entry.warningMessage && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              <span>{entry.warningMessage}</span>
            </div>
          )}

          {entry.status === 'tagged' && (
            <div className="mt-2 space-y-1.5">
              {entry.aiDescription && (
                <p className="text-xs text-slate-400 line-clamp-2">{entry.aiDescription}</p>
              )}
              {entry.aiTags && entry.aiTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.aiTags.slice(0, 6).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-300">
                      {tag}
                    </span>
                  ))}
                  {entry.aiTags.length > 6 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-500">
                      +{entry.aiTags.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {entry.status === 'tagging' && (
            <p className="mt-2 text-xs text-slate-500">
              {isVideo ? 'AI extrahuje metadata z videa…' : 'AI právě analyzuje fotku…'}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

const STATUS_BADGE: Record<UploadStatus, { label: string; cls: string }> = {
  queued:    { label: 'Ve frontě',  cls: 'bg-slate-800 text-slate-400' },
  uploading: { label: 'Nahrává se', cls: 'bg-blue-500/10 text-blue-300' },
  tagging:   { label: 'Tagování',   cls: 'bg-amber-500/10 text-amber-300' },
  tagged:    { label: 'Hotovo',     cls: 'bg-emerald-500/10 text-emerald-300' },
  failed:    { label: 'Chyba',      cls: 'bg-rose-500/10 text-rose-300' },
};

