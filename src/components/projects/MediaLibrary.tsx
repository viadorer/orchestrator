'use client';

import { useEffect, useState, useCallback } from 'react';
import { Upload, Image, Film, FileText, RefreshCw, Trash2, Eye, Sparkles, X } from 'lucide-react';

interface MediaAsset {
  id: string;
  project_id: string | null;
  storage_path: string;
  public_url: string;
  file_name: string;
  file_type: string;
  mime_type: string | null;
  file_size: number | null;
  ai_description: string | null;
  ai_tags: string[] | null;
  ai_mood: string | null;
  ai_scene: string | null;
  ai_quality_score: number | null;
  times_used: number;
  is_processed: boolean;
  processing_error: string | null;
  created_at: string;
  last_used_in: string | null;
  last_used_at: string | null;
  source: string | null;
  is_shared: boolean;
}

interface MediaLibraryProps {
  projectId: string;
  projectName: string;
}

export function MediaLibrary({ projectId, projectName }: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'unprocessed'>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [libraryTab, setLibraryTab] = useState<'project' | 'shared'>('project');

  const loadAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '200' });

    if (libraryTab === 'shared') {
      params.set('shared', 'true');
    } else {
      params.set('project_id', projectId);
    }

    if (filter === 'unprocessed') params.set('processed', 'false');
    else if (filter !== 'all') params.set('file_type', filter);

    const res = await fetch(`/api/media?${params}`);
    const data = await res.json();
    setAssets(data.assets || []);
    setLoading(false);
  }, [projectId, filter, libraryTab]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  // ---- Drag & Drop + File Input Upload ----
  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: fileArray.length });

    // Upload one file at a time for maximum reliability
    for (let i = 0; i < fileArray.length; i++) {
      const formData = new FormData();
      if (libraryTab === 'shared') {
        formData.append('is_shared', 'true');
      } else {
        formData.append('project_id', projectId);
      }
      formData.append('files', fileArray[i]);

      try {
        await fetch('/api/media/upload', { method: 'POST', body: formData });
      } catch (err) {
        console.error(`Upload failed for ${fileArray[i].name}:`, err);
      }
      setUploadProgress({ done: i + 1, total: fileArray.length });
    }

    setUploading(false);
    setUploadProgress({ done: 0, total: 0 });
    loadAssets();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const processAsset = async (id: string) => {
    setProcessing(id);
    await fetch(`/api/media/${id}?action=process`, { method: 'POST' });
    setProcessing(null);
    loadAssets();
  };

  const processAll = async () => {
    const unprocessed = assets.filter(a => !a.is_processed);
    if (unprocessed.length === 0) return;
    setProcessing('batch');
    for (const asset of unprocessed.slice(0, 20)) {
      await fetch(`/api/media/${asset.id}?action=process`, { method: 'POST' });
    }
    setProcessing(null);
    loadAssets();
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Smazat toto médium?')) return;
    await fetch(`/api/media/${id}`, { method: 'DELETE' });
    setSelected(null);
    loadAssets();
  };

  // Collect all unique tags for tag cloud
  const allTags = Array.from(new Set(assets.flatMap(a => a.ai_tags || []))).sort();

  // Apply tag filter to assets
  const filteredAssets = tagFilter
    ? assets.filter(a => a.ai_tags?.includes(tagFilter))
    : assets;

  const stats = {
    total: assets.length,
    processed: assets.filter(a => a.is_processed).length,
    unprocessed: assets.filter(a => !a.is_processed).length,
    images: assets.filter(a => a.file_type === 'image').length,
    videos: assets.filter(a => a.file_type === 'video').length,
    filtered: filteredAssets.length,
  };

  const typeIcon = (type: string) => {
    if (type === 'video') return <Film className="w-3 h-3" />;
    if (type === 'document') return <FileText className="w-3 h-3" />;
    return <Image className="w-3 h-3" />;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Library Tabs: Project / Shared */}
      <div className="flex gap-1 p-1 bg-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setLibraryTab('project')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            libraryTab === 'project' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          📁 Projekt
        </button>
        <button
          onClick={() => setLibraryTab('shared')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            libraryTab === 'shared' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          🌐 Sdílená knihovna
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {libraryTab === 'shared' ? '🌐 Sdílená knihovna' : 'Media Library'}
          </h3>
          <p className="text-xs text-slate-400">
            {libraryTab === 'shared'
              ? `Reálné fotky dostupné všem projektům · ${stats.total} médií · ${stats.processed} otagováno`
              : `${projectName} · ${stats.total} médií · ${stats.processed} otagováno`
            }
          </p>
        </div>
        <div className="flex gap-2">
          {stats.unprocessed > 0 && (
            <button
              onClick={processAll}
              disabled={processing === 'batch'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {processing === 'batch' ? 'Zpracovávám...' : `AI Tag (${stats.unprocessed})`}
            </button>
          )}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Nahrát soubory
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Drag & Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl border-2 border-dashed transition-all ${
          dragOver
            ? 'border-violet-500 bg-violet-500/10'
            : uploading
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-700 hover:border-slate-600'
        } ${assets.length === 0 && !uploading ? 'py-16' : 'py-4'}`}
      >
        {uploading ? (
          <div className="text-center px-4">
            <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto mb-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-emerald-400">
              Nahrávám {uploadProgress.done}/{uploadProgress.total} souborů...
            </p>
          </div>
        ) : dragOver ? (
          <div className="text-center">
            <Upload className="w-8 h-8 text-violet-400 mx-auto mb-2" />
            <p className="text-sm text-violet-300 font-medium">Pusťte soubory sem</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center">
            <Image className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-medium">Přetáhněte fotky a videa sem</p>
            <p className="text-slate-600 text-xs mt-1">nebo klikněte na "Nahrát soubory" · JPG, PNG, MP4, PDF</p>
          </div>
        ) : null}
      </div>

      {/* Stats bar */}
      {assets.length > 0 && (
        <div className="flex gap-3 text-xs">
          {(['all', 'image', 'video', 'unprocessed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === f ? 'bg-violet-600/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' && `Vše (${stats.total})`}
              {f === 'image' && `Fotky (${stats.images})`}
              {f === 'video' && `Videa (${stats.videos})`}
              {f === 'unprocessed' && `Neotagované (${stats.unprocessed})`}
            </button>
          ))}
        </div>
      )}

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tagFilter && (
            <button
              onClick={() => setTagFilter('')}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30"
            >
              <X className="w-3 h-3 inline mr-0.5" />Zrušit filtr
            </button>
          )}
          {allTags.slice(0, 20).map(tag => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                tagFilter === tag
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
          {allTags.length > 20 && (
            <span className="text-[10px] text-slate-600 self-center">+{allTags.length - 20} tagů</span>
          )}
          {tagFilter && (
            <span className="text-[10px] text-slate-500 self-center ml-2">
              {stats.filtered} / {stats.total} médií
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Načítám...</div>
      ) : filteredAssets.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {filteredAssets.map(asset => (
            <button
              key={asset.id}
              onClick={() => setSelected(asset)}
              className={`group relative aspect-square rounded-lg overflow-hidden border transition-all ${
                selected?.id === asset.id
                  ? 'border-violet-500 ring-2 ring-violet-500/30'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              {asset.file_type === 'image' ? (
                <img src={asset.public_url} alt={asset.ai_description || ''} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  {typeIcon(asset.file_type)}
                </div>
              )}

              {/* Overlay badges */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] text-white/80 truncate">{asset.file_name}</span>
                {asset.times_used > 0 && (
                  <span className="text-[9px] bg-violet-600 text-white px-1 rounded">{asset.times_used}×</span>
                )}
              </div>

              {/* Source badge */}
              {asset.source === 'imagen_generated' && (
                <div className="absolute top-1 left-1">
                  <span className="text-[8px] bg-violet-600 text-white px-1 rounded" title="AI generováno">AI</span>
                </div>
              )}

              {/* Processing status */}
              {!asset.is_processed && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" title="Neotagováno" />
                </div>
              )}
              {asset.is_processed && asset.ai_quality_score && asset.ai_quality_score >= 8 && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" title={`Kvalita: ${asset.ai_quality_score}`} />
                </div>
              )}
              {processing === asset.id && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h4 className="text-sm font-semibold text-white truncate">{selected.file_name}</h4>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4">
              {/* Preview */}
              <div>
                {selected.file_type === 'image' ? (
                  <img src={selected.public_url} alt="" className="w-full rounded-lg" />
                ) : (
                  <div className="w-full aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                    {typeIcon(selected.file_type)}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3 text-xs">
                {selected.is_processed ? (
                  <>
                    <div>
                      <span className="text-slate-500">Popis:</span>
                      <p className="text-slate-200 mt-0.5">{selected.ai_description || '–'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Tagy:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selected.ai_tags || []).map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div><span className="text-slate-500">Nálada:</span> <span className="text-slate-200">{selected.ai_mood || '–'}</span></div>
                      <div><span className="text-slate-500">Scéna:</span> <span className="text-slate-200">{selected.ai_scene || '–'}</span></div>
                    </div>
                    <div className="flex gap-4">
                      <div><span className="text-slate-500">Kvalita:</span> <span className="text-slate-200">{selected.ai_quality_score?.toFixed(1) || '–'}/10</span></div>
                      <div><span className="text-slate-500">Použito:</span> <span className="text-slate-200">{selected.times_used}×</span></div>
                    </div>
                    {selected.source && (
                      <div>
                        <span className="text-slate-500">Zdroj:</span>{' '}
                        <span className={`${selected.source === 'imagen_generated' ? 'text-violet-400' : 'text-slate-200'}`}>
                          {selected.source === 'imagen_generated' ? '🎨 Imagen 4' : selected.source === 'upload' ? '📤 Upload' : selected.source}
                        </span>
                      </div>
                    )}
                    {selected.times_used > 0 && selected.last_used_at && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-emerald-400 text-[10px] font-medium">Použito v příspěvku</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(selected.last_used_at).toLocaleDateString('cs-CZ')} · ID: {selected.last_used_in?.slice(0, 8)}...
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                    <p className="text-slate-400">Neotagováno</p>
                    <button
                      onClick={() => processAsset(selected.id)}
                      disabled={processing === selected.id}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-50"
                    >
                      {processing === selected.id ? 'Zpracovávám...' : 'Spustit AI analýzu'}
                    </button>
                  </div>
                )}

                {selected.processing_error && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-300">
                    {selected.processing_error}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between p-4 border-t border-slate-800">
              <button
                onClick={() => processAsset(selected.id)}
                disabled={processing === selected.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${processing === selected.id ? 'animate-spin' : ''}`} />
                {selected.is_processed ? 'Re-analyzovat' : 'AI Tag'}
              </button>
              <div className="flex gap-2">
                <a
                  href={selected.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" /> Otevřít
                </a>
                <button
                  onClick={() => deleteAsset(selected.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 text-xs hover:bg-red-600/30"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Smazat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
