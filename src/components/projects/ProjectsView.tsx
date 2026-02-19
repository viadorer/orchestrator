'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Search, ExternalLink, Pencil, BookOpen, Trash2, X, Save, Upload, Check, Sparkles,
  ArrowLeft, Share2, Palette, BarChart3, ShieldAlert, Type, Sliders, FileText, Image, Rss, MessageCircle, Bot,
} from 'lucide-react';
import { ProjectPrompts } from './ProjectPrompts';
import { MediaLibrary } from './MediaLibrary';
import { NewsPanel } from './NewsPanel';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  late_social_set_id: string | null;
  late_profile_id: string | null;
  late_accounts: Record<string, string> | null;
  orchestrator_config: Record<string, unknown> | null;
  platforms: string[];
  mood_settings: { tone: string; energy: string; style: string };
  content_mix: Record<string, number>;
  constraints: { forbidden_topics: string[]; mandatory_terms: string[]; max_hashtags: number };
  semantic_anchors: string[];
  style_rules: { start_with_question: boolean; max_bullets: number; no_hashtags_in_text: boolean; max_length: number };
  visual_identity: { primary_color: string; secondary_color: string; accent_color: string; text_color: string; font: string; logo_url: string | null; style: string; text_overlay?: { enabled: boolean; position: 'top' | 'center' | 'bottom'; max_chars: number; max_lines: number; uppercase: boolean; font_size_ratio: number; font_weight: 'normal' | 'bold'; bg_style: 'box' | 'gradient' | 'shadow_only' | 'none'; bg_opacity: number; text_color: string; accent_color: string; padding_ratio: number; highlight_numbers: boolean } } | null;
  is_active: boolean;
}

interface KBEntry {
  id: string;
  project_id: string;
  category: string;
  title: string;
  content: string;
}

const CATEGORIES = ['product', 'audience', 'usp', 'faq', 'case_study', 'data', 'market', 'legal', 'process', 'general'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  product: 'Produkt & Služba', audience: 'Cílová skupina', usp: 'Konkurenční výhoda',
  faq: 'Otázky & Odpovědi', case_study: 'Příběhy & Reference',
  data: 'Čísla & Statistiky', market: 'Trh & Trendy',
  legal: 'Legislativa', process: 'Jak to funguje',
  general: 'Ostatní',
};
const PLATFORMS = [
  'facebook', 'instagram', 'linkedin', 'x', 'tiktok',
  'youtube', 'threads', 'bluesky', 'pinterest', 'reddit',
  'google-business', 'telegram', 'snapchat',
] as const;
const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-500', instagram: 'bg-pink-600', linkedin: 'bg-blue-600',
  x: 'bg-slate-600', tiktok: 'bg-rose-600', youtube: 'bg-red-600',
  threads: 'bg-neutral-700', bluesky: 'bg-sky-500', pinterest: 'bg-red-700',
  reddit: 'bg-orange-600', 'google-business': 'bg-blue-400', telegram: 'bg-sky-600',
  snapchat: 'bg-yellow-400',
};
const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn',
  x: 'X (Twitter)', tiktok: 'TikTok', youtube: 'YouTube',
  threads: 'Threads', bluesky: 'Bluesky', pinterest: 'Pinterest',
  reddit: 'Reddit', 'google-business': 'Google Business', telegram: 'Telegram',
  snapchat: 'Snapchat',
};
const TONES = ['professional', 'casual', 'friendly', 'authoritative', 'playful', 'empathetic'] as const;
const ENERGIES = ['low', 'medium', 'high'] as const;
const STYLES = ['informative', 'entertaining', 'inspirational', 'educational', 'conversational'] as const;

