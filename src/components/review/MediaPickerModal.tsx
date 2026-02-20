'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check, Loader2, ImageIcon, Upload, Trash2, Sparkles } from 'lucide-react';

interface StorageAsset {
  id: string;
  file_name: string;
  file_type: string;
  public_url: string;
  ai_description?: string;
  ai_tags?: string[];
}

interface MediaPickerModalProps {
  projectId: string;
  currentImageUrl?: string | null;
  currentMediaUrls?: string[];
  onSave: (mediaUrls: string[]) => void;
  onClose: () => void;
}

export function MediaPickerModal({ projectId, currentImageUrl, currentMediaUrls, onSave, onClose }: MediaPickerModalProps) {
  const [selectedUrls, setSelectedUrls] = useState<string[]>(() => {
    if (currentMediaUrls && currentMediaUrls.length > 0) return [...currentMediaUrls];
    if (currentImageUrl) return [currentImageUrl];
    return [];
  });
  const [storageAssets, setStorageAssets] = useState<StorageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/media/project/${projectId}`)
      .then(r => r.json())
      .then(data => {
        setStorageAssets(data.assets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const toggleAsset = (url: string) => {
    setSelectedUrls(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      }
      return [...prev, url];
    });
  };

  const removeUrl = (index: number) => {
    setSelectedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('files', file);
      }
      formData.append('project_id', projectId);

      const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
      const data = await res.json();

      const newUrls: string[] = [];
      for (const result of data.results || []) {
        if (result.success && result.public_url) {
          newUrls.push(result.public_url);
        }
      }

      if (newUrls.length > 0) {
        setSelectedUrls(prev => [...prev, ...newUrls]);
        // Reload storage assets to include new uploads
        const assetsRes = await fetch(`/api/media/project/${projectId}`);
        const assetsData = await assetsRes.json();
        setStorageAssets(assetsData.assets || []);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const filteredAssets = storageAssets.filter(asset => {
    if (!tagFilter) return true;
    const q = tagFilter.toLowerCase();
    return asset.ai_tags?.some(tag => tag.toLowerCase().includes(q))
      || asset.ai_description?.toLowerCase().includes(q)
      || asset.file_name.toLowerCase().includes(q);
  });

  // Unique tags for quick filter
  const allTags = Array.from(new Set(storageAssets.flatMap(a => a.ai_tags || []))).sort();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Média příspěvku</h2>
            <p className="text-xs text-slate-500 mt-0.5">{selectedUrls.length} vybráno • max 10 fotek</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Selected media strip */}
        {selectedUrls.length > 0 && (
          <div className="p-3 border-b border-slate-800 bg-slate-800/30">
            <p className="text-xs text-slate-500 mb-2">Vybrané fotky (pořadí = carousel):</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {selectedUrls.map((url, i) => (
                <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-violet-500 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeUrl(i)}
                    className="absolute inset-0 bg-red-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-violet-600 text-[10px] text-white flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + Upload */}
        <div className="p-3 border-b border-slate-800 flex gap-2">
          <input
            type="text"
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            placeholder="Hledat podle tagů, popisu..."
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={e => e.target.files && handleUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Nahrát
          </button>
        </div>

        {/* Quick tag filters */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 border-b border-slate-800 flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setTagFilter('')}
              className={`flex-shrink-0 px-2 py-1 rounded-md text-xs transition-colors ${
                !tagFilter ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Vše
            </button>
            {allTags.slice(0, 20).map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className={`flex-shrink-0 px-2 py-1 rounded-md text-xs transition-colors ${
                  tagFilter === tag ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <ImageIcon className="w-12 h-12 mb-3" />
              <p className="text-sm">{tagFilter ? 'Žádné fotky odpovídající filtru' : 'Žádné fotky ve storage'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredAssets.map(asset => {
                const isSelected = selectedUrls.includes(asset.public_url);
                const orderIndex = selectedUrls.indexOf(asset.public_url);
                return (
                  <button
                    key={asset.id}
                    onClick={() => toggleAsset(asset.public_url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-violet-500 ring-2 ring-violet-500/30'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <img
                      src={asset.public_url}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12"%3EError%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {isSelected && (
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">{orderIndex + 1}</span>
                      </div>
                    )}
                    {asset.ai_description && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                        <p className="text-[9px] text-white/80 line-clamp-2">{asset.ai_description}</p>
                      </div>
                    )}
                    {asset.ai_tags && asset.ai_tags.length > 0 && (
                      <div className="absolute top-1 right-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedUrls([])}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Odebrat vše
            </button>
            <span className="text-xs text-slate-500">
              {filteredAssets.length} fotek ve storage
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={() => onSave(selectedUrls)}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
            >
              Uložit ({selectedUrls.length} fotek)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
