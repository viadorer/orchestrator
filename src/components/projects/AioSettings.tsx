'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Save, Plus, Trash2, RefreshCw, GitBranch, Globe, Search, TrendingUp,
  AlertCircle, CheckCircle2, Clock, Eye, MessageSquare, Zap,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type SiteType = 'html' | 'nextjs' | 'astro' | 'hugo' | 'sveltekit';

interface AioSite {
  id: string;
  project_id: string;
  github_repo: string;
  github_branch: string;
  html_files: string[];
  schema_types: string[];
  is_active: boolean;
  entity_name: string | null;
  entity_description: string | null;
  same_as_urls: string[];
  last_injected_at: string | null;
  last_commit_sha: string | null;
  site_type: SiteType;
  layout_file: string | null;
  public_dir: string;
  last_rollback_sha: string | null;
}

interface AioEntityProfile {
  id: string;
  project_id: string;
  official_name: string;
  short_description: string | null;
  long_description: string | null;
  category: string | null;
  same_as: unknown;
  keywords: string[];
  wikidata_id: string | null;
  website_url: string | null;
  last_audit_at: string | null;
}

interface WikidataResult {
  id: string;
  label: string;
  description: string;
  url: string;
}

interface AioPrompt {
  id: string;
  project_id: string;
  prompt: string;
  category: string | null;
  is_active: boolean;
  last_tested_at: string | null;
}

interface AioScore {
  id: string;
  project_id: string;
  score_date: string;
  visibility_score: number;
  share_of_voice: number;
  citation_rate: number;
  prompts_tested: number;
  prompts_with_brand: number;
  prompts_with_citation: number;
  top_competitors: Array<{ name: string; count: number }>;
  platforms_breakdown: Record<string, { tested: number; mentioned: number; cited: number }>;
}

interface AioAudit {
  id: string;
  prompt: string;
  platform: string;
  brand_mentioned: boolean;
  brand_position: number | null;
  brand_context: string | null;
  is_source: boolean;
  citation_url: string | null;
  citation_urls: string[];
  search_results: Array<{ title: string; url: string; date?: string }>;
  sentiment: string | null;
  competitors_mentioned: string[];
  created_at: string;
}

const SITE_TYPES: Array<{ id: SiteType; label: string; desc: string }> = [
  { id: 'html', label: 'Static HTML', desc: 'GitHub Pages, Netlify static' },
  { id: 'nextjs', label: 'Next.js', desc: 'App Router / Pages Router (Vercel, Railway)' },
  { id: 'astro', label: 'Astro', desc: 'Astro framework' },
  { id: 'hugo', label: 'Hugo', desc: 'Hugo static site generator' },
  { id: 'sveltekit', label: 'SvelteKit', desc: 'SvelteKit framework' },
];

const SCHEMA_TYPES = ['FAQ', 'Organization', 'Dataset', 'HowTo', 'WebPage'] as const;
const PROMPT_CATEGORIES = ['how_to', 'pricing', 'recommendation', 'comparison', 'purchase_intent'] as const;
const ENTITY_CATEGORIES = ['software', 'service', 'information', 'community', 'product'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  how_to: 'Jak na to',
  pricing: 'Ceny',
  recommendation: 'Doporučení',
  comparison: 'Porovnání',
  purchase_intent: 'Nákupní záměr',
};

function getSchemaTypeHelp(type: string): string {
  const help: Record<string, string> = {
    FAQ: 'Otázky a odpovědi — AI použije jako zdroj pro FAQ dotazy',
    Organization: 'Firma/značka — základní info o entitě (název, popis, sameAs)',
    Dataset: 'Datové body — ceny, statistiky, trendy (pro AI citace čísel)',
    HowTo: 'Návody krok za krokem — AI použije pro "jak na to" dotazy',
    WebPage: 'Základní metadata stránky — about, mentions, datePublished',
  };
  return help[type] || type;
}

// ============================================
// Tab: GitHub Repo (AIO Site)
// ============================================

