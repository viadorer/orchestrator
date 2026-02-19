'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Upload, X, Check, Loader2, ImageIcon, Film, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  slug: string;
  platforms: string[];
  late_accounts: Record<string, string> | null;
}

interface SelectedProject {
  id: string;
  name: string;
  platforms: string[];
  selectedPlatforms: string[];
  connectedPlatforms: string[];
}

interface MediaFile {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  public_url?: string;
  error?: string;
}

interface PostResult {
  project_id: string;
  project_name?: string;
  platform: string;
  queue_id?: string;
  adapted_text?: string;
  success: boolean;
  error?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn',
  x: 'X (Twitter)', tiktok: 'TikTok', youtube: 'YouTube',
  threads: 'Threads', bluesky: 'Bluesky', pinterest: 'Pinterest',
  reddit: 'Reddit', 'google-business': 'Google Business', telegram: 'Telegram',
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600', instagram: 'bg-gradient-to-br from-purple-600 to-pink-500',
  linkedin: 'bg-blue-700', x: 'bg-black', tiktok: 'bg-black',
  youtube: 'bg-red-600', threads: 'bg-black', bluesky: 'bg-sky-500',
  pinterest: 'bg-red-700', reddit: 'bg-orange-600',
  'google-business': 'bg-blue-500', telegram: 'bg-sky-600',
};

const PLATFORM_LIMITS: Record<string, number> = {
  x: 280, threads: 500, instagram: 2200, linkedin: 3000, tiktok: 4000,
  facebook: 63206, youtube: 5000, bluesky: 300, pinterest: 500,
  reddit: 40000, 'google-business': 1500, telegram: 4096,
};

