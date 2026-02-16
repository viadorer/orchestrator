'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, Loader2, TrendingUp, Shield, MessageSquare, CheckCircle2, Copy, Check } from 'lucide-react';

interface DigestSuggestion {
  type: 'guardrail' | 'communication' | 'topic_boundary' | 'quality_criteria';
  title: string;
  content: string;
  reason: string;
  examples: string[];
  confidence: number;
}

interface DigestData {
  project_name: string;
  period_days: number;
  total_edits: number;
  suggestions: DigestSuggestion[];
  message?: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  guardrail: Shield,
  communication: MessageSquare,
  topic_boundary: TrendingUp,
  quality_criteria: CheckCircle2,
};

const TYPE_COLORS: Record<string, string> = {
  guardrail: 'bg-red-500/10 text-red-400 border-red-500/20',
  communication: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  topic_boundary: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  quality_criteria: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const TYPE_LABELS: Record<string, string> = {
  guardrail: 'Guardrail',
  communication: 'Komunikace',
  topic_boundary: 'Téma',
  quality_criteria: 'Kvalita',
};

export function FeedbackDigestPanel({ projectId }: { projectId: string }) {
  const [data, setData] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadDigest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/feedback-digest?projectId=${projectId}&days=${days}`);
      const d = await res.json();
      setData(d);
    } catch {
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (projectId) loadDigest();
  }, [projectId, days]);

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-slate-500 py-8">
        Nepodařilo se načíst feedback digest
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Feedback Digest
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              AI analyzuje admin edity a navrhuje úpravy promptů
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="7">Posledních 7 dní</option>
              <option value="14">Posledních 14 dní</option>
              <option value="30">Posledních 30 dní</option>
            </select>
            <button
              onClick={loadDigest}
              className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors"
            >
              Aktualizovat
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-500">Projekt:</span>
            <span className="text-white ml-2 font-medium">{data.project_name}</span>
          </div>
          <div>
            <span className="text-slate-500">Admin edity:</span>
            <span className="text-white ml-2 font-medium">{data.total_edits}</span>
          </div>
          <div>
            <span className="text-slate-500">Návrhy:</span>
            <span className="text-white ml-2 font-medium">{data.suggestions.length}</span>
          </div>
        </div>
      </div>

      {/* No edits message */}
      {data.total_edits === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <Lightbulb className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-white mb-1">Žádné admin edity</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {data.message || 'Za toto období nebyly provedeny žádné úpravy postů.'}
          </p>
        </div>
      )}

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="space-y-3">
          {data.suggestions.map((suggestion, i) => {
            const Icon = TYPE_ICONS[suggestion.type] || Lightbulb;
            const colorClass = TYPE_COLORS[suggestion.type] || 'bg-slate-800 text-slate-400';
            const typeLabel = TYPE_LABELS[suggestion.type] || suggestion.type;
            const suggestionId = `${suggestion.type}-${i}`;

            return (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg border ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-white">{suggestion.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colorClass} border-0`}>
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {suggestion.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs font-bold text-white">
                          {Math.round(suggestion.confidence * 100)}%
                        </div>
                        <div className="text-[10px] text-slate-500">confidence</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(suggestion.content, suggestionId)}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Kopírovat prompt"
                      >
                        {copiedId === suggestionId ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 bg-slate-800/30">
                  <div className="mb-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                      Navržený prompt
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                      <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                        {suggestion.content}
                      </pre>
                    </div>
                  </div>

                  {/* Examples */}
                  {suggestion.examples.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                        Příklady z editů
                      </div>
                      <div className="space-y-1.5">
                        {suggestion.examples.map((example, j) => (
                          <div
                            key={j}
                            className="text-xs text-slate-400 bg-slate-900/50 rounded px-2 py-1.5 border border-slate-800"
                          >
                            "{example}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-3 bg-slate-800/50 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      // TODO: Implement "Apply to project" - create new prompt template
                      alert('Funkce "Aplikovat" bude implementována - vytvoří nový prompt template');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 transition-colors"
                  >
                    Aplikovat na projekt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No suggestions but edits exist */}
      {data.total_edits > 0 && data.suggestions.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-white mb-1">Žádné jasné vzory</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            AI nenašla opakující se vzory v admin editacích. Zkuste delší období nebo počkejte na více editů.
          </p>
        </div>
      )}
    </div>
  );
}
