'use client';

import { useEffect, useState, useCallback } from 'react';
import { Upload, Image, Film, FileText, RefreshCw, Trash2, Eye, Sparkles, X } from 'lucide-react';

interface MediaAsset {
  id: string;
  project_id: string;
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
}

interface MediaLibraryProps {
  projectId: string;
  projectName: string;
}

export function MediaLibrary({ projectId, projectName }: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'unprocessed'>('all');

  const loadAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ project_id: projectId, limit: '200' });
    if (filter === 'unprocessed') params.set('processed', 'false');
    else if (filter !== 'all') params.set('file_type', filter);

    const res = await fetch(`/api/media?${params}`);
    const data = await res.json();
    setAssets(data.assets || []);
    setLoading(false);
  }, [projectId, filter]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const handleUploadUrls = async () => {
    const input = prompt('Vložte URL obrázků (jeden na řádek):');
    if (!input) return;

    const urls = input.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) return;

    setUploading(true);
    let added = 0;
    for (const url of urls) {
      const fileName = url.split('/').pop() || 'image.jpg';
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          storage_path: `project-media/${projectId}/${fileName}`,
          public_url: url,
          file_name: fileName,
          file_type: 'image',
        }),
      });
      if (res.ok) added++;
    }
    setUploading(false);
    if (added > 0) loadAssets();
    alert(`Přidáno ${added} z ${urls.length} médií. Spusťte AI tagging pro analýzu.`);
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

  const stats = {
    total: assets.length,
    processed: assets.filter(a => a.is_processed).length,
    unprocessed: assets.filter(a => !a.is_processed).length,
    images: assets.filter(a => a.file_type === 'image').length,
    videos: assets.filter(a => a.file_type === 'video').length,
  };

  const typeIcon = (type: string) => {
    if (type === 'video') return <Film className="w-3 h-3" />;
    if (type === 'document') return <FileText className="w-3 h-3" />;
    return <Image className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Media Library</h3>
          <p className="text-xs text-slate-400">{projectName} · {stats.total} médií · {stats.processed} otagováno</p>
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
          <button
            onClick={handleUploadUrls}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Nahrávám...' : 'Přidat URL'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
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

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Načítám...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
          <Image className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Žádná média. Přidejte URL obrázků.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {assets.map(asset => (
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