export function ManualPostView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<SelectedProject[]>([]);
  const [text, setText] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [hugoAdapt, setHugoAdapt] = useState(false);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<PostResult[] | null>(null);
  const [error, setError] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(Array.isArray(data) ? data : []));
  }, []);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) &&
    !selectedProjects.some(sp => sp.id === p.id)
  );

  const addProject = (project: Project) => {
    const connected = (project.platforms || []).filter(p => project.late_accounts?.[p]);
    setSelectedProjects(prev => [...prev, {
      id: project.id,
      name: project.name,
      platforms: project.platforms || [],
      selectedPlatforms: connected.length > 0 ? [...connected] : [...(project.platforms || [])],
      connectedPlatforms: connected,
    }]);
    setProjectSearch('');
  };

  const removeProject = (id: string) => {
    setSelectedProjects(prev => prev.filter(p => p.id !== id));
  };

  const togglePlatform = (projectId: string, platform: string) => {
    setSelectedProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const has = p.selectedPlatforms.includes(platform);
      return {
        ...p,
        selectedPlatforms: has
          ? p.selectedPlatforms.filter(pl => pl !== platform)
          : [...p.selectedPlatforms, platform],
      };
    }));
  };

  const selectAllPlatforms = (projectId: string) => {
    setSelectedProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, selectedPlatforms: [...p.connectedPlatforms] };
    }));
  };

  // Media handling
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const newMedia: MediaFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
      if (file.size > 20 * 1024 * 1024) continue; // 20MB max
      newMedia.push({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        uploaded: false,
      });
    }
    setMedia(prev => [...prev, ...newMedia]);
  }, []);

  const uploadMedia = async (index: number, projectId: string): Promise<string | null> => {
    const item = media[index];
    if (!item || item.uploaded) return item?.public_url || null;

    setMedia(prev => prev.map((m, i) => i === index ? { ...m, uploading: true } : m));

    try {
      const formData = new FormData();
      formData.append('files', item.file);
      formData.append('project_id', projectId);

      const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.results?.[0]?.success) {
        // Get public URL from media_assets
        const assetId = data.results[0].asset_id;
        // Fetch the public URL
        const assetRes = await fetch(`/api/media/${assetId}`).catch(() => null);
        let publicUrl = '';
        if (assetRes?.ok) {
          const assetData = await assetRes.json();
          publicUrl = assetData.public_url || '';
        }

        setMedia(prev => prev.map((m, i) => i === index ? { ...m, uploading: false, uploaded: true, public_url: publicUrl } : m));
        return publicUrl;
      } else {
        const errMsg = data.results?.[0]?.error || 'Upload failed';
        setMedia(prev => prev.map((m, i) => i === index ? { ...m, uploading: false, error: errMsg } : m));
        return null;
      }
    } catch (err) {
      setMedia(prev => prev.map((m, i) => i === index ? { ...m, uploading: false, error: 'Upload failed' } : m));
      return null;
    }
  };

  const removeMedia = (index: number) => {
    setMedia(prev => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  // Submit
  const handleSubmit = async () => {
    if (!text.trim() || selectedProjects.length === 0) return;
    setSending(true);
    setError('');
    setResults(null);

    try {
      // Upload media first (use first project as storage target)
      const mediaUrls: string[] = [];
      if (media.length > 0) {
        const firstProjectId = selectedProjects[0].id;
        for (let i = 0; i < media.length; i++) {
          if (media[i].uploaded && media[i].public_url) {
            mediaUrls.push(media[i].public_url!);
          } else {
            const url = await uploadMedia(i, firstProjectId);
            if (url) mediaUrls.push(url);
          }
        }
      }

      const res = await fetch('/api/manual-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          projects: selectedProjects.map(p => ({
            id: p.id,
            platforms: p.selectedPlatforms,
          })),
          media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
          hugo_adapt: hugoAdapt,
          status: 'approved',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při odesílání');
    }
    setSending(false);
  };

  const totalPosts = selectedProjects.reduce((sum, p) => sum + p.selectedPlatforms.length, 0);

  // Character limit warnings
  const getCharWarnings = () => {
    const warnings: string[] = [];
    for (const proj of selectedProjects) {
      for (const platform of proj.selectedPlatforms) {
        const limit = PLATFORM_LIMITS[platform];
        if (limit && text.length > limit) {
          warnings.push(`${proj.name} → ${PLATFORM_LABELS[platform] || platform}: ${text.length}/${limit} znaků`);
        }
      }
    }
    return warnings;
  };

  const charWarnings = getCharWarnings();

  // Reset after success
  const handleReset = () => {
    setText('');
    setMedia([]);
    setSelectedProjects([]);
    setResults(null);
    setError('');
    setHugoAdapt(false);
  };

  return (
    <div className="p-6 w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ruční příspěvek</h1>
        <p className="text-slate-400 mt-1 text-sm">Napište post, vyberte projekty a sítě → posty se vytvoří jako schválené v review queue.</p>
      </div>

      {/* Success state */}
      {results && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-emerald-400">
                Vytvořeno {results.filter(r => r.success).length} z {results.length} postů
              </h2>
            </div>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {r.success ? (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-slate-300">{r.project_name}</span>
                  <span className="text-slate-600">→</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${r.success ? 'bg-slate-800 text-slate-300' : 'bg-red-500/20 text-red-400'}`}>
                    {PLATFORM_LABELS[r.platform] || r.platform}
                  </span>
                  {r.adapted_text && (
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-xs text-violet-400">Hugo adaptováno</span>
                  )}
                  {r.error && <span className="text-xs text-red-400">{r.error}</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors">
              Nový příspěvek
            </button>
            <p className="text-xs text-slate-500 self-center">Posty najdete v Review → Approved → Odeslat na sítě</p>
          </div>
        </div>
      )}

      {/* Form */}
      {!results && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Text + Media (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Text input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Text příspěvku</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={10}
                placeholder="Napište text příspěvku..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-slate-500">{text.length} znaků</span>
                {charWarnings.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    {charWarnings.length} {charWarnings.length === 1 ? 'překročení' : 'překročení'} limitu
                  </div>
                )}
              </div>
              {charWarnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {charWarnings.map((w, i) => (
                    <div key={i} className="text-xs text-amber-400/80 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Media upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Média (volitelné)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={e => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />

              {media.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {media.map((m, i) => (
                    <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                      {m.file.type.startsWith('image/') ? (
                        <img src={m.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                      {m.uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                      {m.uploaded && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {m.error && (
                        <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                          <X className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30 cursor-pointer hover:border-slate-600 hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-300">Přetáhněte fotky/videa nebo klikněte</p>
                  <p className="text-xs text-slate-500 mt-0.5">JPG, PNG, WebP, MP4 • max 20 MB</p>
                </div>
              </div>
            </div>

            {/* Hugo adapt toggle */}
            <button
              type="button"
              onClick={() => setHugoAdapt(!hugoAdapt)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-colors ${
                hugoAdapt
                  ? 'bg-violet-600/10 border-violet-500/40 text-violet-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <Sparkles className={`w-5 h-5 flex-shrink-0 ${hugoAdapt ? 'text-violet-400' : 'text-slate-600'}`} />
              <div className="text-left flex-1">
                <div className="text-sm font-medium">Hugo adaptace</div>
                <div className="text-[11px] opacity-70">
                  {hugoAdapt ? 'Hugo přizpůsobí text pro každou síť (délka, tón, hashtagy)' : 'Stejný text na všechny sítě'}
                </div>
              </div>
              <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${hugoAdapt ? 'bg-violet-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-white mx-0.5 shadow-sm" />
              </div>
            </button>

            {/* Submit */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={sending || !text.trim() || selectedProjects.length === 0 || totalPosts === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Vytvářím {totalPosts} {totalPosts === 1 ? 'post' : totalPosts < 5 ? 'posty' : 'postů'}...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Vytvořit {totalPosts} {totalPosts === 1 ? 'post' : totalPosts < 5 ? 'posty' : 'postů'} jako schválené
                </>
              )}
            </button>
          </div>

          {/* Right: Project picker (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Projekty a sítě</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedProjects.length === projects.length) {
                      setSelectedProjects([]);
                    } else {
                      setSelectedProjects(projects.map(p => {
                        const connected = (p.platforms || []).filter(pl => p.late_accounts?.[pl]);
                        return {
                          id: p.id, name: p.name, platforms: p.platforms || [],
                          selectedPlatforms: connected.length > 0 ? [...connected] : [...(p.platforms || [])],
                          connectedPlatforms: connected,
                        };
                      }));
                    }
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {selectedProjects.length === projects.length ? 'Zrušit vše' : 'Vybrat vše'}
                </button>
                <span className="text-[11px] text-slate-600">{selectedProjects.length}/{projects.length}</span>
              </div>
            </div>

            <input
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              placeholder="Filtrovat projekty..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />

            {/* All projects with checkboxes */}
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {projects
                .filter(p => !projectSearch || p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                .map(project => {
                  const isSelected = selectedProjects.some(sp => sp.id === project.id);
                  const selectedProj = selectedProjects.find(sp => sp.id === project.id);
                  const connected = (project.platforms || []).filter(pl => project.late_accounts?.[pl]);

                  return (
                    <div key={project.id} className={`rounded-lg border transition-colors ${
                      isSelected ? 'border-violet-500/30 bg-violet-600/5' : 'border-slate-800 bg-slate-900'
                    }`}>
                      {/* Project checkbox row */}
                      <button
                        onClick={() => {
                          if (isSelected) {
                            removeProject(project.id);
                          } else {
                            addProject(project);
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left"
                      >
                        <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-violet-600 border-violet-500' : 'border-slate-600 bg-slate-800'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={`text-sm font-medium flex-1 truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {project.name}
                        </span>
                        <span className="text-[10px] text-slate-600 flex-shrink-0">
                          {connected.length}/{(project.platforms || []).length}
                        </span>
                      </button>

                      {/* Platform chips (shown when selected) */}
                      {isSelected && selectedProj && (
                        <div className="px-3 pb-2 flex flex-wrap gap-1">
                          {selectedProj.platforms.map(platform => {
                            const isPlatformSelected = selectedProj.selectedPlatforms.includes(platform);
                            const isConnected = connected.includes(platform);
                            return (
                              <button
                                key={platform}
                                onClick={() => togglePlatform(project.id, platform)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                  isPlatformSelected
                                    ? 'bg-violet-600/20 text-violet-300'
                                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {PLATFORM_LABELS[platform] || platform}
                                {!isConnected && <span className="text-amber-500">!</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Summary */}
            {selectedProjects.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Projektů:</span>
                    <span className="text-white font-medium">{selectedProjects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Celkem postů:</span>
                    <span className="text-white font-medium">{totalPosts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Médií:</span>
                    <span className="text-white font-medium">{media.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hugo adaptace:</span>
                    <span className={hugoAdapt ? 'text-violet-400 font-medium' : 'text-slate-500'}>
                      {hugoAdapt ? 'Ano' : 'Ne'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-medium">Schváleno</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
