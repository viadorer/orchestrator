'use client';

import { useEffect, useState } from 'react';
import { Save, Key, Database, Loader2, GitBranch, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface GitHubStatus {
  github_pat_configured: boolean;
  github_auth?: boolean;
  github_user?: string;
  public_repos?: number;
  rate_limit?: { limit: number; remaining: number; resets_at: string };
  test_repo?: { name: string; push_access: boolean; admin_access: boolean };
  error?: string;
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
  const [ghStatus, setGhStatus] = useState<GitHubStatus | null>(null);
  const [ghLoading, setGhLoading] = useState(false);

  const checkGitHub = async () => {
    setGhLoading(true);
    try {
      const res = await fetch('/api/agent/aio/status');
      const data = await res.json() as GitHubStatus;
      setGhStatus(data);
    } catch {
      setGhStatus({ github_pat_configured: false, error: 'Endpoint nedostupný' });
    }
    setGhLoading(false);
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

      {/* GitHub AIO Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-violet-400" /> GitHub AIO Injection
          </h2>
          <button
            onClick={checkGitHub}
            disabled={ghLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${ghLoading ? 'animate-spin' : ''}`} />
            {ghLoading ? 'Testuji...' : 'Otestovat připojení'}
          </button>
        </div>

        {!ghStatus && !ghLoading && (
          <p className="text-xs text-slate-500">Klikni na &quot;Otestovat připojení&quot; pro ověření GitHub PAT a přístupu k repozitářům.</p>
        )}

        {ghStatus && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">GITHUB_PAT</span>
              {ghStatus.github_pat_configured ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Nastaveno</span>
              ) : (
                <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Chybí</span>
              )}
            </div>

            {ghStatus.github_auth !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Autentizace</span>
                {ghStatus.github_auth ? (
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {ghStatus.github_user}</span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Selhala</span>
                )}
              </div>
            )}

            {ghStatus.test_repo && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Repo: {ghStatus.test_repo.name}</span>
                {ghStatus.test_repo.push_access ? (
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Push access</span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Pouze read</span>
                )}
              </div>
            )}

            {ghStatus.rate_limit && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rate limit</span>
                <span className={`${ghStatus.rate_limit.remaining < 100 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {ghStatus.rate_limit.remaining} / {ghStatus.rate_limit.limit}
                </span>
              </div>
            )}

            {ghStatus.error && (
              <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">{ghStatus.error}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500 mt-3">
          GitHub PAT se nastavuje ve Vercel Environment Variables. Potřebný scope: <code className="text-slate-400">repo</code> (write access).
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
