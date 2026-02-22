'use client';

import { useEffect, useState } from 'react';
import { Save, Key, Database, Loader2, GitBranch, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Bot } from 'lucide-react';

interface AioStatus {
  github_pat_configured: boolean;
  github_auth?: boolean;
  github_user?: string;
  github_error?: string;
  rate_limit?: { limit: number; remaining: number; resets_at: string };
  test_repo?: { name: string; push_access: boolean; admin_access: boolean };
  openai_configured: boolean;
  openai_auth?: boolean;
  openai_error?: string;
  perplexity_configured: boolean;
  perplexity_auth?: boolean;
  perplexity_error?: string;
  gemini_configured: boolean;
}

function StatusRow({ label, configured, auth, error, hint }: {
  label: string;
  configured: boolean;
  auth?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-slate-400">{label}</span>
        {!configured ? (
          <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Chybí klíč</span>
        ) : auth === undefined ? (
          <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Nastaveno (neověřeno)</span>
        ) : auth ? (
          <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Funguje</span>
        ) : (
          <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Selhalo</span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-600 mt-0.5">{hint}</p>}
      {error && <p className="text-xs text-red-400/70 mt-0.5">{error}</p>}
    </div>
  );
}

interface PromptTemplate {
  id: string;
  slug: string;
  name: string;
  content: string;
  category: string;
}

export function SettingsView() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [aioStatus, setAioStatus] = useState<AioStatus | null>(null);
  const [aioLoading, setAioLoading] = useState(false);

  const checkAioStatus = async () => {
    setAioLoading(true);
    try {
      const res = await fetch('/api/agent/aio/status');
      const data = await res.json() as AioStatus;
      setAioStatus(data);
    } catch {
      setAioStatus({ github_pat_configured: false, openai_configured: false, perplexity_configured: false, gemini_configured: false });
    }
    setAioLoading(false);
  };

  useEffect(() => {
    fetch('/api/settings/prompts')
      .then(r => r.json())
      .then(data => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startEdit = (t: PromptTemplate) => {
    setEditingId(t.id);
    setEditContent(t.content);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    await fetch(`/api/settings/prompts/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    });
    setTemplates(prev =>
      prev.map(t => t.id === editingId ? { ...t, content: editContent } : t)
    );
    setEditingId(null);
    setSaving(false);
  };

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Nastavení</h1>
        <p className="text-slate-400 mt-1">Konfigurace orchestrátoru</p>
      </div>

      {/* API Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-violet-400" /> API Klíče
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Gemini AI</span>
            <span className="text-emerald-400">Nakonfigurováno</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Supabase</span>
            <span className="text-emerald-400">Nakonfigurováno</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">getLate.dev</span>
            <span className="text-amber-400">Zkontrolujte .env.local</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          API klíče se nastavují v souboru .env.local (nikdy se neukládají do DB).
        </p>
      </div>

      {/* AI Platforms & GitHub Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-400" /> AI Platformy & Integrace
          </h2>
          <button
            onClick={checkAioStatus}
            disabled={aioLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${aioLoading ? 'animate-spin' : ''}`} />
            {aioLoading ? 'Testuji...' : 'Otestovat vše'}
          </button>
        </div>

        {!aioStatus && !aioLoading && (
          <p className="text-xs text-slate-500">Klikni na &quot;Otestovat vše&quot; pro ověření všech API klíčů a připojení.</p>
        )}

        {aioStatus && (
          <div className="space-y-4">
            {/* AI Visibility Platforms */}
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">AI Visibility Monitor</p>
              <div className="space-y-2 text-sm">
                <StatusRow label="Gemini AI" configured={aioStatus.gemini_configured} auth={aioStatus.gemini_configured} hint="Používá GOOGLE_GENERATIVE_AI_API_KEY" />
                <StatusRow label="OpenAI (ChatGPT)" configured={aioStatus.openai_configured} auth={aioStatus.openai_auth} error={aioStatus.openai_error} hint="gpt-4o-mini — měří co model ví z tréninku" />
                <StatusRow label="Perplexity (Sonar)" configured={aioStatus.perplexity_configured} auth={aioStatus.perplexity_auth} error={aioStatus.perplexity_error} hint="Live search — vrací citace a zdroje" />
              </div>
            </div>

            {/* GitHub */}
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">GitHub AIO Injection</p>
              <div className="space-y-2 text-sm">
                <StatusRow label="GITHUB_PAT" configured={aioStatus.github_pat_configured} auth={aioStatus.github_auth} error={aioStatus.github_error} />
                {aioStatus.github_auth && aioStatus.github_user && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Uživatel</span>
                    <span className="text-slate-300">{aioStatus.github_user}</span>
                  </div>
                )}
                {aioStatus.test_repo && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Repo: {aioStatus.test_repo.name}</span>
                    {aioStatus.test_repo.push_access ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Push access</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Pouze read</span>
                    )}
                  </div>
                )}
                {aioStatus.rate_limit && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rate limit</span>
                    <span className={`${aioStatus.rate_limit.remaining < 100 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {aioStatus.rate_limit.remaining} / {aioStatus.rate_limit.limit}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-3">
          Klíče se nastavují ve Vercel Environment Variables: <code className="text-slate-400">OPENAI_API_KEY</code>, <code className="text-slate-400">PERPLEXITY_API_KEY</code>, <code className="text-slate-400">GITHUB_PAT</code>
        </p>
      </div>

      {/* Prompt Templates */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-violet-400" /> Prompt šablony (Lego systém)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Tyto šablony se skládají do finálního promptu pro Huga. Změna zde ovlivní generování pro VŠECHNY projekty.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map(t => (
              <div key={t.id} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{t.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs text-slate-400">{t.category}</span>
                  </div>
                  {editingId !== t.id && (
                    <button
                      onClick={() => startEdit(t)}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Upravit
                    </button>
                  )}
                </div>

                {editingId === t.id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Zrušit
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        {saving ? 'Ukládám...' : 'Uložit'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                    {t.content}
                  </pre>
                )}
              </div>
            ))}

            {templates.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                Žádné šablony. Spusťte SQL migraci pro vytvoření výchozích šablon.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
