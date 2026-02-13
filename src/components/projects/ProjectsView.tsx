'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, ExternalLink, Pencil, BookOpen, Trash2, X, Save } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  late_social_set_id: string | null;
  platforms: string[];
  mood_settings: { tone: string; energy: string; style: string };
  content_mix: Record<string, number>;
  constraints: { forbidden_topics: string[]; mandatory_terms: string[]; max_hashtags: number };
  semantic_anchors: string[];
  style_rules: Record<string, unknown>;
  is_active: boolean;
}

interface KBEntry {
  id: string;
  project_id: string;
  category: string;
  title: string;
  content: string;
}

const CATEGORIES = ['product', 'audience', 'usp', 'faq', 'case_study', 'general'] as const;
const PLATFORMS = ['linkedin', 'instagram', 'facebook', 'x', 'tiktok'] as const;

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [kbProject, setKbProject] = useState<string | null>(null);
  const [kbEntries, setKbEntries] = useState<KBEntry[]>([]);

  const loadProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const loadKB = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    setKbEntries(data.knowledge_base || []);
    setKbProject(projectId);
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projekty</h1>
          <p className="text-slate-400 mt-1">{projects.length} projektů</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nový projekt
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat projekt..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <div
            key={project.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{project.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{project.slug}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => loadKB(project.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Knowledge Base"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditProject(project)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Upravit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            {project.description && (
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">{project.description}</p>
            )}

            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.platforms.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-300">
                  {p}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="capitalize">{project.mood_settings.tone}</span>
              <span>•</span>
              <span className="capitalize">{project.mood_settings.energy}</span>
              {project.late_social_set_id && (
                <>
                  <span>•</span>
                  <ExternalLink className="w-3 h-3" />
                  <span>getLate</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editProject) && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowCreate(false); setEditProject(null); }}
          onSaved={() => { setShowCreate(false); setEditProject(null); loadProjects(); }}
        />
      )}

      {/* KB Modal */}
      {kbProject && (
        <KBModal
          projectId={kbProject}
          entries={kbEntries}
          onClose={() => setKbProject(null)}
          onAdded={() => loadKB(kbProject)}
        />
      )}
    </div>
  );
}

/* ---- Project Create/Edit Modal ---- */
function ProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: Project | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(project?.name || '');
  const [slug, setSlug] = useState(project?.slug || '');
  const [description, setDescription] = useState(project?.description || '');
  const [lateId, setLateId] = useState(project?.late_social_set_id || '');
  const [platforms, setPlatforms] = useState<string[]>(project?.platforms || ['linkedin']);
  const [tone, setTone] = useState(project?.mood_settings.tone || 'professional');
  const [energy, setEnergy] = useState(project?.mood_settings.energy || 'medium');
  const [style, setStyle] = useState(project?.mood_settings.style || 'informative');
  const [forbidden, setForbidden] = useState(project?.constraints.forbidden_topics.join(', ') || '');
  const [mandatory, setMandatory] = useState(project?.constraints.mandatory_terms.join(', ') || '');
  const [anchors, setAnchors] = useState(project?.semantic_anchors.join(', ') || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const body = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || null,
      late_social_set_id: lateId || null,
      platforms,
      mood_settings: { tone, energy, style },
      constraints: {
        forbidden_topics: forbidden.split(',').map(s => s.trim()).filter(Boolean),
        mandatory_terms: mandatory.split(',').map(s => s.trim()).filter(Boolean),
        max_hashtags: 5,
      },
      semantic_anchors: anchors.split(',').map(s => s.trim()).filter(Boolean),
    };

    const url = project ? `/api/projects/${project.id}` : '/api/projects';
    const method = project ? 'PATCH' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">
            {project ? 'Upravit projekt' : 'Nový projekt'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Název" value={name} onChange={setName} placeholder="Hypoteeka.cz" />
          <Field label="Slug" value={slug} onChange={setSlug} placeholder="hypoteeka" />
          <Field label="Popis" value={description} onChange={setDescription} placeholder="Hypoteční poradce..." multiline />
          <Field label="getLate Social Set ID" value={lateId} onChange={setLateId} placeholder="abc123" />

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Platformy</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatforms(prev =>
                    prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                  )}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    platforms.includes(p)
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tón" value={tone} onChange={setTone} placeholder="professional" />
            <Field label="Energie" value={energy} onChange={setEnergy} placeholder="medium" />
            <Field label="Styl" value={style} onChange={setStyle} placeholder="informative" />
          </div>

          <Field label="Zakázaná témata (čárkou)" value={forbidden} onChange={setForbidden} placeholder="politika, náboženství" />
          <Field label="Povinné termíny (čárkou)" value={mandatory} onChange={setMandatory} placeholder="LTV, fixace" />
          <Field label="Sémantické kotvy (čárkou)" value={anchors} onChange={setAnchors} placeholder="hypotéka, sazby, ČNB" />
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Ukládám...' : 'Uložit'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- KB Modal ---- */
function KBModal({
  projectId,
  entries,
  onClose,
  onAdded,
}: {
  projectId: string;
  entries: KBEntry[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [category, setCategory] = useState<string>('product');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/kb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, content }),
    });
    setTitle('');
    setContent('');
    setSaving(false);
    onAdded();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Knowledge Base</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing entries */}
        <div className="p-5 space-y-3 max-h-60 overflow-y-auto">
          {entries.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Zatím žádné záznamy. Přidejte první fakt.</p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs text-slate-300">{entry.category}</span>
                <span className="text-sm font-medium text-white">{entry.title}</span>
              </div>
              <p className="text-sm text-slate-400">{entry.content}</p>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="p-5 border-t border-slate-800 space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Přidat záznam</h3>
          <div className="flex gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Název"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Obsah faktu..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !title || !content}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Ukládám...' : 'Přidat'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Reusable Field ---- */
function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls = "w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className={`${cls} resize-none`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}
