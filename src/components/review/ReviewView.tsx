'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, X, ChevronDown, ChevronUp, Send, CheckCheck, Trash2, Filter, Info, Share2, Pencil, Save, Sparkles, TrendingUp, Copy, ImageIcon } from 'lucide-react';
import { PostPreview } from './PostPreview';
import { MediaPickerModal } from './MediaPickerModal';

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
  template_url?: string | null;
  editor_review?: Record<string, unknown> | null;
  image_url?: string | null;
  generation_context?: Record<string, unknown> | null;
  engagement_score?: number | null;
  engagement_metrics?: Record<string, unknown> | null;
  media_urls?: string[] | null;
}

type SortBy = 'overall_asc' | 'overall_desc' | 'date_desc' | 'date_asc';

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn',
  x: 'X (Twitter)', tiktok: 'TikTok', youtube: 'YouTube',
  threads: 'Threads', bluesky: 'Bluesky', pinterest: 'Pinterest',
  reddit: 'Reddit', 'google-business': 'Google Business', telegram: 'Telegram',
  snapchat: 'Snapchat',
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600', instagram: 'bg-gradient-to-br from-purple-600 to-pink-500',
  linkedin: 'bg-blue-700', x: 'bg-black', tiktok: 'bg-black',
  youtube: 'bg-red-600', threads: 'bg-black', bluesky: 'bg-sky-500',
  pinterest: 'bg-red-700', reddit: 'bg-orange-600',
  'google-business': 'bg-blue-500', telegram: 'bg-sky-600', snapchat: 'bg-yellow-400',
};