export function TabAioSite({ projectId }: { projectId: string }) {
  const [site, setSite] = useState<AioSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [htmlFiles, setHtmlFiles] = useState('index.html');
  const [schemaTypes, setSchemaTypes] = useState<string[]>(['FAQ', 'Organization']);
  const [isActive, setIsActive] = useState(true);
  const [entityName, setEntityName] = useState('');
  const [entityDesc, setEntityDesc] = useState('');
  const [sameAsUrls, setSameAsUrls] = useState('');
  const [siteType, setSiteType] = useState<SiteType>('html');
  const [layoutFile, setLayoutFile] = useState('');
  const [publicDir, setPublicDir] = useState('');
  const [detecting, setDetecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/agent/aio?projectId=${projectId}`);
    const data = await res.json();
    const sites = (data.sites || []) as AioSite[];
    const s = sites.find((x: AioSite) => x.project_id === projectId) || null;
    if (s) {
      setSite(s);
      setRepo(s.github_repo);
      setBranch(s.github_branch);
      setHtmlFiles((s.html_files || []).join(', '));
      setSchemaTypes(s.schema_types || ['FAQ', 'Organization']);
      setIsActive(s.is_active);
      setEntityName(s.entity_name || '');
      setEntityDesc(s.entity_description || '');
      setSameAsUrls((s.same_as_urls || []).join('\n'));
      setSiteType(s.site_type || 'html');
      setLayoutFile(s.layout_file || '');
      setPublicDir(s.public_dir || '');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const body = {
      project_id: projectId,
      github_repo: repo,
      github_branch: branch,
      html_files: htmlFiles.split(',').map((f) => f.trim()).filter(Boolean),
      schema_types: schemaTypes,
      is_active: isActive,
      entity_name: entityName || null,
      entity_description: entityDesc || null,
      same_as_urls: sameAsUrls.split('\n').map((u) => u.trim()).filter(Boolean),
      site_type: siteType,
      layout_file: layoutFile || null,
      public_dir: publicDir,
    };

    await fetch('/api/agent/aio/site', {
      method: site ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site ? { ...body, id: site.id } : body),
    });
    await load();
    setSaving(false);
  };

  const triggerInject = async () => {
    setSaving(true);
    await fetch('/api/agent/aio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    await load();
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-slate-700">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-violet-400" />
          <div>
            <div className="text-sm font-medium text-white">GitHub Repozitář</div>
            <div className="text-xs text-slate-400">
              {site ? `${site.github_repo} (${site.github_branch})` : 'Nepropojeno'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {site?.last_injected_at && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(site.last_injected_at).toLocaleDateString('cs-CZ')}
            </span>
          )}
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-600'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Project type */}
      <div className="max-w-2xl">
        <label className="block text-sm font-medium text-slate-300 mb-2">Typ projektu</label>
        <div className="flex flex-wrap gap-2">
          {SITE_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSiteType(t.id);
                if (t.id === 'nextjs') { setPublicDir('public'); setLayoutFile(''); }
                else if (t.id === 'astro') { setPublicDir('public'); setLayoutFile(''); }
                else if (t.id === 'hugo') { setPublicDir('static'); setLayoutFile('layouts/_default/baseof.html'); }
                else if (t.id === 'sveltekit') { setPublicDir('static'); setLayoutFile('src/app.html'); }
                else { setPublicDir(''); setLayoutFile(''); }
              }}
              title={t.desc}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                siteType === t.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
          {repo && (
            <button
              onClick={async () => {
                setDetecting(true);
                try {
                  const res = await fetch(`/api/agent/aio/detect?repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`);
                  if (res.ok) {
                    const d = await res.json() as { siteType: SiteType; layoutFile: string | null; publicDir: string };
                    setSiteType(d.siteType);
                    setLayoutFile(d.layoutFile || '');
                    setPublicDir(d.publicDir);
                  }
                } finally { setDetecting(false); }
              }}
              disabled={detecting || !repo}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 transition-colors disabled:opacity-50"
            >
              {detecting ? 'Detekuji...' : 'Auto-detect'}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {siteType === 'html' && 'Statický web — schema se injektuje přímo do HTML souborů'}
          {siteType === 'nextjs' && 'Next.js — schema se injektuje do layout.tsx, statické soubory do /public'}
          {siteType === 'astro' && 'Astro — schema se injektuje do Layout.astro, statické soubory do /public'}
          {siteType === 'hugo' && 'Hugo — schema do baseof.html, statické soubory do /static'}
          {siteType === 'sveltekit' && 'SvelteKit — schema do app.html, statické soubory do /static'}
        </p>
      </div>

      {/* Layout file + public dir (for dynamic projects) */}
      {siteType !== 'html' && (
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Layout soubor</label>
            <input
              value={layoutFile}
              onChange={(e) => setLayoutFile(e.target.value)}
              placeholder={siteType === 'nextjs' ? 'src/app/layout.tsx' : siteType === 'astro' ? 'src/layouts/Layout.astro' : 'layouts/_default/baseof.html'}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">Soubor kam se injektuje JSON-LD schema (mezi markery)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Public adresář</label>
            <input
              value={publicDir}
              onChange={(e) => setPublicDir(e.target.value)}
              placeholder={siteType === 'hugo' || siteType === 'sveltekit' ? 'static' : 'public'}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">Kam se zapíše llms.txt a ai-data.json</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {/* GitHub repo */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">GitHub Repo</label>
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="viadorer/odhad-online"
            title="Formát: username/repository (např. viadorer/odhad-online)"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">Formát: <code className="text-slate-400">username/repository</code> — musíš mít write přístup přes GITHUB_PAT</p>
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Branch</label>
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            title="Název větve (main, master, gh-pages...)"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">Většinou <code className="text-slate-400">main</code> nebo <code className="text-slate-400">gh-pages</code></p>
        </div>
      </div>

      {/* HTML files */}
      <div className="max-w-2xl">
        <label className="block text-sm font-medium text-slate-300 mb-1.5">HTML soubory (čárkou)</label>
        <input
          value={htmlFiles}
          onChange={(e) => setHtmlFiles(e.target.value)}
          placeholder="index.html, about.html, kontakt.html"
          title="Seznam HTML souborů oddělených čárkou"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
        />
        <p className="text-xs text-slate-500 mt-1">Soubory do kterých se injektuje JSON-LD schema do <code className="text-slate-400">&lt;head&gt;</code>. Orchestrator automaticky vytvoří <code className="text-slate-400">llms.txt</code> a <code className="text-slate-400">ai-data.json</code> v rootu.</p>
      </div>

      {/* Schema types */}
      <div className="max-w-2xl">
        <label className="block text-sm font-medium text-slate-300 mb-2">Schema typy</label>
        <div className="flex flex-wrap gap-2">
          {SCHEMA_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setSchemaTypes((prev) =>
                prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
              )}
              title={getSchemaTypeHelp(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                schemaTypes.includes(t)
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">FAQ = otázky/odpovědi, Organization = firma/značka, Dataset = datové body (ceny, statistiky), HowTo = návody, WebPage = základní metadata stránky. Detaily entity vyplň v Entity tabu.</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 max-w-2xl">
        <button
          onClick={save}
          disabled={!repo || saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" /> {saving ? 'Ukládám...' : 'Uložit'}
        </button>
        {site && (
          <button
            onClick={triggerInject}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            <Zap className="w-4 h-4" /> Spustit AIO Injection
          </button>
        )}
      </div>

      {/* Last injection info */}
      {site?.last_commit_sha && (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 max-w-2xl">
          <div className="text-xs text-slate-500">
            Poslední commit: <span className="font-mono text-slate-400">{site.last_commit_sha.substring(0, 7)}</span>
            {site.last_injected_at && (
              <> • {new Date(site.last_injected_at).toLocaleString('cs-CZ')}</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Tab: Entity Profile
// ============================================

export function TabAioEntity({ projectId }: { projectId: string }) {
  const [entity, setEntity] = useState<AioEntityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [category, setCategory] = useState('software');
  const [keywords, setKeywords] = useState('');
  const [sameAs, setSameAs] = useState('');
  const [wikidataId, setWikidataId] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [wdSearching, setWdSearching] = useState(false);
  const [wdResults, setWdResults] = useState<WikidataResult[]>([]);
  const [wdQuery, setWdQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/agent/aio?projectId=${projectId}`);
    const data = await res.json();
    const entities = (data.entities || []) as AioEntityProfile[];
    const e = entities.find((x: AioEntityProfile) => x.project_id === projectId) || null;
    if (e) {
      setEntity(e);
      setName(e.official_name);
      setShortDesc(e.short_description || '');
      setLongDesc(e.long_description || '');
      setCategory(e.category || 'software');
      setKeywords((e.keywords || []).join(', '));
      const sameAsArr = Array.isArray(e.same_as) ? e.same_as : [];
      setSameAs((sameAsArr as string[]).join('\n'));
      setWikidataId(e.wikidata_id || '');
      setWebsiteUrl(e.website_url || '');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const body = {
      project_id: projectId,
      official_name: name,
      short_description: shortDesc || null,
      long_description: longDesc || null,
      category,
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      same_as: JSON.stringify(sameAs.split('\n').map((u) => u.trim()).filter(Boolean)),
      wikidata_id: wikidataId || null,
      website_url: websiteUrl || null,
    };

    await fetch('/api/agent/aio/entity', {
      method: entity ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entity ? { ...body, id: entity.id } : body),
    });
    await load();
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700">
        <Globe className="w-5 h-5 text-cyan-400" />
        <div>
          <div className="text-sm font-medium text-white">Entity Profil</div>
          <div className="text-xs text-slate-400">Konzistentní identita značky pro AI vyhledávače</div>
        </div>
        {entity && (
          <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Nastaveno
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Oficiální název</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="odhad.online"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <p className="text-xs text-slate-500 mt-1">Přesně tak, jak má AI tuto značku nazývat</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Krátký popis (1-2 věty)</label>
        <textarea
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          placeholder="Online odhad tržní ceny nemovitosti v ČR na základě dat z katastru."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Dlouhý popis (pro schema.org)</label>
        <textarea
          value={longDesc}
          onChange={(e) => setLongDesc(e.target.value)}
          placeholder="Podrobný popis služby, co dělá, pro koho, jak funguje..."
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Kategorie</label>
        <div className="flex flex-wrap gap-2">
          {ENTITY_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                category === c ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Klíčová slova (čárkou)</label>
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="odhad nemovitosti, cena bytu, tržní cena, katastr"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <p className="text-xs text-slate-500 mt-1">Používá se pro keyword overlap v citační síti a schema generování</p>
      </div>

      {/* Website URL */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">URL webu</label>
        <input
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://odhad.online"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
        />
        <p className="text-xs text-slate-500 mt-1">Hlavní URL webu — používá se pro Organization schema a matching citací v auditech</p>
      </div>

      {/* Wikidata */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">Wikidata</span>
          {wikidataId && (
            <a
              href={`https://www.wikidata.org/wiki/${wikidataId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {wikidataId}
            </a>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Wikidata jsou zdrojem pravdy pro AI modely. Pokud má vaše značka záznam na Wikidatech, AI ji vnímá jako oficiální entitu.
        </p>

        <div className="flex gap-2">
          <input
            value={wdQuery}
            onChange={(e) => setWdQuery(e.target.value)}
            placeholder={name || 'Hledat na Wikidata...'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setWdSearching(true);
                fetch(`/api/agent/aio/wikidata?action=search&q=${encodeURIComponent(wdQuery || name)}`)
                  .then(r => r.json())
                  .then(d => { setWdResults((d.results || []) as WikidataResult[]); setWdSearching(false); })
                  .catch(() => setWdSearching(false));
              }
            }}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={() => {
              setWdSearching(true);
              fetch(`/api/agent/aio/wikidata?action=search&q=${encodeURIComponent(wdQuery || name)}`)
                .then(r => r.json())
                .then(d => { setWdResults((d.results || []) as WikidataResult[]); setWdSearching(false); })
                .catch(() => setWdSearching(false));
            }}
            disabled={wdSearching || (!wdQuery && !name)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-300 text-sm font-medium hover:bg-cyan-600/30 disabled:opacity-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            {wdSearching ? 'Hledám...' : 'Hledat'}
          </button>
        </div>

        {wdResults.length > 0 && (
          <div className="space-y-1">
            {wdResults.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setWikidataId(r.id);
                  const wdUrl = `https://www.wikidata.org/wiki/${r.id}`;
                  const currentUrls = sameAs.split('\n').map(u => u.trim()).filter(Boolean);
                  if (!currentUrls.some(u => u.includes('wikidata.org'))) {
                    setSameAs([...currentUrls, wdUrl].join('\n'));
                  } else {
                    setSameAs(currentUrls.map(u => u.includes('wikidata.org') ? wdUrl : u).join('\n'));
                  }
                  setWdResults([]);
                }}
                className={`w-full text-left p-2 rounded-lg hover:bg-slate-700 transition-colors ${
                  wikidataId === r.id ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400">{r.id}</span>
                  <span className="text-sm text-white">{r.label}</span>
                </div>
                {r.description && <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>}
              </button>
            ))}
          </div>
        )}

        {wdResults.length === 0 && wdQuery && !wdSearching && (
          <p className="text-xs text-slate-500">Nic nenalezeno. Zvažte vytvoření záznamu na <a href="https://www.wikidata.org/wiki/Special:NewItem" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">wikidata.org</a>.</p>
        )}

        <div>
          <label className="block text-xs text-slate-500 mb-1">Wikidata ID (ručně)</label>
          <input
            value={wikidataId}
            onChange={(e) => setWikidataId(e.target.value)}
            placeholder="Q12345"
            className="w-full px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
          />
        </div>
      </div>

      {/* sameAs URLs */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">sameAs URLs (po řádcích)</label>
        <textarea
          value={sameAs}
          onChange={(e) => setSameAs(e.target.value)}
          placeholder={"https://www.wikidata.org/wiki/Q12345\nhttps://firmy.cz/...\nhttps://linkedin.com/company/..."}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
        />
        <p className="text-xs text-slate-500 mt-1">Wikidata URL se přidá automaticky při výběru entity. Doplňte LinkedIn, Firmy.cz, ARES.</p>
      </div>

      <button
        onClick={save}
        disabled={!name || saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
      >
        <Save className="w-4 h-4" /> {saving ? 'Ukládám...' : 'Uložit profil'}
      </button>
    </div>
  );
}

// ============================================
// Tab: AIO Prompts (Visibility Test Prompts)
// ============================================

export function TabAioPrompts({ projectId }: { projectId: string }) {
  const [prompts, setPrompts] = useState<AioPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New prompt form
  const [newPrompt, setNewPrompt] = useState('');
  const [newCategory, setNewCategory] = useState('how_to');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/agent/aio/prompts?projectId=${projectId}`);
    const data = await res.json();
    setPrompts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const addPrompt = async () => {
    if (!newPrompt.trim()) return;
    setSaving(true);
    await fetch('/api/agent/aio/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, prompt: newPrompt.trim(), category: newCategory }),
    });
    setNewPrompt('');
    await load();
    setSaving(false);
  };

  const deletePrompt = async (id: string) => {
    await fetch(`/api/agent/aio/prompts?id=${id}`, { method: 'DELETE' });
    await load();
  };

  const togglePrompt = async (id: string, isActive: boolean) => {
    await fetch('/api/agent/aio/prompts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !isActive }),
    });
    await load();
  };

  const triggerAudit = async () => {
    setSaving(true);
    await fetch('/api/agent/aio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'audit', projectId }),
    });
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-sm font-medium text-white">Testovací prompty pro AI Visibility</div>
            <div className="text-xs text-slate-400">{prompts.length} promptů • {prompts.filter((p) => p.is_active).length} aktivních</div>
          </div>
        </div>
        <button
          onClick={triggerAudit}
          disabled={saving || prompts.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-50 transition-colors"
        >
          <Eye className="w-4 h-4" /> {saving ? 'Spouštím...' : 'Spustit audit'}
        </button>
      </div>

      {/* Add new prompt */}
      <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
        <div className="flex gap-2">
          <input
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Jak zjistím cenu nemovitosti v ČR?"
            onKeyDown={(e) => e.key === 'Enter' && addPrompt()}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {PROMPT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
          <button
            onClick={addPrompt}
            disabled={!newPrompt.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Přidat
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Prompty které AI uživatel typicky zadá. Orchestrator je testuje v ChatGPT, Perplexity a Gemini a měří jestli se vaše značka objeví v odpovědi.
        </p>
      </div>

      {/* Prompt list */}
      <div className="space-y-2">
        {prompts.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              p.is_active
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-slate-900/50 border-slate-800 opacity-60'
            }`}
          >
            <button
              onClick={() => togglePrompt(p.id, p.is_active)}
              className={`w-2 h-2 rounded-full flex-shrink-0 ${p.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`}
              title={p.is_active ? 'Aktivní' : 'Neaktivní'}
            />
            <MessageSquare className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-white flex-1">{p.prompt}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
              {CATEGORY_LABELS[p.category || ''] || p.category}
            </span>
            {p.last_tested_at && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(p.last_tested_at).toLocaleDateString('cs-CZ')}
              </span>
            )}
            <button
              onClick={() => deletePrompt(p.id)}
              className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {prompts.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            Zatím žádné prompty. Přidejte dotazy které vaši zákazníci zadávají do AI vyhledávačů.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Tab: Visibility Scores Dashboard
// ============================================

export function TabAioScores({ projectId }: { projectId: string }) {
  const [scores, setScores] = useState<AioScore[]>([]);
  const [audits, setAudits] = useState<AioAudit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/agent/aio?projectId=${projectId}`);
    const data = await res.json();
    setScores((data.scores || []) as AioScore[]);

    // Load recent audits
    const auditsRes = await fetch(`/api/agent/aio/audits?projectId=${projectId}&limit=20`);
    if (auditsRes.ok) {
      const auditsData = await auditsRes.json();
      setAudits(Array.isArray(auditsData) ? auditsData : []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" /></div>;
  }

  const latestScore = scores[0] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        <div>
          <div className="text-sm font-medium text-white">AI Visibility Score</div>
          <div className="text-xs text-slate-400">Jak viditelná je vaše značka v AI vyhledávačích</div>
        </div>
        <button
          onClick={load}
          className="ml-auto p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {latestScore ? (
        <>
          {/* Score cards */}
          <div className="grid grid-cols-5 gap-3">
            <ScoreCard
              label="Visibility Score"
              value={`${latestScore.visibility_score}`}
              suffix="/100"
              color={latestScore.visibility_score >= 50 ? 'emerald' : latestScore.visibility_score >= 25 ? 'amber' : 'red'}
            />
            <ScoreCard
              label="Share of Voice"
              value={`${latestScore.share_of_voice}%`}
              color={latestScore.share_of_voice >= 50 ? 'emerald' : latestScore.share_of_voice >= 25 ? 'amber' : 'red'}
            />
            <ScoreCard
              label="Citation Rate"
              value={`${latestScore.citation_rate || 0}%`}
              color={(latestScore.citation_rate || 0) > 0 ? 'cyan' : 'red'}
            />
            <ScoreCard
              label="Zmíněno"
              value={`${latestScore.prompts_with_brand}/${latestScore.prompts_tested}`}
              color={latestScore.prompts_with_brand > 0 ? 'emerald' : 'red'}
            />
            <ScoreCard
              label="Citováno"
              value={`${latestScore.prompts_with_citation || 0}/${latestScore.prompts_tested}`}
              color={(latestScore.prompts_with_citation || 0) > 0 ? 'cyan' : 'red'}
            />
          </div>

          {/* Platform breakdown */}
          {latestScore.platforms_breakdown && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Platformy</h4>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(latestScore.platforms_breakdown).map(([platform, data]) => {
                  const mentionPct = data.tested > 0 ? Math.round((data.mentioned / data.tested) * 100) : 0;
                  const citePct = data.tested > 0 ? Math.round(((data.cited || 0) / data.tested) * 100) : 0;
                  return (
                    <div key={platform} className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="text-xs font-medium text-slate-400 capitalize mb-2">{platform}</div>
                      <div className="flex items-end gap-3">
                        <div>
                          <div className="text-lg font-bold text-white">{mentionPct}%</div>
                          <div className="text-xs text-slate-500">{data.mentioned}/{data.tested} zmíněno</div>
                        </div>
                        {(data.cited || 0) > 0 && (
                          <div>
                            <div className="text-lg font-bold text-cyan-400">{citePct}%</div>
                            <div className="text-xs text-cyan-500/70">{data.cited}/{data.tested} citováno</div>
                          </div>
                        )}
                      </div>
                      {data.tested > 0 && (
                        <div className="mt-2 flex gap-1">
                          <div className="h-1.5 rounded-full bg-emerald-500/30 flex-1">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${mentionPct}%` }} />
                          </div>
                          <div className="h-1.5 rounded-full bg-cyan-500/30 flex-1">
                            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${citePct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top competitors */}
          {latestScore.top_competitors && latestScore.top_competitors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Top konkurenti v AI odpovědích</h4>
              <div className="flex flex-wrap gap-2">
                {latestScore.top_competitors.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                    {c.name} ({c.count}×)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Score history */}
          {scores.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Historie</h4>
              <div className="space-y-1">
                {scores.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500 w-20">{s.score_date}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${s.visibility_score}%` }}
                      />
                    </div>
                    <span className="text-slate-400 w-12 text-right">{s.visibility_score}</span>
                    <span className="text-slate-500 w-16 text-right">{s.share_of_voice}% SoV</span>
                    {(s.citation_rate || 0) > 0 && (
                      <span className="text-cyan-400 w-16 text-right">{s.citation_rate}% cit</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Zatím žádná data.</p>
          <p className="text-slate-500 text-xs mt-1">Přidejte testovací prompty a spusťte audit.</p>
        </div>
      )}

      {/* Recent audits */}
      {audits.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Poslední audit výsledky</h4>
          <div className="space-y-2">
            {audits.slice(0, 15).map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3 text-xs">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.brand_mentioned ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-slate-300 flex-1 truncate text-sm">{a.prompt}</span>
                  <span className="text-slate-500 capitalize">{a.platform}</span>
                  {a.brand_position && (
                    <span className="text-amber-400">#{a.brand_position}</span>
                  )}
                  {a.is_source && (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">citováno</span>
                  )}
                  {a.sentiment && (
                    <span className={`px-1.5 py-0.5 rounded ${
                      a.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                      a.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {a.sentiment}
                    </span>
                  )}
                </div>
                {a.brand_context && (
                  <p className="text-xs text-slate-400 mt-1.5 pl-5 italic">&ldquo;{a.brand_context}&rdquo;</p>
                )}
                {a.citation_urls && a.citation_urls.length > 0 && (
                  <div className="mt-1.5 pl-5 flex flex-wrap gap-1">
                    {a.citation_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 truncate max-w-xs">
                        {url.replace(/^https?:\/\//, '').substring(0, 50)}
                      </a>
                    ))}
                  </div>
                )}
                {a.search_results && a.search_results.length > 0 && !a.citation_urls?.length && (
                  <div className="mt-1.5 pl-5">
                    <span className="text-xs text-slate-500">Nalezeno v search: </span>
                    {a.search_results.slice(0, 3).map((sr, i) => (
                      <a key={i} href={sr.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-slate-300 mr-2">
                        {sr.title?.substring(0, 40) || sr.url.replace(/^https?:\/\//, '').substring(0, 30)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, suffix, color }: {
  label: string;
  value: string;
  suffix?: string;
  color: 'emerald' | 'amber' | 'red' | 'violet' | 'cyan';
}) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]}`}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-bold">
        {value}
        {suffix && <span className="text-sm font-normal text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}
