'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, X, ChevronDown, ChevronUp, Send, CheckCheck, Trash2, Filter } from 'lucide-react';
import { PostPreview } from './PostPreview';

interface QueueItem {
  id: string;
  project_id: string;
  text_content: string;
  image_prompt: string | null;
  content_type: string;
  platforms: string[];
  ai_scores: {
    creativity?: number;
    tone_match?: number;
    hallucination_risk?: number;
    value_score?: number;
    overall?: number;
  };
  status: string;
  source: string;
  created_at: string;
  projects?: { name: string; slug: string };
  visual_type?: string;
  chart_url?: string | null;
  card_url?: string | null;
  editor_review?: Record<string, unknown> | null;
  image_url?: string | null;
}

type SortBy = 'overall_asc' | 'overall_desc' | 'date_desc' | 'date_asc';

export function ReviewView() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('overall_asc');
  const [statusFilter, setStatusFilter] = useState<string>('review');

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/queue?status=${statusFilter}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const sorted = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'overall_asc': return (a.ai_scores?.overall ?? 10) - (b.ai_scores?.overall ?? 10);
      case 'overall_desc': return (b.ai_scores?.overall ?? 0) - (a.ai_scores?.overall ?? 0);
      case 'date_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default: return 0;
    }
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(i => i.id)));
    }
  };

  const bulkApprove = async () => {
    await fetch('/api/queue/bulk-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    loadItems();
  };

  const approveOne = async (id: string) => {
    await fetch(`/api/queue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    loadItems();
  };

  const rejectOne = async (id: string) => {
    await fetch(`/api/queue/${id}`, { method: 'DELETE' });
    loadItems();
  };

  const scoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-slate-500';
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Review</h1>
          <p className="text-slate-400 mt-1">{items.length} příspěvků k posouzení</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {['review', 'approved', 'draft'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="overall_asc">Nejhorší skóre první</option>
            <option value="overall_desc">Nejlepší skóre první</option>
            <option value="date_desc">Nejnovější</option>
            <option value="date_asc">Nejstarší</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-violet-600/10 border border-violet-500/20 rounded-lg">
          <span className="text-sm text-violet-300">{selected.size} vybráno</span>
          <button
            onClick={bulkApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Schválit vše
          </button>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Filter className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Žádné příspěvky ve stavu &quot;{statusFilter}&quot;</p>
          </div>
        )}

        {/* Select all */}
        {items.length > 0 && (
          <button
            onClick={selectAll}
            className="text-xs text-slate-400 hover:text-white transition-colors mb-2"
          >
            {selected.size === items.length ? 'Odznačit vše' : 'Vybrat vše'}
          </button>
        )}

        {sorted.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900 border rounded-xl transition-colors ${
              selected.has(item.id) ? 'border-violet-500/50' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Checkbox */}
              <button
                onClick={() => toggleSelect(item.id)}
                className={`mt-1 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  selected.has(item.id)
                    ? 'bg-violet-600 border-violet-600'
                    : 'border-slate-600 hover:border-slate-400'
                }`}
              >
                {selected.has(item.id) && <Check className="w-3 h-3 text-white" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium text-violet-400">{item.projects?.name || 'Unknown'}</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-500">{item.content_type}</span>
                  <span className="text-xs text-slate-600">•</span>
                  {item.platforms.map(p => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-xs text-slate-400">{p}</span>
                  ))}
                  {item.image_url && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-xs text-emerald-400">📷 foto</span>
                  )}
                </div>

                <p className={`text-sm text-slate-200 ${expanded === item.id ? '' : 'line-clamp-3'}`}>
                  {item.text_content}
                </p>

                {item.text_content.length > 200 && (
                  <button
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="flex items-center gap-1 mt-1 text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    {expanded === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {expanded === item.id ? 'Méně' : 'Více'}
                  </button>
                )}

                {/* Platform preview mockup (expanded) */}
                {expanded === item.id && (
                  <div className="mt-4">
                    <PostPreview
                      text={item.text_content}
                      platforms={item.platforms}
                      projectName={item.projects?.name}
                      imageUrl={item.image_url}
                      chartUrl={item.chart_url}
                      cardUrl={item.card_url}
                    />
                  </div>
                )}

                {/* Editor review details */}
                {expanded === item.id && item.editor_review && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="text-xs font-medium text-amber-400 mb-1.5">Hugo-Editor Review</div>
                    {(item.editor_review as { changes?: string[] })?.changes?.map((change: string, i: number) => (
                      <div key={i} className="text-xs text-slate-400">• {change}</div>
                    ))}
                    {(item.editor_review as { guardrail_violations?: string[] })?.guardrail_violations?.map((v: string, i: number) => (
                      <div key={i} className="text-xs text-red-400">⚠ {v}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scores */}
              <div className="flex-shrink-0 text-right space-y-0.5">
                <div className={`text-2xl font-bold ${scoreColor(item.ai_scores?.overall)}`}>
                  {item.ai_scores?.overall ?? '?'}
                </div>
                <div className="text-xs text-slate-500">overall</div>
                {expanded === item.id && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Kreativita</span>
                      <span className={scoreColor(item.ai_scores?.creativity)}>{item.ai_scores?.creativity ?? '?'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Tón</span>
                      <span className={scoreColor(item.ai_scores?.tone_match)}>{item.ai_scores?.tone_match ?? '?'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Halucinace</span>
                      <span className={scoreColor(item.ai_scores?.hallucination_risk)}>{item.ai_scores?.hallucination_risk ?? '?'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">Hodnota</span>
                      <span className={scoreColor(item.ai_scores?.value_score)}>{item.ai_scores?.value_score ?? '?'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {statusFilter === 'review' && (
                  <>
                    <button
                      onClick={() => approveOne(item.id)}
                      className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                      title="Schválit"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rejectOne(item.id)}
                      className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                      title="Smazat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
