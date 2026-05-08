'use client';

import { useEffect, useState } from 'react';
import {
  ClipboardCheck, Send, AlertTriangle, CheckCircle2, XCircle,
  Clock, Sparkles, ChevronRight, RefreshCw,
} from 'lucide-react';

interface QueueItem {
  id: string;
  project_id: string;
  target_platform: string | null;
  text_content: string;
  scheduled_for?: string | null;
  created_at?: string;
  updated_at?: string;
  projects?: { name: string; slug: string } | null;
}

interface ErrorItem {
  id: string;
  details: { source?: string; message?: string; entity_id?: string } | null;
  created_at: string;
}

interface BriefData {
  timestamp: string;
  counts: {
    review: number;
    scheduled_today: number;
    failed_24h: number;
    errors_24h: number;
    orphans: number;
  };
  review_queue: QueueItem[];
  scheduled_today: QueueItem[];
  failed_recent: QueueItem[];
  orphans: Array<QueueItem & { sent_at: string; late_post_id: string }>;
  errors_by_source: Record<string, number>;
  errors_recent: ErrorItem[];
  cron: {
    healthy: boolean;
    last_run: string | null;
  };
  projects: Array<{ id: string; name: string; orchestrator_enabled: boolean }>;
}

export function DailyBriefView() {
  const [data, setData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/daily-brief');
      if (res.ok) setData(await res.json());
    } catch { /* swallow — UI shows empty state */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: view }));
  };

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="text-slate-500 text-sm">Načítám denní přehled…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-slate-500 text-sm">Nepodařilo se načíst data.</div>
        <button onClick={load} className="mt-3 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm">Zkusit znovu</button>
      </div>
    );
  }

  const greeting = getGreeting();
  const hasIssues =
    data.counts.failed_24h > 0 ||
    data.counts.errors_24h > 0 ||
    data.counts.orphans > 0 ||
    !data.cron.healthy;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {formatPragueDate(new Date(data.timestamp))} • {data.projects.length} aktivních projektů
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition"
          title="Obnovit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Obnovit
        </button>
      </div>

      {/* Health banner */}
      {hasIssues ? (
        <div className="bg-amber-950/40 border border-amber-700/40 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-200 mb-1">Něco vyžaduje pozornost</p>
            <ul className="text-amber-300/80 space-y-0.5">
              {data.counts.failed_24h > 0 && (
                <li>• {data.counts.failed_24h}× selhal post za posledních 24h</li>
              )}
              {data.counts.errors_24h > 0 && (
                <li>• {data.counts.errors_24h} chyb v systému (zdroje: {Object.keys(data.errors_by_source).join(', ')})</li>
              )}
              {data.counts.orphans > 0 && (
                <li>• {data.counts.orphans}× post v limbu — odeslán do getLate, ale potvrzení nedorazilo (ověř ručně v dashboardu)</li>
              )}
              {!data.cron.healthy && (
                <li>• Cron Hugo neproběhl v posledních 90 minutách (poslední: {data.cron.last_run ? formatRelative(new Date(data.cron.last_run)) : 'nikdy'})</li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/30 border border-emerald-700/30 rounded-xl p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-emerald-200">Vše v pořádku</p>
            <p className="text-emerald-300/70 mt-0.5">Žádné chyby, cron běží.</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Čeká na schválení"
          value={data.counts.review}
          icon={ClipboardCheck}
          color="violet"
          onClick={() => navigate('review')}
        />
        <StatCard
          label="Plánováno dnes"
          value={data.counts.scheduled_today}
          icon={Send}
          color="sky"
          onClick={() => navigate('publish')}
        />
        <StatCard
          label="Selhalo (24h)"
          value={data.counts.failed_24h}
          icon={XCircle}
          color={data.counts.failed_24h > 0 ? 'red' : 'slate'}
          onClick={() => navigate('publish')}
        />
        <StatCard
          label="Chyb (24h)"
          value={data.counts.errors_24h}
          icon={AlertTriangle}
          color={data.counts.errors_24h > 0 ? 'amber' : 'slate'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Review queue */}
        <Section
          title="Čeká na schválení"
          icon={ClipboardCheck}
          count={data.counts.review}
          actionLabel="Otevřít Review"
          onAction={() => navigate('review')}
          empty={data.review_queue.length === 0 ? 'Žádné posty nečekají na schválení 🎉' : undefined}
        >
          {data.review_queue.slice(0, 5).map(p => (
            <PostRow key={p.id} item={p} muted />
          ))}
        </Section>

        {/* Scheduled today */}
        <Section
          title="Naplánováno dnes"
          icon={Send}
          count={data.counts.scheduled_today}
          actionLabel="Otevřít Kalendář"
          onAction={() => navigate('calendar')}
          empty={data.scheduled_today.length === 0 ? 'Dnes nic naplánováno' : undefined}
        >
          {data.scheduled_today.slice(0, 5).map(p => (
            <PostRow key={p.id} item={p} time={p.scheduled_for} />
          ))}
        </Section>

        {/* Failed posts */}
        {data.counts.failed_24h > 0 && (
          <Section title="Nedávno selhalo" icon={XCircle} count={data.counts.failed_24h}>
            {data.failed_recent.slice(0, 5).map(p => (
              <PostRow key={p.id} item={p} time={p.updated_at} variant="failed" />
            ))}
          </Section>
        )}

        {/* Errors */}
        {data.counts.errors_24h > 0 && (
          <Section title="Chyby v systému" icon={AlertTriangle} count={data.counts.errors_24h}>
            {data.errors_recent.slice(0, 5).map(e => (
              <div key={e.id} className="px-3 py-2 rounded-lg bg-slate-800/50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-mono">{e.details?.source || 'unknown'}</span>
                  <span className="text-slate-500">{formatRelative(new Date(e.created_at))}</span>
                </div>
                <div className="text-slate-300 mt-0.5 truncate">{e.details?.message || '—'}</div>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'violet' | 'sky' | 'red' | 'amber' | 'slate';
  onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    violet: 'text-violet-400',
    sky: 'text-sky-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    slate: 'text-slate-500',
  };
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-slate-900 border border-slate-800 rounded-xl p-4 ${onClick ? 'hover:bg-slate-800/50 hover:border-slate-700 transition cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${colors[color]}`} />
        {onClick && <ChevronRight className="w-4 h-4 text-slate-600" />}
      </div>
      <div className={`text-2xl font-bold ${value > 0 && color !== 'slate' ? colors[color] : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </Tag>
  );
}

function Section({
  title, icon: Icon, count, actionLabel, onAction, empty, children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  actionLabel?: string;
  onAction?: () => void;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-medium text-white">{title}</h2>
          <span className="text-xs text-slate-500">({count})</span>
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            {actionLabel}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {empty ? (
        <div className="text-sm text-slate-500 italic py-3">{empty}</div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

function PostRow({
  item, time, muted = false, variant,
}: {
  item: QueueItem;
  time?: string | null;
  muted?: boolean;
  variant?: 'failed';
}) {
  const projectName = item.projects?.name || '—';
  const text = (item.text_content || '').substring(0, 80);
  return (
    <div
      className={`px-3 py-2 rounded-lg text-xs ${
        variant === 'failed' ? 'bg-red-950/20 border border-red-900/30' : 'bg-slate-800/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5 text-[11px]">
        <span className="text-violet-400 font-medium">{projectName}</span>
        {item.target_platform && (
          <span className="text-slate-500">• {item.target_platform}</span>
        )}
        {time && (
          <span className="text-slate-500 ml-auto">{formatTime(new Date(time))}</span>
        )}
      </div>
      <div className={`truncate ${muted ? 'text-slate-400' : 'text-slate-300'}`}>{text}</div>
    </div>
  );
}

// ─── Formatting helpers ──────────────────────────────────────

function getGreeting(): string {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Europe/Prague' }).format(new Date()),
    10,
  );
  if (hour < 5) return 'Dobrou noc';
  if (hour < 11) return 'Dobré ráno';
  if (hour < 17) return 'Dobré odpoledne';
  if (hour < 22) return 'Dobrý večer';
  return 'Dobrou noc';
}

function formatPragueDate(d: Date): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Prague',
  }).format(d);
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Prague',
  }).format(d);
}

function formatRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'právě teď';
  if (mins < 60) return `před ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.floor(hours / 24);
  return `před ${days} dny`;
}
