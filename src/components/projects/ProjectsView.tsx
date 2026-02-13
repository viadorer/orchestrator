'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, ExternalLink, Pencil, BookOpen, Trash2, X, Save,
  ArrowLeft, Share2, Palette, BarChart3, ShieldAlert, Type, Sliders, FileText,
} from 'lucide-react';
import { ProjectPrompts } from './ProjectPrompts';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  late_social_set_id: string | null;
  late_accounts: Record<string, string> | null;
  platforms: string[];
  mood_settings: { tone: string; energy: string; style: string };
  content_mix: Record<string, number>;
  constraints: { forbidden_topics: string[]; mandatory_terms: string[]; max_hashtags: number };
  semantic_anchors: string[];
  style_rules: { start_with_question: boolean; max_bullets: number; no_hashtags_in_text: boolean; max_length: number };
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
const CATEGORY_LABELS: Record<string, string> = {
  product: 'Produkt', audience: 'Cílová skupina', usp: 'USP',
  faq: 'FAQ', case_study: 'Případovka', general: 'Obecné',
};
const PLATFORMS = ['linkedin', 'instagram', 'facebook', 'x', 'tiktok'] as const;
const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-600', instagram: 'bg-pink-600', facebook: 'bg-blue-500',
  x: 'bg-slate-600', tiktok: 'bg-rose-600',
};
const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn', instagram: 'Instagram', facebook: 'Facebook',
  x: 'X (Twitter)', tiktok: 'TikTok',
};
const TONES = ['professional', 'casual', 'friendly', 'authoritative', 'playful', 'empathetic'] as const;
const ENERGIES = ['low', 'medium', 'high'] as const;
const STYLES = ['informative', 'entertaining', 'inspirational', 'educational', 'conversational'] as const;

type DetailTab = 'basic' | 'platforms' | 'tone' | 'mix' | 'constraints' | 'style' | 'kb' | 'prompts';

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('basic');
  const [kbEntries, setKbEntries] = useState<KBEntry[]>([]);

  const loadProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const openDetail = async (project: Project) => {
    setDetailProject(project);
    setDetailTab('basic');
    const res = await fetch(`/api/projects/${project.id}`);
    const data = await res.json();
    setKbEntries(data.knowledge_base || []);
  };

  const closeDetail = () => {
    setDetailProject(null);
    setKbEntries([]);
    loadProjects();
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

  // ---- Detail View ----
  if (detailProject) {
    return (
      <ProjectDetail
        project={detailProject}
        kbEntries={kbEntries}
        tab={detailTab}
        onTabChange={setDetailTab}
        onBack={closeDetail}
        onProjectUpdate={(updated) => setDetailProject(updated)}
        onKBReload={async () => {
          const res = await fetch(`/api/projects/${detailProject.id}`);
          const data = await res.json();
          setKbEntries(data.knowledge_base || []);
        }}
      />
    );
  }

  // ---- List View ----
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <button
            key={project.id}
            onClick={() => openDetail(project)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-violet-500/50 transition-colors text-left group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">{project.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{project.slug}</p>
              </div>
              {project.late_social_set_id && (
                <ExternalLink className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              )}
            </div>

            {project.description && (
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">{project.description}</p>
            )}

            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.platforms.map((p) => (
                <span key={p} className={`px-2 py-0.5 rounded-full text-xs text-white ${PLATFORM_COLORS[p] || 'bg-slate-700'}`}>
                  {p}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="capitalize">{project.mood_settings.tone}</span>
              <span>•</span>
              <span className="capitalize">{project.mood_settings.energy}</span>
              <span>•</span>
              <span className="capitalize">{project.mood_settings.style}</span>
            </div>
          </button>
        ))}
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => { setShowCreate(false); loadProjects(); openDetail(p); }}
        />
      )}
    </div>
  );
}

/* ============================================
   PROJECT DETAIL (tabbed full-page view)
   ============================================ */