type DetailTab = 'basic' | 'platforms' | 'orchestrator' | 'visual' | 'media' | 'news' | 'chatbot' | 'tone' | 'mix' | 'constraints' | 'style' | 'kb' | 'prompts';

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
    <div className="p-6 w-full">
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
              <div className="flex items-center gap-3">
                {project.visual_identity?.logo_url ? (
                  <img src={project.visual_identity.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: project.visual_identity?.primary_color || '#6d28d9' }}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">{project.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{project.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!!(project.orchestrator_config as Record<string, unknown>)?.enabled && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30" title="Hugo Agent aktivní">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                )}
                {project.late_social_set_id && (
                  <ExternalLink className="w-4 h-4 text-emerald-500" />
                )}
              </div>
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

            {/* Orchestrator config summary */}
            {!!(project.orchestrator_config as Record<string, unknown>)?.enabled && (() => {
              const oc = project.orchestrator_config as Record<string, unknown>;
              const freqMap: Record<string, string> = { '2x_daily': '2x denne', 'daily': 'denne', '3x_week': '3x tydne', 'weekly': 'tydne' };
              return (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    {freqMap[(oc.posting_frequency as string)] || String(oc.posting_frequency || 'daily')}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {((oc.posting_times as string[]) || []).join(', ')}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    max {(oc.max_posts_per_day as number) || 2}/den
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${oc.auto_publish ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {oc.auto_publish ? `auto ≥${oc.auto_publish_threshold}` : 'manual review'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    media: {(oc.media_strategy as string) || 'auto'}
                  </span>
                </div>
              );
            })()}
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
  { id: 'orchestrator', label: 'Orchestrátor', icon: Sliders },
  { id: 'visual', label: 'Vizuální identita', icon: Palette },
  { id: 'media', label: 'Média', icon: Image },
  { id: 'news', label: 'Novinky', icon: Rss },
  { id: 'chatbot', label: 'Chatbot', icon: MessageCircle },
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
    <div className="p-6 w-full">
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
        {tab === 'orchestrator' && <TabOrchestrator project={project} onSave={saveField} />}
        {tab === 'visual' && <TabVisualIdentity project={project} onSave={saveField} />}
        {tab === 'media' && <MediaLibrary projectId={project.id} projectName={project.name} />}
        {tab === 'news' && <NewsPanel projectId={project.id} projectName={project.name} />}
        {tab === 'chatbot' && <TabChatbot project={project} onSave={saveField} />}
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
  const [profileId, setProfileId] = useState(project.late_profile_id || '');
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

      {/* getLate Profile ID */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">getLate Profile ID</label>
        <input
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          placeholder="698f5a828970eb7fddc3c2e7"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
        />
        <p className="text-xs text-slate-500 mt-1">Najdete v getLate → Connections → profile id. Každý projekt = 1 profil.</p>
      </div>

      <SaveBtn onClick={() => onSave({ platforms, late_profile_id: profileId || null, late_accounts: accounts } as Partial<Project>)} />
    </div>
  );
}

/* ---- Tab: Orchestrator ---- */
const FREQUENCIES = [
  { value: '2x_daily', label: '2× denně (dravá)' },
  { value: 'daily', label: '1× denně' },
  { value: '3x_week', label: '3× týdně' },
  { value: 'weekly', label: '1× týdně (udržovací)' },
] as const;

const MEDIA_STRATEGIES = [
  { value: 'auto', label: 'Auto – Hugo vybírá fotky z knihovny' },
  { value: 'manual', label: 'Manuální – jen admin přiřazuje' },
  { value: 'none', label: 'Žádné – jen text' },
] as const;

function TabOrchestrator({ project, onSave }: { project: Project; onSave: (f: Partial<Project>) => void }) {
  const defaults = {
    enabled: true, posting_frequency: 'daily', posting_times: ['09:00', '15:00'],
    max_posts_per_day: 2, content_strategy: '4-1-1', auto_publish: false,
    auto_publish_threshold: 8.5, timezone: 'Europe/Prague', media_strategy: 'auto',
    platforms_priority: [] as string[], pause_weekends: false,
  };
  const cfg = { ...defaults, ...(project.orchestrator_config || {}) } as typeof defaults;

  const [enabled, setEnabled] = useState(cfg.enabled);
  const [frequency, setFrequency] = useState(cfg.posting_frequency);
  const [times, setTimes] = useState(cfg.posting_times.join(', '));
  const [maxPerDay, setMaxPerDay] = useState(cfg.max_posts_per_day);
  const [autoPublish, setAutoPublish] = useState(cfg.auto_publish);
  const [threshold, setThreshold] = useState(cfg.auto_publish_threshold);
  const [timezone, setTimezone] = useState(cfg.timezone);
  const [mediaStrategy, setMediaStrategy] = useState(cfg.media_strategy);
  const [pauseWeekends, setPauseWeekends] = useState(cfg.pause_weekends);

  const buildConfig = () => ({
    orchestrator_config: {
      enabled, posting_frequency: frequency,
      posting_times: times.split(',').map(t => t.trim()).filter(Boolean),
      max_posts_per_day: maxPerDay, content_strategy: cfg.content_strategy,
      auto_publish: autoPublish, auto_publish_threshold: threshold,
      timezone, media_strategy: mediaStrategy,
      platforms_priority: cfg.platforms_priority, pause_weekends: pauseWeekends,
    },
  });

  return (
    <div className="space-y-6 max-w-lg">
      {/* Master switch */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-slate-700">
        <div>
          <div className="text-sm font-medium text-white">Hugo Orchestrátor</div>
          <div className="text-xs text-slate-400">Autonomní generování a plánování obsahu</div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {enabled && (
        <>
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Frekvence publikace</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    frequency === f.value ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posting times */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Časy publikace</label>
            <input
              value={times}
              onChange={e => setTimes(e.target.value)}
              placeholder="09:00, 15:00"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">Hodiny oddělené čárkou. Hugo generuje jen v těchto oknech.</p>
          </div>

          {/* Max per day + timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Max postů/den</label>
              <input
                type="number" min={1} max={10} value={maxPerDay}
                onChange={e => setMaxPerDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Časové pásmo</label>
              <input
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
              />
            </div>
          </div>

          {/* Media strategy */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Strategie médií</label>
            <div className="space-y-2">
              {MEDIA_STRATEGIES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMediaStrategy(m.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    mediaStrategy === m.value ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-publish */}
          <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Auto-publish</div>
                <div className="text-xs text-slate-400">Publikovat bez review pokud skóre &ge; threshold</div>
              </div>
              <button
                onClick={() => setAutoPublish(!autoPublish)}
                className={`relative w-12 h-6 rounded-full transition-colors ${autoPublish ? 'bg-amber-500' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoPublish ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {autoPublish && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min. skóre pro auto-publish</label>
                <input
                  type="number" min={5} max={10} step={0.5} value={threshold}
                  onChange={e => setThreshold(parseFloat(e.target.value) || 8)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Pause weekends */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Pauza o víkendech</span>
            <button
              onClick={() => setPauseWeekends(!pauseWeekends)}
              className={`relative w-12 h-6 rounded-full transition-colors ${pauseWeekends ? 'bg-violet-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${pauseWeekends ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </>
      )}

      <SaveBtn onClick={() => onSave(buildConfig() as Partial<Project>)} />
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
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<KBEntry[]>([]);

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

  const handleDelete = async (kbId: string) => {
    if (!confirm('Smazat tento KB záznam?')) return;
    await fetch(`/api/projects/${projectId}/kb?kbId=${kbId}`, { method: 'DELETE' });
    onReload();
  };

  const handleActivate = async (kbId: string) => {
    await fetch(`/api/projects/${projectId}/kb`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kbId, is_active: true, title: aiSuggestions.find(s => s.id === kbId)?.title.replace('[AI NÁVRH] ', '') }),
    });
    setAiSuggestions(prev => prev.filter(s => s.id !== kbId));
    onReload();
  };

  const loadAiSuggestions = async () => {
    setShowAiSuggestions(!showAiSuggestions);
    if (!showAiSuggestions) {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      // AI suggestions are KB entries with is_active=false — they come from the full project load
      // We need a separate query for inactive entries
      const allRes = await fetch(`/api/projects/${projectId}/kb?inactive=true`);
      const allData = await allRes.json();
      setAiSuggestions(Array.isArray(allData) ? allData : []);
    }
  };

  const filtered = filterCat === 'all' ? entries : entries.filter(e => e.category === filterCat);
  const catCounts = entries.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header with export + AI suggestions */}
      <div className="flex items-center justify-between">
        <button
          onClick={loadAiSuggestions}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showAiSuggestions ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> AI návrhy
        </button>
        {entries.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Export KB
            </button>
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
              {(['md', 'sql', 'csv'] as const).map(fmt => (
                <a
                  key={fmt}
                  href={`/api/projects/${projectId}/kb/export?format=${fmt}`}
                  download
                  className="block px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {fmt === 'md' ? 'Markdown (.md)' : fmt === 'sql' ? 'SQL (.sql)' : 'CSV (.csv)'}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Suggestions panel */}
      {showAiSuggestions && (
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-medium text-amber-400">AI návrhy KB záznamů</h3>
          <p className="text-xs text-slate-500">Hugo navrhl tyto záznamy na základě gap analýzy. Aktivujte je nebo smažte.</p>
          {aiSuggestions.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-3">Žádné AI návrhy. Hugo je vytvoří ve čtvrtek automaticky.</p>
          )}
          {aiSuggestions.map((s) => (
            <div key={s.id} className="bg-slate-800/50 rounded-lg p-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-xs text-amber-400">{CATEGORY_LABELS[s.category] || s.category}</span>
                  <span className="text-sm font-medium text-white">{s.title}</span>
                </div>
                <p className="text-xs text-slate-400">{s.content}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => handleActivate(s.id)} className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors" title="Aktivovat">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors" title="Smazat">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs text-slate-300">{CATEGORY_LABELS[entry.category] || entry.category}</span>
                  <span className="text-sm font-medium text-white">{entry.title}</span>
                </div>
                <p className="text-sm text-slate-400">{entry.content}</p>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                title="Smazat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
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
   CREATE PROJECT WIZARD (3-step onboarding)
   ============================================ */

const WIZARD_STEPS = [
  { id: 1, label: 'Základní info', desc: 'Název, popis, platformy' },
  { id: 2, label: 'Tón & Styl', desc: 'Jak bude Hugo komunikovat' },
  { id: 3, label: 'Vizuální identita', desc: 'Barvy, logo, font' },
] as const;

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Basic
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['linkedin']);

  // Step 2: Tone
  const [tone, setTone] = useState('professional');
  const [energy, setEnergy] = useState('medium');
  const [style, setStyle] = useState('informative');

  // Step 3: Visual
  const [primaryColor, setPrimaryColor] = useState('#1a1a2e');
  const [accentColor, setAccentColor] = useState('#7c3aed');
  const [logoUrl, setLogoUrl] = useState('');

  const handleCreate = async () => {
    setSaving(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description || null,
        platforms,
        mood_settings: { tone, energy, style },
        visual_identity: {
          primary_color: primaryColor,
          secondary_color: '#16213e',
          accent_color: accentColor,
          text_color: '#ffffff',
          font: 'Inter',
          logo_url: logoUrl || null,
          style: 'minimal',
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.id) onCreated(data);
  };

  const canNext = step === 1 ? !!name : true;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Nový projekt</h2>
            <p className="text-xs text-slate-500 mt-0.5">Krok {step} / {WIZARD_STEPS.length}: {WIZARD_STEPS[step - 1].desc}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-5 pt-4">
          {WIZARD_STEPS.map(s => (
            <div key={s.id} className={`flex-1 h-1 rounded-full transition-colors ${s.id <= step ? 'bg-violet-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 min-h-[280px]">
          {step === 1 && (
            <>
              <Field label="Název projektu" value={name} onChange={(v) => { setName(v); if (!slug) setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} placeholder="MůjProjekt.cz" />
              <Field label="Slug (URL-safe)" value={slug} onChange={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="muj-projekt" />
              <Field label="Popis (volitelný)" value={description} onChange={setDescription} placeholder="Krátký popis projektu..." multiline />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Platformy</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.slice(0, 8).map(p => (
                    <button key={p} onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        platforms.includes(p) ? `${PLATFORM_COLORS[p]} text-white` : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}>{PLATFORM_LABELS[p] || p}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
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
                      className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        energy === e ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}>{e === 'low' ? 'Low' : e === 'medium' ? 'Medium' : 'High'}</button>
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
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Hlavní barva</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent" />
                    <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Akcentová barva</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent" />
                    <input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Logo URL (volitelné)</label>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                <p className="text-xs text-slate-500 mt-1">Používá se na kartách a AI obrázcích.</p>
              </div>
              {/* Preview */}
              <div className="p-4 rounded-xl border border-slate-700" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center gap-2 mb-2">
                  {logoUrl && <img src={logoUrl} alt="" className="w-6 h-6 rounded object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  <span className="text-sm font-bold text-white">{name || 'Projekt'}</span>
                </div>
                <div className="h-0.5 rounded-full mb-2" style={{ backgroundColor: accentColor, width: '30%' }} />
                <p className="text-xs text-white/70">Ukázka vizuální identity</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400">
                  Po vytvoření se automaticky vygenerují výchozí prompty a KB záznamy. Upravíte je v detailu projektu.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-800">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Zpět
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Zrušit</button>
            {step < WIZARD_STEPS.length ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext}
                className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors">
                Další
              </button>
            ) : (
              <button onClick={handleCreate} disabled={saving || !name}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                <Plus className="w-4 h-4" /> {saving ? 'Vytvářím...' : 'Vytvořit projekt'}
              </button>
            )}
          </div>
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
  const cls = "w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500";
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

/* ---- Tab: Visual Identity ---- */
const VISUAL_STYLES = ['minimal', 'bold', 'elegant', 'playful', 'corporate', 'dark', 'light'] as const;
const FONTS = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Open Sans', 'Lato', 'Raleway', 'Nunito', 'Source Sans Pro', 'DM Sans'] as const;

function TabVisualIdentity({ project, onSave }: { project: Project; onSave: (f: Partial<Project>) => void }) {
  const vi = project.visual_identity || {
    primary_color: '#1a1a2e', secondary_color: '#16213e', accent_color: '#0f3460',
    text_color: '#ffffff', font: 'Inter', logo_url: null, style: 'minimal',
  };
  const [primary, setPrimary] = useState(vi.primary_color);
  const [secondary, setSecondary] = useState(vi.secondary_color);
  const [accent, setAccent] = useState(vi.accent_color);
  const [textColor, setTextColor] = useState(vi.text_color);
  const [font, setFont] = useState(vi.font);
  const [logoUrl, setLogoUrl] = useState(vi.logo_url || '');
  const [style, setStyle] = useState(vi.style);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text overlay state
  const defaultOverlay = {
    enabled: false, position: 'bottom' as const, max_chars: 50, max_lines: 2,
    uppercase: true, font_size_ratio: 0.045, font_weight: 'bold' as const,
    bg_style: 'gradient' as const, bg_opacity: 0.6, text_color: '#FFFFFF',
    accent_color: '#FACC15', padding_ratio: 0.06, highlight_numbers: true,
  };
  const overlayInit = vi.text_overlay || defaultOverlay;
  const [olEnabled, setOlEnabled] = useState(overlayInit.enabled);
  const [olPosition, setOlPosition] = useState(overlayInit.position);
  const [olMaxChars, setOlMaxChars] = useState(overlayInit.max_chars);
  const [olMaxLines, setOlMaxLines] = useState(overlayInit.max_lines);
  const [olUppercase, setOlUppercase] = useState(overlayInit.uppercase);
  const [olFontSize, setOlFontSize] = useState(overlayInit.font_size_ratio);
  const [olFontWeight, setOlFontWeight] = useState(overlayInit.font_weight);
  const [olBgStyle, setOlBgStyle] = useState(overlayInit.bg_style);
  const [olBgOpacity, setOlBgOpacity] = useState(overlayInit.bg_opacity);
  const [olTextColor, setOlTextColor] = useState(overlayInit.text_color);
  const [olAccentColor, setOlAccentColor] = useState(overlayInit.accent_color);
  const [olHighlightNumbers, setOlHighlightNumbers] = useState(overlayInit.highlight_numbers);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/projects/${project.id}/logo`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log('[logo-upload] Response:', res.status, data);
      if (res.ok && data.logo_url) {
        setLogoUrl(data.logo_url);
      } else {
        alert('Logo upload selhal: ' + (data.error || `HTTP ${res.status}`));
      }
    } catch (err) {
      console.error('[logo-upload] Error:', err);
      alert('Logo upload selhal: ' + (err instanceof Error ? err.message : 'Neznámá chyba'));
    }
    setUploading(false);
  };

  const deleteLogo = async () => {
    setUploading(true);
    try {
      await fetch(`/api/projects/${project.id}/logo`, { method: 'DELETE' });
      setLogoUrl('');
    } catch { /* ignore */ }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadLogo(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo(file);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-medium text-white mb-1">Vizuální identita projektu</h3>
        <p className="text-xs text-slate-500 mb-4">
          Barvy a styl se používají pro generování grafů (QuickChart), textových karet a AI obrázků (Imagen).
        </p>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-4">
        <ColorField label="Primární barva" desc="Pozadí karet, hlavní tón" value={primary} onChange={setPrimary} />
        <ColorField label="Sekundární barva" desc="Doplňková barva" value={secondary} onChange={setSecondary} />
        <ColorField label="Akcentová barva" desc="Zvýraznění, CTA" value={accent} onChange={setAccent} />
        <ColorField label="Barva textu" desc="Text na kartách" value={textColor} onChange={setTextColor} />
      </div>

      {/* Preview */}
      <div className="p-6 rounded-xl border border-slate-700" style={{ backgroundColor: primary }}>
        <div className="flex items-center gap-3 mb-3">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <span className="text-lg font-bold" style={{ color: textColor, fontFamily: font }}>{project.name}</span>
        </div>
        <div className="h-1 rounded-full mb-3" style={{ backgroundColor: accent, width: '40%' }} />
        <p className="text-sm" style={{ color: textColor, fontFamily: font, opacity: 0.8 }}>
          Ukázka vizuální identity. Takto budou vypadat generované karty a grafy.
        </p>
        <div className="mt-3 inline-block px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: accent, color: textColor }}>
          Ukázkové CTA
        </div>
      </div>

      {/* Font */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Font</label>
        <div className="flex flex-wrap gap-2">
          {FONTS.map(f => (
            <button key={f} onClick={() => setFont(f)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                font === f ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={{ fontFamily: f }}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Vizuální styl</label>
        <div className="flex flex-wrap gap-2">
          {VISUAL_STYLES.map(s => (
            <button key={s} onClick={() => setStyle(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                style === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Logo projektu</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        {logoUrl ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800 border border-slate-700">
            <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-white/5 p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">Logo nahráno</p>
              <p className="text-xs text-slate-500 truncate">{logoUrl.split('/').pop()}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
              >
                Změnit
              </button>
              <button
                onClick={deleteLogo}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg bg-red-600/20 text-xs text-red-400 hover:bg-red-600/30 transition-colors"
              >
                Smazat
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              dragOver
                ? 'border-violet-500 bg-violet-600/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            {uploading ? (
              <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-300">Přetáhněte logo sem nebo klikněte</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, SVG, WebP • max 2 MB</p>
                </div>
              </>
            )}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-2">
          Používá se na kartách a jako overlay na AI generovaných obrázcích (Imagen).
        </p>
      </div>

      {/* ---- Text Overlay Settings ---- */}
      <div className="border-t border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white">Text overlay na fotkách</h3>
            <p className="text-xs text-slate-500 mt-0.5">Krátký hook/headline přes vygenerovanou nebo vybranou fotku.</p>
          </div>
          <button
            onClick={() => setOlEnabled(!olEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              olEnabled ? 'bg-violet-600' : 'bg-slate-700'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              olEnabled ? 'translate-x-5.5 left-[1px]' : 'left-[2px]'
            }`} style={{ transform: olEnabled ? 'translateX(22px)' : 'translateX(0)' }} />
          </button>
        </div>

        {olEnabled && (
          <div className="space-y-4 pl-0">
            {/* Position */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Pozice textu</label>
              <div className="flex gap-2">
                {(['top', 'center', 'bottom'] as const).map(p => (
                  <button key={p} onClick={() => setOlPosition(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                      olPosition === p ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}>{p === 'top' ? 'Nahoře' : p === 'center' ? 'Uprostřed' : 'Dole'}</button>
                ))}
              </div>
            </div>

            {/* Background style */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Pozadí textu</label>
              <div className="flex gap-2">
                {(['gradient', 'box', 'shadow_only', 'none'] as const).map(s => (
                  <button key={s} onClick={() => setOlBgStyle(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      olBgStyle === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}>{s === 'gradient' ? 'Gradient' : s === 'box' ? 'Box' : s === 'shadow_only' ? 'Jen stín' : 'Žádné'}</button>
                ))}
              </div>
            </div>

            {/* Opacity slider */}
            {(olBgStyle === 'gradient' || olBgStyle === 'box') && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Průhlednost pozadí: {Math.round(olBgOpacity * 100)}%</label>
                <input type="range" min="0.1" max="0.9" step="0.05" value={olBgOpacity}
                  onChange={e => setOlBgOpacity(parseFloat(e.target.value))}
                  className="w-full accent-violet-500" />
              </div>
            )}

            {/* Font size */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Velikost písma: {Math.round(olFontSize * 1000) / 10}% šířky</label>
              <input type="range" min="0.025" max="0.08" step="0.005" value={olFontSize}
                onChange={e => setOlFontSize(parseFloat(e.target.value))}
                className="w-full accent-violet-500" />
            </div>

            {/* Max chars + lines */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Max znaků</label>
                <input type="number" min={10} max={120} value={olMaxChars}
                  onChange={e => setOlMaxChars(parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Max řádků</label>
                <input type="number" min={1} max={4} value={olMaxLines}
                  onChange={e => setOlMaxLines(parseInt(e.target.value) || 2)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            </div>

            {/* Toggles row */}
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={olUppercase} onChange={e => setOlUppercase(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500" />
                <span className="text-xs text-slate-300">VELKÁ PÍSMENA</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={olFontWeight === 'bold'} onChange={e => setOlFontWeight(e.target.checked ? 'bold' : 'normal')}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500" />
                <span className="text-xs text-slate-300">Tučné</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={olHighlightNumbers} onChange={e => setOlHighlightNumbers(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500" />
                <span className="text-xs text-slate-300">Zvýraznit čísla</span>
              </label>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Barva textu</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={olTextColor} onChange={e => setOlTextColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent" />
                  <input value={olTextColor} onChange={e => setOlTextColor(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Barva čísel (accent)</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={olAccentColor} onChange={e => setOlAccentColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent" />
                  <input value={olAccentColor} onChange={e => setOlAccentColor(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
              {olBgStyle === 'gradient' && (
                <div className={`absolute left-0 right-0 ${olPosition === 'top' ? 'top-0' : olPosition === 'center' ? 'top-1/3' : 'bottom-0'}`}
                  style={{ height: '35%', background: olPosition === 'top' ? `linear-gradient(to bottom, rgba(0,0,0,${olBgOpacity}), transparent)` : `linear-gradient(to top, rgba(0,0,0,${olBgOpacity}), transparent)` }} />
              )}
              {olBgStyle === 'box' && (
                <div className={`absolute left-0 right-0 ${olPosition === 'top' ? 'top-0' : olPosition === 'center' ? 'top-1/3' : 'bottom-0'}`}
                  style={{ height: '20%', backgroundColor: `rgba(0,0,0,${olBgOpacity})` }} />
              )}
              <div className={`absolute left-4 right-4 ${olPosition === 'top' ? 'top-4' : olPosition === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-4'}`}>
                <p style={{ color: olTextColor, fontWeight: olFontWeight, fontSize: '14px', textTransform: olUppercase ? 'uppercase' : 'none' }}>
                  {olHighlightNumbers
                    ? <>{`Prodejte o `}<span style={{ color: olAccentColor }}>31 %</span>{` rychleji`}</>
                    : 'Prodejte o 31 % rychleji'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <SaveBtn onClick={() => onSave({
        visual_identity: {
          primary_color: primary, secondary_color: secondary, accent_color: accent,
          text_color: textColor, font, logo_url: logoUrl || null, style,
          text_overlay: {
            enabled: olEnabled, position: olPosition, max_chars: olMaxChars, max_lines: olMaxLines,
            uppercase: olUppercase, font_size_ratio: olFontSize, font_weight: olFontWeight,
            bg_style: olBgStyle, bg_opacity: olBgOpacity, text_color: olTextColor,
            accent_color: olAccentColor, padding_ratio: 0.06, highlight_numbers: olHighlightNumbers,
          },
        },
      } as Partial<Project>)} />
    </div>
  );
}

function ColorField({ label, desc, value, onChange }: { label: string; desc: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <p className="text-xs text-slate-500 mb-1.5">{desc}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1a1a2e"
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="w-10 h-10 rounded-lg border border-slate-700" style={{ backgroundColor: value }} />
      </div>
    </div>
  );
}

/* ---- Tab: Chatbot ---- */
function TabChatbot({ project, onSave }: { project: Project; onSave: (fields: Partial<Project>) => void }) {
  const origins = ((project as unknown as Record<string, unknown>).chat_allowed_origins as string[]) || [];
  const [originsText, setOriginsText] = useState(origins.join('\n'));
  const [copied, setCopied] = useState('');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const embedCode = `<script src="${baseUrl}/widget/hugo-chat.js" data-project-id="${project.id}" data-position="right" data-color="#7c3aed"></script>`;
  const chatUrl = `${baseUrl}/chat/${project.id}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const saveOrigins = () => {
    const list = originsText.split('\n').map(s => s.trim()).filter(Boolean);
    onSave({ chat_allowed_origins: list } as unknown as Partial<Project>);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-1">Hugo Chatbot Widget</h3>
        <p className="text-xs text-slate-500 mb-4">
          Vložte chatbota na web projektu. Hugo odpovídá podle KB, komunikačních pravidel a tónu tohoto projektu.
        </p>
      </div>

      {/* Embed code */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Embed kód (vložte na web)</label>
        <div className="relative">
          <pre className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-emerald-400 overflow-x-auto">
            {embedCode}
          </pre>
          <button
            onClick={() => copyToClipboard(embedCode, 'embed')}
            className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            {copied === 'embed' ? '✓ Zkopírováno' : 'Kopírovat'}
          </button>
        </div>
      </div>

      {/* Direct link */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Přímý odkaz na chat</label>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={chatUrl}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300"
          />
          <button
            onClick={() => copyToClipboard(chatUrl, 'url')}
            className="px-3 py-2 rounded-lg bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            {copied === 'url' ? '✓' : 'Kopírovat'}
          </button>
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg bg-violet-600 text-xs text-white hover:bg-violet-500 transition-colors"
          >
            Otevřít
          </a>
        </div>
      </div>

      {/* Allowed origins */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Povolené domény (jedna na řádek)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Pokud je prázdné, chatbot funguje odkudkoliv (dev režim). Pro produkci zadejte domény kde bude widget.
        </p>
        <textarea
          value={originsText}
          onChange={(e) => setOriginsText(e.target.value)}
          placeholder={"https://investczech.cz\nhttps://www.investczech.cz"}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
        <button
          onClick={saveOrigins}
          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> Uložit domény
        </button>
      </div>

      {/* Status */}
      <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
        <h4 className="text-sm font-medium text-white mb-2">Stav chatbotu</h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">API endpoint aktivní</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${origins.length > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-300">
              {origins.length > 0 ? `Omezeno na ${origins.length} domén` : 'Bez omezení domén (dev režim)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Projekt: {project.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