export function ReviewView() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('overall_asc');
  const [statusFilter, setStatusFilter] = useState<string>('review');
  const [platformPicker, setPlatformPicker] = useState<{ postId: string; projectId: string; currentPlatforms: string[]; mode: 'approve' | 'publish' } | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [mediaPickerItem, setMediaPickerItem] = useState<QueueItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/queue?status=${statusFilter}`);
    const data = await res.json();
    // Post-process items: fix JSONB parsing + template_url fallback
    const items = (Array.isArray(data) ? data : []).map((item: QueueItem) => {
      // Fallback: if template_url column is empty, read from generation_context
      if (!item.template_url && item.generation_context?.template_url_value) {
        item.template_url = item.generation_context.template_url_value as string;
      }
      // Ensure media_urls is a proper array (JSONB may come as string)
      if (item.media_urls && typeof item.media_urls === 'string') {
        try { item.media_urls = JSON.parse(item.media_urls as unknown as string); } catch { item.media_urls = null; }
      }
      if (item.media_urls && !Array.isArray(item.media_urls)) {
        item.media_urls = null;
      }
      return item;
    });
    setItems(items);
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

  const approveOne = (item: QueueItem) => {
    setPlatformPicker({
      postId: item.id,
      projectId: item.project_id,
      currentPlatforms: item.platforms || [],
      mode: 'approve',
    });
  };

  const publishOne = (item: QueueItem) => {
    setPlatformPicker({
      postId: item.id,
      projectId: item.project_id,
      currentPlatforms: item.platforms || [],
      mode: 'publish',
    });
  };

  const confirmAction = async (postId: string, selectedPlatforms: string[], mode: 'approve' | 'publish') => {
    if (mode === 'approve') {
      await fetch(`/api/queue/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', platforms: selectedPlatforms }),
      });
    } else {
      // Update platforms first, then publish
      await fetch(`/api/queue/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: selectedPlatforms }),
      });
      const pubRes = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [postId] }),
      });
      const pubData = await pubRes.json();
      const failed = pubData.results?.filter((r: { status: string; error?: string }) => r.status === 'failed');
      if (failed?.length > 0) {
        alert(`Chyba při odesílání: ${failed.map((f: { error?: string }) => f.error).join(', ')}`);
      }
    }
    setPlatformPicker(null);
    loadItems();
  };

  const rejectOne = async (id: string) => {
    await fetch(`/api/queue/${id}`, { method: 'DELETE' });
    loadItems();
  };

  const startEdit = (item: QueueItem) => {
    setEditingPost(item.id);
    setEditText(item.text_content);
    setFeedbackNote('');
    setExpanded(item.id);
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditText('');
    setFeedbackNote('');
  };

  const saveEdit = async (item: QueueItem) => {
    setSaving(true);
    await fetch(`/api/queue/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text_content: editText,
        edited_text: editText,
        feedback_note: feedbackNote || null,
      }),
    });
    // Save feedback for Hugo's learning loop
    if (editText !== item.text_content) {
      await fetch('/api/agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: item.id,
          editedText: editText,
          feedbackNote: feedbackNote || null,
        }),
      }).catch(() => {}); // Don't block on feedback failure
    }
    setSaving(false);
    setEditingPost(null);
    setEditText('');
    setFeedbackNote('');
    loadItems();
  };

  const saveMedia = async (item: QueueItem, mediaUrls: string[]) => {
    await fetch(`/api/queue/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_urls: mediaUrls,
        image_url: mediaUrls[0] || null,
      }),
    });
    setMediaPickerItem(null);
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

              {/* Thumbnail – template > photo > chart > card; multi-image badge */}
              {(item.template_url || item.image_url || item.chart_url || item.card_url || (item.media_urls && item.media_urls.length > 0)) && (
                <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                  <img
                    src={item.template_url || item.image_url || (item.media_urls?.[0]) || item.chart_url || item.card_url || ''}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {item.media_urls && item.media_urls.length > 1 && (
                    <div className="absolute bottom-0.5 right-0.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-medium text-white">
                      +{item.media_urls.length - 1}
                    </div>
                  )}
                </div>
              )}

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
                  {item.image_url && item.visual_type === 'matched_photo' && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-xs text-emerald-400" title="Fotka z Media Library (pgvector match)">📷 library</span>
                  )}
                  {item.image_url && item.visual_type === 'generated_photo' && (
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-xs text-violet-400" title="AI vygenerovaná fotka (Imagen 4)">🎨 imagen</span>
                  )}
                  {item.image_url && !item.visual_type?.includes('photo') && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-xs text-emerald-400">📷 foto</span>
                  )}
                  {item.chart_url && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-xs text-blue-400">📊 graf</span>
                  )}
                  {item.card_url && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-xs text-indigo-400">🃏 karta</span>
                  )}
                  {item.template_url && (
                    <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-xs text-fuchsia-400" title="Brand template (fotka + logo + text)">🖼 template</span>
                  )}
                  {item.media_urls && item.media_urls.length > 1 && (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-xs text-cyan-400" title={`${item.media_urls.length} fotek v carouselu`}>📷 {item.media_urls.length}x</span>
                  )}
                  {!item.template_url && !item.image_url && !item.chart_url && !item.card_url && item.image_prompt && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-xs text-amber-400">🎨 prompt</span>
                  )}
                  {item.source === 'ab_variant' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-xs text-amber-400 font-medium">A/B</span>
                  )}
                  {item.engagement_score != null && item.engagement_score > 0 && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/20 text-xs text-emerald-400" title={`Engagement score: ${item.engagement_score}`}>
                      <TrendingUp className="w-3 h-3" /> {item.engagement_score}
                    </span>
                  )}
                </div>

                {editingPost === item.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={Math.min(20, Math.max(6, editText.split('\n').length + 2))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-violet-500/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        value={feedbackNote}
                        onChange={(e) => setFeedbackNote(e.target.value)}
                        placeholder="Poznámka pro Huga (volitelné) – např. 'Zkrátit hook', 'Víc dat'"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(item)}
                        disabled={saving || editText === item.text_content}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" /> {saving ? 'Ukládám...' : 'Uložit úpravu'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Zrušit
                      </button>
                      <span className="text-[10px] text-slate-600 ml-auto">{editText.length} znaků</span>
                    </div>
                  </div>
                ) : (
                  <>
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

                    {/* Inline media gallery – show all photos from media_urls */}
                    {item.media_urls && item.media_urls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.media_urls.map((url, idx) => (
                          <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0">
                            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                            {idx === 0 && item.template_url && (
                              <div className="absolute inset-0 ring-2 ring-inset ring-fuchsia-500/60 rounded-lg" title="Šablona z této fotky" />
                            )}
                          </div>
                        ))}
                        {item.template_url && (
                          <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-fuchsia-500/40 bg-slate-800 flex-shrink-0" title="Brand template preview">
                            <img src={item.template_url} alt="template" className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Platform preview mockup (expanded) */}
                {expanded === item.id && editingPost !== item.id && (
                  <div className="mt-4">
                    <PostPreview
                      text={item.text_content}
                      platforms={item.platforms}
                      projectName={item.projects?.name}
                      imageUrl={item.image_url}
                      chartUrl={item.chart_url}
                      cardUrl={item.card_url}
                      templateUrl={item.template_url}
                      mediaUrls={item.media_urls}
                    />
                  </div>
                )}

                {/* Generation context (debug trace) */}
                {expanded === item.id && item.generation_context && (
                  <GenerationContextPanel context={item.generation_context} />
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
                      onClick={() => startEdit(item)}
                      className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                      title="Upravit text"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMediaPickerItem(item)}
                      className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors"
                      title="Změnit fotky"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => approveOne(item)}
                      className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                      title="Schválit + vybrat sítě"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        await fetch('/api/agent/tasks', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            projectId: item.project_id,
                            taskType: 'generate_ab_variants',
                            params: { original_text: item.text_content, platform: item.platforms[0] || 'facebook', content_type: item.content_type, source_post_id: item.id },
                          }),
                        });
                        alert('A/B varianty se generují. Najdete je v review za chvíli.');
                      }}
                      className="p-2 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors"
                      title="Generovat A/B varianty"
                    >
                      <Copy className="w-4 h-4" />
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
                {statusFilter === 'approved' && (
                  <>
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                      title="Upravit text"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMediaPickerItem(item)}
                      className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors"
                      title="Změnit fotky"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => publishOne(item)}
                      className="p-2 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-colors"
                      title="Odeslat na sítě"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Platform Picker Modal */}
      {platformPicker && (
        <PlatformPickerModal
          postId={platformPicker.postId}
          projectId={platformPicker.projectId}
          currentPlatforms={platformPicker.currentPlatforms}
          mode={platformPicker.mode}
          onConfirm={(postId, platforms) => confirmAction(postId, platforms, platformPicker.mode)}
          onClose={() => setPlatformPicker(null)}
        />
      )}

      {/* Media Picker Modal */}
      {mediaPickerItem && (
        <MediaPickerModal
          projectId={mediaPickerItem.project_id}
          currentImageUrl={mediaPickerItem.image_url}
          currentMediaUrls={mediaPickerItem.media_urls || undefined}
          onSave={(urls) => saveMedia(mediaPickerItem, urls)}
          onClose={() => setMediaPickerItem(null)}
        />
      )}
    </div>
  );
}

/* ---- Platform Picker Modal ---- */
function PlatformPickerModal({
  postId, projectId, currentPlatforms, mode, onConfirm, onClose,
}: {
  postId: string;
  projectId: string;
  currentPlatforms: string[];
  mode: 'approve' | 'publish';
  onConfirm: (postId: string, platforms: string[]) => void;
  onClose: () => void;
}) {
  const [projectName, setProjectName] = useState<string>('');
  const [projectPlatforms, setProjectPlatforms] = useState<string[]>([]);
  const [lateAccounts, setLateAccounts] = useState<Record<string, string>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(project => {
        const platforms: string[] = project.platforms || [];
        const accounts: Record<string, string> = project.late_accounts || {};
        setProjectName(project.name || '');
        setProjectPlatforms(platforms);
        setLateAccounts(accounts);
        // Pre-select: only platforms that belong to THIS project AND have getLate account
        const connected = platforms.filter((p: string) => accounts[p]);
        // Fallback: select platforms from post that exist in this project
        const validCurrent = currentPlatforms.filter((p: string) => platforms.includes(p));
        setSelectedPlatforms(connected.length > 0 ? connected : validCurrent);
        setLoading(false);
      })
      .catch(() => {
        setProjectPlatforms([]);
        setSelectedPlatforms([]);
        setLoading(false);
      });
  }, [projectId, currentPlatforms]);

  const connectedPlatforms = projectPlatforms.filter(p => lateAccounts[p]);
  const unconnectedPlatforms = projectPlatforms.filter(p => !lateAccounts[p]);

  const toggle = (p: string) => {
    // Only allow toggling connected platforms
    if (!connectedPlatforms.includes(p)) return;
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const selectAll = () => setSelectedPlatforms([...connectedPlatforms]);
  const selectNone = () => setSelectedPlatforms([]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {mode === 'publish' ? 'Odeslat na sítě' : 'Schválit + vybrat sítě'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {projectName && <span className="text-violet-400 font-medium">{projectName}</span>}
              {projectName ? ' — ' : ''}
              {mode === 'publish' ? 'vyberte sítě pro okamžité odeslání' : 'na které sítě se post odešle'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Quick actions */}
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-violet-400 hover:text-violet-300">Vybrat vše</button>
                <span className="text-xs text-slate-600">|</span>
                <button onClick={selectNone} className="text-xs text-slate-400 hover:text-white">Zrušit výběr</button>
              </div>

              {/* Connected platforms (selectable) */}
              {connectedPlatforms.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {connectedPlatforms.map(p => {
                    const isSelected = selectedPlatforms.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => toggle(p)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                          isSelected
                            ? 'border-violet-500/50 bg-violet-600/10'
                            : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? (PLATFORM_COLORS[p] || 'bg-slate-700') : 'bg-slate-700'
                        }`}>
                          <Share2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            {PLATFORM_LABELS[p] || p}
                          </div>
                          <div className="text-[10px] text-emerald-500">
                            ID: {lateAccounts[p].slice(0, 8)}...
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {connectedPlatforms.length === 0 && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-sm text-red-400 font-medium">Není propojená žádná síť</p>
                  <p className="text-xs text-red-400/70 mt-1">Propojte getLate Account ID v nastavení projektu</p>
                </div>
              )}

              {/* Unconnected platforms (disabled, info only) */}
              {unconnectedPlatforms.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Nepropojené sítě ({unconnectedPlatforms.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {unconnectedPlatforms.map(p => (
                      <span key={p} className="px-2 py-1 rounded-lg bg-slate-800/50 text-[11px] text-slate-600">
                        {PLATFORM_LABELS[p] || p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="text-xs text-slate-500">
                {selectedPlatforms.length} z {connectedPlatforms.length} propojených sítí vybráno
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
            Zrušit
          </button>
          <button
            onClick={() => onConfirm(postId, selectedPlatforms.filter(p => projectPlatforms.includes(p)))}
            disabled={selectedPlatforms.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {mode === 'publish' ? <Send className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {mode === 'publish' ? 'Odeslat' : 'Schválit'} ({selectedPlatforms.length} {selectedPlatforms.length === 1 ? 'síť' : selectedPlatforms.length < 5 ? 'sítě' : 'sítí'})
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Generation Context Panel ---- */
function GenerationContextPanel({ context }: { context: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);

  const items: Array<{ label: string; value: string; color?: string }> = [
    { label: 'Zdroj', value: (context.source as string) || 'agent', color: context.source === 'manual_ui' ? 'text-blue-400' : 'text-violet-400' },
    { label: 'Content type', value: `${context.content_type || '?'}`, color: 'text-white' },
    { label: 'Důvod typu', value: (context.content_type_reason as string) || '–' },
    { label: 'Platforma', value: (context.platform as string) || '–' },
    { label: 'KB záznamy', value: `${context.kb_entries_used ?? '?'} (${(context.kb_categories as string[])?.join(', ') || '–'})` },
    { label: 'Novinky', value: context.news_injected ? `${context.news_injected} (${(context.news_titles as string[])?.slice(0, 2).join(', ')})` : 'žádné' },
    { label: 'Agent memory', value: (context.memory_types_loaded as string[])?.join(', ') || 'žádná' },
    { label: 'Dedup postů', value: `${context.dedup_posts_checked ?? '?'}` },
    { label: 'Feedback', value: `${context.feedback_entries ?? 0} úprav` },
    { label: 'Pokusy', value: `${context.attempts ?? 1}` },
    { label: 'Editor', value: context.editor_used ? `ano (${(context.editor_changes as string[])?.length || 0} změn)` : 'ne', color: context.editor_used ? 'text-emerald-400' : 'text-slate-500' },
    { label: 'Média', value: context.media_matched ? `matched (${context.media_strategy})` : `ne (${context.media_strategy})`, color: context.media_matched ? 'text-emerald-400' : 'text-slate-500' },
    { label: 'Tokeny', value: `${context.tokens_used ?? '?'}` },
    { label: 'Model', value: (context.model as string) || '–' },
  ];

  if (context.human_topic) {
    items.unshift({ label: 'Lidské téma', value: context.human_topic as string, color: 'text-amber-400' });
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        {open ? 'Skrýt kontext generování' : 'Zobrazit kontext generování'}
      </button>
      {open && (
        <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="col-span-2 text-xs font-medium text-violet-400 mb-1">Kontext generování</div>
          {items.map((item) => (
            <div key={item.label} className="flex justify-between text-xs">
              <span className="text-slate-500">{item.label}</span>
              <span className={item.color || 'text-slate-300'}>{item.value}</span>
            </div>
          ))}
          {typeof context.timestamp === 'string' && (
            <div className="col-span-2 text-[10px] text-slate-600 mt-1 text-right">
              {new Date(context.timestamp).toLocaleString('cs-CZ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
