'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2, Zap } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  slug: string;
  platforms: string[];
}

interface Pattern {
  id: string;
  name: string;
  description: string;
  structure_template: string;
  platforms: string[];
}

interface GenerateResult {
  content: {
    text: string;
    image_prompt?: string;
    scores: Record<string, number>;
  };
  saved: { id: string };
}

const CONTENT_TYPES = [
  { value: 'educational', label: 'Edukace', desc: 'Budování expertní pozice' },
  { value: 'soft_sell', label: 'Soft-sell', desc: 'Případová studie, úspěch' },
  { value: 'hard_sell', label: 'Hard-sell', desc: 'Výzva k akci, produkt' },
  { value: 'news', label: 'Aktualita', desc: 'Reakce na novinky v oboru' },
  { value: 'engagement', label: 'Engagement', desc: 'Otázka, anketa, diskuze' },
];

export function GenerateView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('linkedin');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPattern, setSelectedPattern] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState('');
  const [batchCount, setBatchCount] = useState(1);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/patterns').then(r => r.json()),
    ]).then(([p, pat]) => {
      setProjects(Array.isArray(p) ? p : []);
      setPatterns(Array.isArray(pat) ? pat : []);
    });
  }, []);

  const currentProject = projects.find(p => p.id === selectedProject);
  const filteredPatterns = patterns.filter(p =>
    p.platforms.includes(selectedPlatform)
  );

  const handleGenerate = async () => {
    if (!selectedProject) return;
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      for (let i = 0; i < batchCount; i++) {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProject,
            platform: selectedPlatform,
            contentType: selectedType || undefined,
            patternId: selectedPattern || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (i === batchCount - 1) {
          setResult(data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při generování');
    }
    setGenerating(false);
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Generovat obsah</h1>
        <p className="text-slate-400 mt-1">Hugo vytvoří příspěvek podle nastavení projektu</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings panel */}
        <div className="space-y-4">
          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Projekt</label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                const proj = projects.find(p => p.id === e.target.value);
                if (proj?.platforms[0]) setSelectedPlatform(proj.platforms[0]);
              }}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Vyber projekt...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Platform */}
          {currentProject && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Platforma</label>
              <div className="flex flex-wrap gap-2">
                {currentProject.platforms.map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedPlatform === p
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Typ obsahu <span className="text-slate-500">(prázdné = auto 4-1-1)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedType('')}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                  !selectedType ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>Auto (4-1-1)</div>
                <div className="text-[10px] opacity-70 mt-0.5">Hugo vybere sám</div>
              </button>
              {CONTENT_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setSelectedType(ct.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    selectedType === ct.value ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div>{ct.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pattern */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Vzor <span className="text-slate-500">(volitelné)</span>
            </label>
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Žádný vzor (volný formát)</option>
              {filteredPatterns.map(p => (
                <option key={p.id} value={p.id}>{p.name} – {p.description}</option>
              ))}
            </select>
          </div>

          {/* Batch count */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Počet příspěvků</label>
            <div className="flex items-center gap-2">
              {[1, 3, 5, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setBatchCount(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    batchCount === n ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {n}x
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Hugo generuje{batchCount > 1 ? ` (${batchCount}x)` : ''}...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generovat{batchCount > 1 ? ` ${batchCount} příspěvků` : ''}
              </>
            )}
          </button>
        </div>

        {/* Result panel */}
        <div>
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-violet-400">Vygenerováno</span>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{result.content.text}</p>
              </div>

              {result.content.image_prompt && (
                <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-slate-500 mb-1">Image prompt:</p>
                  <p className="text-xs text-slate-400">{result.content.image_prompt}</p>
                </div>
              )}

              {/* Scores */}
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(result.content.scores).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className={`text-lg font-bold ${scoreColor(value)}`}>{value}</div>
                    <div className="text-[10px] text-slate-500 truncate">{key.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500 mt-4">
                Uloženo do review fronty. Přejděte do Review pro schválení.
              </p>
            </div>
          )}

          {!result && !error && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 py-12">
              <Sparkles className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Vyberte projekt a klikněte na Generovat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
