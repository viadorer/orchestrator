'use client';

/**
 * Mobile photo upload — single-page app for iPhone home-screen use.
 *
 * Flow:
 *   1. User taps "Vyfotit" → iOS opens camera. Or "Z galerie" → photo library.
 *   2. Selected file(s) are uploaded to /api/media/upload with is_shared=true,
 *      so they land in the cross-project shared library on R2.
 *   3. Backend kicks off Gemini Vision tagging async (processMediaAsset).
 *   4. Page polls /api/media/[id] every 4s until is_processed=true,
 *      then renders the auto-detected description + tags.
 */

import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

type UploadStatus = 'queued' | 'uploading' | 'tagging' | 'tagged' | 'failed';

interface UploadEntry {
  /** Local key for React reconciliation; uses crypto.randomUUID */
  key: string;
  /** Original file name */
  name: string;
  /** Local objectURL preview rendered immediately */
  previewUrl: string;
  /** Bytes */
  size: number;
  status: UploadStatus;
  errorMessage?: string;
  /** Asset row id once uploaded */
  assetId?: string;
  /** Public R2 / Supabase URL */
  publicUrl?: string;
  /** AI-generated description (cs) */
  aiDescription?: string;
  /** AI-generated tags */
  aiTags?: string[];
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB — matches /api/media/upload
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 60_000;

export default function MobileUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Auth guard — bounce to /login if not authenticated.
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    // Reject oversized up-front so the user gets immediate feedback.
    const newEntries: UploadEntry[] = files.map((file) => ({
      key: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      status: file.size > MAX_FILE_SIZE ? 'failed' : 'uploading',
      errorMessage: file.size > MAX_FILE_SIZE ? `Soubor je větší než ${MAX_FILE_SIZE / 1024 / 1024} MB.` : undefined,
    }));

    setEntries((prev) => [...newEntries, ...prev]);

    // Upload one-by-one so a 4G connection doesn't choke; preserves order.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const entry = newEntries[i];
      if (entry.status === 'failed') continue;
      await uploadOne(entry.key, file);
    }
  };

  const uploadOne = async (key: string, file: File) => {
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
            <h1 className="text-base font-semibold truncate">Nahrát fotku</h1>
            <p className="text-xs text-slate-500 truncate">Sdílená knihovna · automatické otagování</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-5 max-w-md w-full mx-auto">
        {/* Primary action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium shadow-lg shadow-violet-600/20 transition-colors"
          >
            <Camera className="w-7 h-7" />
            <span className="text-sm">Vyfotit</span>
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-medium border border-slate-700 transition-colors"
          >
            <ImageIcon className="w-7 h-7" />
            <span className="text-sm">Z galerie</span>
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
        />

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center">
            <Sparkles className="w-6 h-6 mx-auto text-violet-400 mb-2" />
            <p className="text-sm text-slate-400">
              Po nahrání fotky proběhne automatické otagování přes AI vision.
              Fotka bude dostupná všem projektům.
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

  return (
    <li className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="flex">
        <div className="w-24 h-24 flex-shrink-0 bg-slate-950 relative">
          {/* Local preview is fine even if upload still in flight. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={entry.previewUrl} alt="" className="w-full h-full object-cover" />
          {(entry.status === 'uploading' || entry.status === 'tagging') && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
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

          {entry.status === 'failed' && entry.errorMessage && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              <span>{entry.errorMessage}</span>
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
            <p className="mt-2 text-xs text-slate-500">AI právě analyzuje fotku…</p>
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

