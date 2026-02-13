'use client';

import { useEffect, useState, useCallback } from 'react';
import { Rss, Plus, Trash2, RefreshCw, ExternalLink, Sparkles, X } from 'lucide-react';

interface RssSource {
  id: string;
  project_id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  fetch_interval_hours: number;
  last_fetched_at: string | null;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  source_name: string;
  link: string;
  relevance_score: number | null;
  published_at: string;
  is_used_in_post: boolean;
}

interface NewsPanelProps {
  projectId: string;
  projectName: string;
}

export function NewsPanel({ projectId, projectName }: NewsPanelProps) {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', category: 'general' });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [srcRes, newsRes] = await Promise.all([
      fetch(`/api/rss?project_id=${projectId}`).then(r => r.json()),
      fetch(`/api/news?project_id=${projectId}&limit=30`).then(r => r.json()).catch(() => ({ news: [] })),
    ]);
    setSources(srcRes.sources || []);
    setNews(newsRes.news || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const addSource = async () => {
    if (!newSource.name || !newSource.url) return;
    await fetch('/api/rss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, ...newSource }),
    });
    setNewSource({ name: '', url: '', category: 'general' });
    setShowAdd(false);
    loadData();
  };

  const deleteSource = async (id: string) => {
    if (!confirm('Smazat tento RSS zdroj?')) return;
    await fetch(`/api/rss/${id}`, { method: 'DELETE' });
    loadData();
  };

  const fetchSource = async (id: string) => {
    setFetching(id);
    await fetch(`/api/rss/${id}`, { method: 'POST' });
    setFetching(null);
    loadData();
  };

  const fetchAll = async () => {
    setFetching('all');
    for (const src of sources.filter(s => s.is_active)) {
      await fetch(`/api/rss/${src.id}`, { method: 'POST' });
    }
    setFetching(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Rss className="w-5 h-5 text-orange-400" /> Contextual Pulse
          </h3>
          <p className="text-xs text-slate-400">{projectName} · {sources.length} zdrojů · {news.length} novinek</p>
        </div>
        <div className="flex gap-2">
          {sources.length > 0 && (
            <button
              onClick={fetchAll}
              disabled={fetching === 'all'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-medium hover:bg-orange-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetching === 'all' ? 'animate-spin' : ''}`} />
              {fetching === 'all' ? 'Stahuji...' : 'Stáhnout vše'}
            </button>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500"
          >
            {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAdd ? 'Zrušit' : 'Přidat zdroj'}
          </button>
        </div>
      </div>

      {/* Add source form */}
      {showAdd && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Název zdroje</label>
              <input
                value={newSource.name}
                onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                placeholder="ČSÚ, HN, Eurostat..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">RSS URL</label>
              <input
                value={newSource.url}
                onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                placeholder="https://example.com/rss.xml"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Kategorie</label>
              <select
                value={newSource.category}
                onChange={e => setNewSource({ ...newSource, category: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="general">Obecné</option>
                <option value="demografie">Demografie</option>
                <option value="ekonomika">Ekonomika</option>
                <option value="nemovitosti">Nemovitosti</option>
                <option value="finance">Finance</option>
                <option value="legislativa">Legislativa</option>
                <option value="technologie">Technologie</option>
              </select>
            </div>
          </div>
          <button
            onClick={addSource}
            disabled={!newSource.name || !newSource.url}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            Přidat RSS zdroj
          </button>
        </div>
      )}

      {/* RSS Sources */}
      {loading ? (
        <div className="text-center py-8 text-slate-500 text-sm">Načítám...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
          <Rss className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm font-medium">Žádné RSS zdroje</p>
          <p className="text-slate-600 text-xs mt-1">Přidejte RSS feedy, aby Hugo sledoval novinky v oboru</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">RSS Zdroje ({sources.length})</h4>
          {sources.map(src => (
            <div key={src.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
              <Rss className={`w-4 h-4 flex-shrink-0 ${src.is_active ? 'text-orange-400' : 'text-slate-600'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{src.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{src.category}</span>
                </div>
                <div className="text-xs text-slate-500 truncate">{src.url}</div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                {src.last_fetched_at && (
                  <span>{new Date(src.last_fetched_at).toLocaleString('cs-CZ')}</span>
                )}
                <button
                  onClick={() => fetchSource(src.id)}
                  disabled={fetching === src.id}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-orange-400"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetching === src.id ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => deleteSource(src.id)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* News items */}
      {news.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Novinky ({news.length})</h4>
          {news.map(item => (
            <div
              key={item.id}
              className={`px-3 py-2.5 rounded-lg border ${
                item.is_used_in_post
                  ? 'bg-slate-900/50 border-slate-800/50 opacity-60'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{item.title}</span>
                    {item.is_used_in_post && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Použito</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span>{item.source_name}</span>
                    <span>·</span>
                    <span>{new Date(item.published_at).toLocaleDateString('cs-CZ')}</span>
                    {item.relevance_score != null && (
                      <>
                        <span>·</span>
                        <span className={item.relevance_score >= 0.6 ? 'text-emerald-400' : item.relevance_score >= 0.4 ? 'text-amber-400' : 'text-slate-500'}>
                          Relevance: {(item.relevance_score * 100).toFixed(0)}%
                        </span>
                      </>
                    )}
                  </div>
                  {item.summary && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.summary}</p>
                  )}
                </div>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