const TABS: Array<{ id: DetailTab; label: string; icon: React.ElementType }> = [
  { id: 'basic', label: 'Základní', icon: Type },
  { id: 'platforms', label: 'Platformy & getLate', icon: Share2 },
  { id: 'tone', label: 'Tón & Styl', icon: Palette },
  { id: 'mix', label: 'Content Mix', icon: BarChart3 },
  { id: 'constraints', label: 'Constraints', icon: ShieldAlert },
  { id: 'style', label: 'Style Rules', icon: Sliders },
  { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
  { id: 'prompts', label: 'Prompty', icon: FileText },
];

function ProjectDetail({
  project, kbEntries, tab, onTabChange, onBack, onProjectUpdate, onKBReload,
}: {
  project: Project;
  kbEntries: KBEntry[];
  tab: DetailTab;
  onTabChange: (t: DetailTab) => void;
  onBack: () => void;
  onProjectUpdate: (p: Project) => void;
  onKBReload: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const saveField = async (fields: Partial<Project>) => {
    setSaving(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const updated = await res.json();
    if (updated.id) onProjectUpdate(updated);
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="text-slate-400 text-sm">{project.slug} {project.late_social_set_id && '• getLate připojeno'}</p>
        </div>
        {saving && <span className="text-xs text-violet-400 animate-pulse">Ukládám...</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === id ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        {tab === 'basic' && <TabBasic project={project} onSave={saveField} />}
        {tab === 'platforms' && <TabPlatforms project={project} onSave={saveField} />}
        {tab === 'tone' && <TabTone project={project} onSave={saveField} />}
        {tab === 'mix' && <TabMix project={project} onSave={saveField} />}
        {tab === 'constraints' && <TabConstraints project={project} onSave={saveField} />}
        {tab === 'style' && <TabStyle project={project} onSave={saveField} />}
        {tab === 'kb' && <TabKB projectId={project.id} entries={kbEntries} onReload={onKBReload} />}
        {tab === 'prompts' && <ProjectPrompts projectId={project.id} />}
      </div>
    </div>
  );
}

/* ---- Tab: Basic ---- */
function TabBasic({ project, onSave }: { project: Project; onSave: (f: Partial<Project>) => void }) {
  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [description, setDescription] = useState(project.description || '');

  return (
    <div className="space-y-4 max-w-lg">
      <Field label="Název projektu" value={name} onChange={setName} placeholder="Hypoteeka.cz" />
      <Field label="Slug (URL-safe)" value={slug} onChange={setSlug} placeholder="hypoteeka" />
      <Field label="Popis" value={description} onChange={setDescription} placeholder="Krátký popis projektu a jeho zaměření..." multiline />
      <SaveBtn onClick={() => onSave({ name, slug, description: description || null })} />
    </div>
  );
}

/* ---- Tab: Platforms & getLate ---- */
function TabPlatforms({ project, onSave }: { project: Project; onSave: (f: Partial<Project>) => void }) {
  const [platforms, setPlatforms] = useState<string[]>(project.platforms);
  const [accounts, setAccounts] = useState<Record<string, string>>(project.late_accounts || {});

  const updateAccount = (platform: string, value: string) => {
    setAccounts(prev => {
      const next = { ...prev };
      if (value) {
        next[platform] = value;
      } else {
        delete next[platform];
      }
      return next;
    });
  };

  const connectedCount = Object.values(accounts).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-lg">
      {/* Platform selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Sociální sítě</label>
        <div className="grid grid-cols-5 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatforms(prev =>
                prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
              )}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all ${
                platforms.includes(p)
                  ? `${PLATFORM_COLORS[p]} text-white shadow-lg`
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="w-5 h-5" />
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Per-platform getLate Account IDs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-slate-300">getLate.dev Account IDs</label>
          <span className="text-xs text-slate-500">{connectedCount}/{platforms.length} propojeno</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Každá síť má v getLate.dev vlastní Account ID. Najdete ho v getLate → Accounts, nebo přes API: GET /api/getlate/accounts
        </p>
        <div className="space-y-3">
          {platforms.map((p) => (
            <div key={p} className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                accounts[p] ? PLATFORM_COLORS[p] : 'bg-slate-800'
              }`}>
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">{PLATFORM_LABELS[p] || p}</label>
                <input
                  value={accounts[p] || ''}
                  onChange={(e) => updateAccount(p, e.target.value)}
                  placeholder={`Account ID pro ${PLATFORM_LABELS[p] || p}`}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              {accounts[p] && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-5" title="Propojeno" />
              )}
            </div>
          ))}
        </div>
        {platforms.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">Nejdřív vyberte platformy nahoře.</p>
        )}
      </div>

      <SaveBtn onClick={() => onSave({ platforms, late_accounts: accounts } as Partial<Project>)} />
    </div>
  );
}

/* ---- Tab: Tone & Style ---- */
function TabTone({ project, onSave }: { project: Project; onSave: (f: Partial<Project>) => void }) {
  const [tone, setTone] = useState(project.mood_settings.tone);
  const [energy, setEnergy] = useState(project.mood_settings.energy);
  const [style, setStyle] = useState(project.mood_settings.style);
  const [anchors, setAnchors] = useState(project.semantic_anchors.join(', '));

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Tón komunikace</label>
        <div className="flex flex-wrap gap-2">
          {TONES.map(t => (
            <button key={t} onClick={() => setTone(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tone === t ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>{t}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Energie</label>
        <div className="flex gap-2">
          {ENERGIES.map(e => (
            <button key={e} onClick={() => setEnergy(e)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors capitalize ${
                energy === e ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>{e === 'low' ? '🧘 Low' : e === 'medium' ? '⚡ Medium' : '🔥 High'}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Styl obsahu</label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button key={s} onClick={() => setStyle(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                style === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      <Field label="Sémantické kotvy (čárkou)" value={anchors} onChange={setAnchors} placeholder="hypotéka, sazby, ČNB, refinancování" />
      <p className="text-xs text-slate-500 -mt-2">Klíčová slova, která Hugo bude přirozeně zapracovávat do obsahu.</p>

      <SaveBtn onClick={() => onSave({
        mood_settings: { tone, energy, style },
        semantic_anchors: anchors.split(',').map(s => s.trim()).filter(Boolean),
      } as Partial<Project>)} />
    </div>
  );
}

/* ---- Tab: Content Mix ---- */
function TabMix({ project, onSave }: { project: Project; onSave: (f: Partial<Project>) => void }) {
  const [edu, setEdu] = useState(Math.round((project.content_mix.educational || 0.66) * 100));
  const [soft, setSoft] = useState(Math.round((project.content_mix.soft_sell || 0.17) * 100));
  const [hard, setHard] = useState(Math.round((project.content_mix.hard_sell || 0.17) * 100));

  const total = edu + soft + hard;
  const isValid = total === 100;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-sm font-medium text-white mb-1">4-1-1 Pravidlo</h3>
        <p className="text-xs text-slate-500 mb-4">
          Poměr typů obsahu. Doporučeno: 66% edukace, 17% soft-sell, 17% hard-sell. Celkem musí být 100%.
        </p>

        <div className="space-y-4">
          <MixSlider label="Edukace" desc="Budování expertní pozice, tipy, návody" value={edu} onChange={setEdu} color="bg-blue-500" />
          <MixSlider label="Soft-sell" desc="Případové studie, úspěchy, reference" value={soft} onChange={setSoft} color="bg-amber-500" />
          <MixSlider label="Hard-sell" desc="Výzva k akci, produkt, nabídka" value={hard} onChange={setHard} color="bg-red-500" />
        </div>

        <div className={`mt-4 flex items-center justify-between p-3 rounded-lg ${isValid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <span className={`text-sm font-medium ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
            Celkem: {total}%
          </span>
          {!isValid && <span className="text-xs text-red-400">Musí být 100%</span>}
        </div>
      </div>

      <SaveBtn disabled={!isValid} onClick={() => onSave({
        content_mix: { educational: edu / 100, soft_sell: soft / 100, hard_sell: hard / 100 },
      } as Partial<Project>)} />
    </div>
  );
}

function MixSlider({ label, desc, value, onChange, color }: {
  label: string; desc: string; value: number; onChange: (v: number) => void; color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-sm font-medium text-white">{label}</span>
          <span className="text-xs text-slate-500 ml-2">{desc}</span>
        </div>
        <span className="text-sm font-bold text-white w-12 text-right">{value}%</span>
      </div>
      <div className="relative">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
        </div>
        <input
          type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

/* ---- Tab: Constraints ---- */
function TabConstraints({ project, onSave }: { project: Project; onSave: (f: Partial<Project>) => void }) {
  const [forbidden, setForbidden] = useState(project.constraints.forbidden_topics.join(', '));
  const [mandatory, setMandatory] = useState(project.constraints.mandatory_terms.join(', '));
  const [maxHashtags, setMaxHashtags] = useState(project.constraints.max_hashtags);

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <Field label="Zakázaná témata (čárkou)" value={forbidden} onChange={setForbidden} placeholder="politika, náboženství, konkurence" multiline />
        <p className="text-xs text-slate-500 mt-1">Hugo se těmto tématům VŽDY vyhne.</p>
      </div>

      <div>
        <Field label="Povinné termíny (čárkou)" value={mandatory} onChange={setMandatory} placeholder="LTV, fixace, RPSN" />
        <p className="text-xs text-slate-500 mt-1">Hugo bude tyto termíny přirozeně zapracovávat.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Max hashtagů</label>
        <div className="flex items-center gap-3">
          {[0, 3, 5, 10].map(n => (
            <button key={n} onClick={() => setMaxHashtags(n)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                maxHashtags === n ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>{n === 0 ? 'Žádné' : n}</button>
          ))}
        </div>
      </div>

      <SaveBtn onClick={() => onSave({
        constraints: {
          forbidden_topics: forbidden.split(',').map(s => s.trim()).filter(Boolean),
          mandatory_terms: mandatory.split(',').map(s => s.trim()).filter(Boolean),
          max_hashtags: maxHashtags,
        },
      } as Partial<Project>)} />
    </div>
  );
}

/* ---- Tab: Style Rules ---- */
function TabStyle({ project, onSave }: { project: Project; onSave: (f: Partial<Project>) => void }) {
  const rules = project.style_rules || { start_with_question: false, max_bullets: 3, no_hashtags_in_text: false, max_length: 2200 };
  const [startQ, setStartQ] = useState(rules.start_with_question);
  const [maxBullets, setMaxBullets] = useState(rules.max_bullets);
  const [noHashInText, setNoHashInText] = useState(rules.no_hashtags_in_text);
  const [maxLen, setMaxLen] = useState(rules.max_length);

  return (
    <div className="space-y-5 max-w-lg">
      <h3 className="text-sm font-medium text-white">Pravidla formátování</h3>

      <Toggle label="Začínat otázkou" desc="Post vždy začne provokativní otázkou" value={startQ} onChange={setStartQ} />
      <Toggle label="Bez hashtagů v textu" desc="Hashtagy pouze na konci postu" value={noHashInText} onChange={setNoHashInText} />

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Max odrážek v postu</label>
        <div className="flex gap-2">
          {[0, 3, 5, 7].map(n => (
            <button key={n} onClick={() => setMaxBullets(n)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                maxBullets === n ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>{n === 0 ? 'Žádné' : n}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Max délka postu (znaků)</label>
        <div className="flex gap-2">
          {[500, 1000, 1500, 2200, 3000].map(n => (
            <button key={n} onClick={() => setMaxLen(n)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                maxLen === n ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>{n}</button>
          ))}
        </div>
      </div>

      <SaveBtn onClick={() => onSave({
        style_rules: { start_with_question: startQ, max_bullets: maxBullets, no_hashtags_in_text: noHashInText, max_length: maxLen },
      } as Partial<Project>)} />
    </div>
  );
}

/* ---- Tab: Knowledge Base ---- */
function TabKB({ projectId, entries, onReload }: { projectId: string; entries: KBEntry[]; onReload: () => void }) {
  const [category, setCategory] = useState<string>('product');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');

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
    onReload();
  };

  const filtered = filterCat === 'all' ? entries : entries.filter(e => e.category === filterCat);
  const catCounts = entries.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterCat === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}>Vše ({entries.length})</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCat === c ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}>{CATEGORY_LABELS[c]} ({catCounts[c] || 0})</button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">
            {entries.length === 0 ? 'Zatím žádné záznamy. Přidejte fakta, ze kterých bude Hugo generovat obsah.' : 'Žádné záznamy v této kategorii.'}
          </p>
        )}
        {filtered.map((entry) => (
          <div key={entry.id} className="bg-slate-800 rounded-lg p-3 group">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs text-slate-300">{CATEGORY_LABELS[entry.category] || entry.category}</span>
              <span className="text-sm font-medium text-white">{entry.title}</span>
            </div>
            <p className="text-sm text-slate-400">{entry.content}</p>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="border-t border-slate-800 pt-5 space-y-3">
        <h3 className="text-sm font-medium text-white">Přidat fakt do Knowledge Base</h3>
        <div className="flex gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Název faktu"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Detailní popis faktu, čísla, data..." rows={3}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
        <button onClick={handleAdd} disabled={saving || !title || !content}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors">
          <Plus className="w-4 h-4" />
          {saving ? 'Ukládám...' : 'Přidat'}
        </button>
      </div>
    </div>
  );
}

/* ============================================
   CREATE PROJECT MODAL (quick)
   ============================================ */

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        platforms: ['linkedin'],
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.id) onCreated(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Nový projekt</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Název" value={name} onChange={setName} placeholder="Hypoteeka.cz" />
          <Field label="Slug" value={slug} onChange={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="hypoteeka" />
          <p className="text-xs text-slate-500">Po vytvoření nastavíte platformy, tón, KB a vše ostatní.</p>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Zrušit</button>
          <button onClick={handleCreate} disabled={saving || !name}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors">
            <Plus className="w-4 h-4" /> {saving ? 'Vytvářím...' : 'Vytvořit'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   SHARED COMPONENTS
   ============================================ */

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors">
      <div className="text-left">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${value ? 'bg-violet-600' : 'bg-slate-700'}`}>
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : ''}`} />
      </div>
    </button>
  );
}

function SaveBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors">
      <Save className="w-4 h-4" /> Uložit změny
    </button>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const cls = "w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-none`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}
