'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Save, Trash2, X, Copy, ChevronDown, ChevronUp, FileText, Loader2, Download } from 'lucide-react';

interface PromptTemplate {
  id: string;
  project_id: string;
  slug: string;
  category: string;
  content: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  version: number;
}

const CATEGORIES = [
  { value: 'identity', label: 'Identita', desc: 'Kdo je agent, jak se představí' },
  { value: 'communication', label: 'Komunikace', desc: 'Pravidla komunikace, formátování' },
  { value: 'guardrail', label: 'Guardrails', desc: 'Co NIKDY nedělat, bezpečnost' },
  { value: 'business_rules', label: 'Obchodní pravidla', desc: 'Čísla, limity, pravidla oboru' },
  { value: 'content_strategy', label: 'Strategie obsahu', desc: 'Co publikovat, kdy, jak' },
  { value: 'platform_rules', label: 'Platformy', desc: 'Pravidla per platforma' },
  { value: 'cta_rules', label: 'CTA pravidla', desc: 'Výzvy k akci' },
  { value: 'topic_boundaries', label: 'Omezení tématu', desc: 'Co je a není relevantní' },
  { value: 'personalization', label: 'Personalizace', desc: 'Oslovení, lokalizace' },
  { value: 'quality_criteria', label: 'Kvalita', desc: 'Kritéria kvality postu' },
  { value: 'examples', label: 'Příklady', desc: 'Dobré/špatné posty' },
  { value: 'seasonal', label: 'Sezónní', desc: 'Svátky, události' },
  { value: 'competitor', label: 'Konkurence', desc: 'Pravidla ohledně konkurence' },
  { value: 'legal', label: 'Právní', desc: 'Disclaimery, právní omezení' },
  { value: 'editor_rules', label: 'Editor Rules', desc: 'Instrukce pro Hugo-Editora (2nd pass)' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  identity: 'bg-violet-500/20 text-violet-400',
  communication: 'bg-blue-500/20 text-blue-400',
  guardrail: 'bg-red-500/20 text-red-400',
  business_rules: 'bg-amber-500/20 text-amber-400',
  content_strategy: 'bg-emerald-500/20 text-emerald-400',
  platform_rules: 'bg-cyan-500/20 text-cyan-400',
  cta_rules: 'bg-orange-500/20 text-orange-400',
  topic_boundaries: 'bg-rose-500/20 text-rose-400',
  personalization: 'bg-pink-500/20 text-pink-400',
  quality_criteria: 'bg-teal-500/20 text-teal-400',
  examples: 'bg-indigo-500/20 text-indigo-400',
  seasonal: 'bg-lime-500/20 text-lime-400',
  competitor: 'bg-slate-500/20 text-slate-400',
  legal: 'bg-gray-500/20 text-gray-400',
  editor_rules: 'bg-yellow-500/20 text-yellow-400',
};

export function ProjectPrompts({ projectId }: { projectId: string }) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/prompts`);
    const data = await res.json();
    setPrompts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadPrompts(); }, [loadPrompts]);

  const copyDefaults = async () => {
    setCopying(true);
    await fetch(`/api/projects/${projectId}/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'copy_defaults' }),
    });
    await loadPrompts();
    setCopying(false);
  };

  const startEdit = (p: PromptTemplate) => {
    setEditingId(p.id);
    setEditContent(p.content);
    setEditDesc(p.description || '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}/prompts/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent, description: editDesc }),
    });
    setPrompts(prev => prev.map(p =>
      p.id === editingId ? { ...p, content: editContent, description: editDesc } : p
    ));
    setEditingId(null);
    setSaving(false);
  };

  const deletePrompt = async (id: string) => {
    await fetch(`/api/projects/${projectId}/prompts/${id}`, { method: 'DELETE' });
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  const filtered = filterCat === 'all' ? prompts : prompts.filter(p => p.category === filterCat);
  const catCounts = prompts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Prompt šablony ({prompts.length})</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailní instrukce pro Huga – co dělat, co nedělat, jak komunikovat.
          </p>
        </div>
        <div className="flex gap-2">
          {prompts.length === 0 && (
            <button
              onClick={copyDefaults}
              disabled={copying}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {copying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
              Načíst výchozí šablony
            </button>
          )}
          {prompts.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
                {(['md', 'sql', 'csv'] as const).map(fmt => (
                  <a
                    key={fmt}
                    href={`/api/projects/${projectId}/prompts/export?format=${fmt}`}
                    download
                    className="block px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {fmt === 'md' ? 'Markdown (.md)' : fmt === 'sql' ? 'SQL (.sql)' : 'CSV (.csv)'}
                  </a>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nová šablona
          </button>
        </div>
      </div>

      {/* Category filter */}
      {prompts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterCat === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Vše ({prompts.length})
          </button>
          {CATEGORIES.filter(c => catCounts[c.value]).map(c => (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterCat === c.value ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c.label} ({catCounts[c.value]})
            </button>
          ))}
        </div>
      )}

      {/* Prompt list */}
      {prompts.length === 0 && (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-white mb-1">Žádné prompt šablony</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Klikněte na &quot;Načíst výchozí šablony&quot; pro import 15+ připravených šablon, 
            nebo vytvořte vlastní od nuly.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(prompt => (
          <div key={prompt.id} className="bg-slate-800 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[prompt.category] || 'bg-slate-700 text-slate-400'}`}>
                {CATEGORIES.find(c => c.value === prompt.category)?.label || prompt.category}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white">{prompt.slug}</span>
                {prompt.description && (
                  <span className="text-xs text-slate-500 ml-2">{prompt.description}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {editingId !== prompt.id && (
                  <button
                    onClick={() => startEdit(prompt)}
                    className="px-2.5 py-1 rounded text-xs text-violet-400 hover:bg-violet-600/20 transition-colors"
                  >
                    Upravit
                  </button>
                )}
                <button
                  onClick={() => deletePrompt(prompt.id)}
                  className="p-1.5 rounded hover:bg-red-600/20 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-500 transition-colors"
                >
                  {expandedId === prompt.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Editing */}
            {editingId === prompt.id && (
              <div className="border-t border-slate-700 p-3 space-y-3">
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Popis šablony..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y leading-relaxed"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{editContent.length} znaků</span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors">
                      Zrušit
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
                    >
                      <Save className="w-3 h-3" /> {saving ? 'Ukládám...' : 'Uložit'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preview (collapsed) */}
            {editingId !== prompt.id && expandedId === prompt.id && (
              <div className="border-t border-slate-700 p-3">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                  {prompt.content}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreatePromptModal
          projectId={projectId}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadPrompts(); }}
        />
      )}
    </div>
  );
}

/* ---- Create Prompt Modal ---- */
function CreatePromptModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('guardrail');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, category, content, description }),
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Nová prompt šablona</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Slug (ID)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="guardrail_no_politics"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Kategorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label} – {c.desc}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Popis</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krátký popis co tato šablona řeší..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Obsah promptu</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="PRAVIDLA:&#10;- Nikdy nedělej X&#10;- Vždy dělej Y&#10;- Pokud nastane Z, reaguj takto:&#10;  - Varianta 1: ...&#10;  - Varianta 2: ..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y leading-relaxed"
            />
            <p className="text-xs text-slate-500 mt-1">{content.length} znaků. Buďte co nejdetailnější – Hugo potřebuje přesné instrukce.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
            Zrušit
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !slug || !content}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> {saving ? 'Vytvářím...' : 'Vytvořit'}
          </button>
        </div>
      </div>
    </div>
  );
}
