'use client';

import { useEffect, useState } from 'react';
import {
  FolderKanban, ClipboardCheck, Send, TrendingUp, Sparkles, AlertTriangle,
  Image, Bot, Zap, Clock, CheckCircle2, XCircle, Play, Timer, ShieldCheck, ShieldAlert,
} from 'lucide-react';

interface Stats {
  totalProjects: number;
  reviewCount: number;
  approvedCount: number;
  sentCount: number;
  scheduledCount: number;
  rejectedCount: number;
  lowScorePosts: number;
}

interface ProjectStat {
  id: string;
  name: string;
  slug: string;
  platforms: string[];
  logo_url: string | null;
  primary_color: string | null;
  review: number;
  approved: number;
  sent: number;
  scheduled: number;
  total_posts: number;
  avg_score: number | null;
  media_count: number;
  orchestrator_enabled: boolean;
  posting_frequency: string;
  posting_times: string[];
  max_posts_per_day: number;
  auto_publish: boolean;
  auto_publish_threshold: number;
  media_strategy: string;
  content_strategy: string;
  pause_weekends: boolean;
}

const FREQ_LABELS: Record<string, string> = {
  '2x_daily': '2x denne',
  'daily': 'denne',
  '3x_week': '3x tydne',
  'weekly': 'tydne',
  'custom': 'vlastni',
};

interface MediaStats {
  total: number;
  processed: number;
  imagen_generated: number;
  uploaded: number;
  total_size_mb: number;
}

interface ActivityItem {
  id: string;
  action: string;
  project_name: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface AgentTask {
  id: string;
  project_id: string;
  project_name: string;
  project_logo: string | null;
  project_color: string | null;
  project_platforms: string[];
  task_type: string;
  status: string;
  priority: number;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

interface AgentTasksData {
  pending: AgentTask[];
  running: AgentTask[];
  recent: AgentTask[];
  counts: {
    pending: number;
    running: number;
    completed_today: number;
    failed_today: number;
  };
}

interface CronStatus {
  cron_agent: {
    last_run: string | null;
    details: Record<string, unknown> | null;
    schedule: string;
  };
  cron_rss: {
    last_run: string | null;
    details: Record<string, unknown> | null;
    schedule: string;
  };
  cron_secret_configured: boolean;
}

const TASK_LABELS: Record<string, string> = {
  generate_content: 'Generování postu',
  generate_week_plan: 'Týdenní plán',
  analyze_content_mix: 'Analýza mixu',
  suggest_topics: 'Návrh témat',
  react_to_news: 'Reakce na zprávy',
  quality_review: 'Quality review',
  sentiment_check: 'Sentiment check',
  dedup_check: 'Dedup check',
  optimize_schedule: 'Optimalizace plánu',
  kb_gap_analysis: 'KB gap analýza',
  auto_enrich_kb: 'Obohacení KB',
  cross_project_dedup: 'Cross-project dedup',
  generate_ab_variants: 'A/B varianty',
  performance_report: 'Report výkonu',
  image_prompt_review: 'Review foto promptu',
  prompt_quality_audit: 'Audit promptů',
  engagement_learning: 'Engagement learning',
  visual_consistency_audit: 'Vizuální audit',
  competitor_brief: 'Analýza konkurence',
};

const ACTION_LABELS: Record<string, { label: string; color: string; icon: typeof Bot }> = {
  content_generated: { label: 'Post vygenerován', color: 'text-emerald-400', icon: Sparkles },
  media_processed: { label: 'Médium otagováno', color: 'text-blue-400', icon: Image },
  media_matched: { label: 'Fotka matchnuta', color: 'text-violet-400', icon: Image },
  imagen_generated: { label: 'Imagen vygeneroval', color: 'text-violet-400', icon: Sparkles },
  imagen_asset_insert_error: { label: 'Imagen DB chyba', color: 'text-red-400', icon: AlertTriangle },
  content_queue_insert_error: { label: 'Queue chyba', color: 'text-red-400', icon: XCircle },
  task_completed: { label: 'Úkol dokončen', color: 'text-emerald-400', icon: CheckCircle2 },
  task_failed: { label: 'Úkol selhal', color: 'text-red-400', icon: XCircle },
};

export function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([]);
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [agentTasks, setAgentTasks] = useState<AgentTasksData | null>(null);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashRes, cronRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/cron/status'),
        ]);
        const data = await dashRes.json();
        if (data.stats) setStats(data.stats);
        if (data.projectStats) setProjectStats(data.projectStats);
        if (data.mediaStats) setMediaStats(data.mediaStats);
        if (data.recentActivity) setActivity(data.recentActivity);
        if (data.agentTasks) setAgentTasks(data.agentTasks);
        try {
          const cronData = await cronRes.json();
          setCronStatus(cronData);
        } catch { /* cron status optional */ }
      } catch {
        setStats({
          totalProjects: 0, reviewCount: 0, approvedCount: 0,
          sentCount: 0, scheduledCount: 0, rejectedCount: 0, lowScorePosts: 0,
        });
      }
      setLoading(false);
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    { label: 'K review', value: stats?.reviewCount ?? 0, icon: ClipboardCheck, color: 'from-amber-500 to-orange-600' },
    { label: 'Schváleno', value: stats?.approvedCount ?? 0, icon: Sparkles, color: 'from-emerald-500 to-teal-600' },
    { label: 'Naplánováno', value: stats?.scheduledCount ?? 0, icon: Clock, color: 'from-blue-500 to-cyan-600' },
    { label: 'Odesláno', value: stats?.sentCount ?? 0, icon: Send, color: 'from-green-500 to-emerald-600' },
    { label: 'Zamítnuto', value: stats?.rejectedCount ?? 0, icon: XCircle, color: 'from-slate-500 to-slate-600' },
    { label: 'Nízké skóre', value: stats?.lowScorePosts ?? 0, icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
  ];

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'právě teď';
    if (diffMin < 60) return `před ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `před ${diffH} h`;
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
  };

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Hugo Orchestrátor · {stats?.totalProjects ?? 0} projektů</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Agent Tasks */}
      {agentTasks && (agentTasks.counts.running > 0 || agentTasks.counts.pending > 0 || agentTasks.counts.completed_today > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Agent Hugo</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {agentTasks.counts.running > 0 && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                  {agentTasks.counts.running} running
                </span>
              )}
              {agentTasks.counts.pending > 0 && (
                <span className="text-slate-400">{agentTasks.counts.pending} pending</span>
              )}
              {agentTasks.counts.completed_today > 0 && (
                <span className="text-emerald-400">{agentTasks.counts.completed_today} done</span>
              )}
              {agentTasks.counts.failed_today > 0 && (
                <span className="text-red-400">{agentTasks.counts.failed_today} failed</span>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto">
            {/* Running tasks */}
            {agentTasks.running.map((task) => (
              <div key={task.id} className="px-4 py-3 bg-amber-500/[0.03]">
                <div className="flex items-center gap-3">
                  {/* Project logo */}
                  {task.project_logo ? (
                    <img src={task.project_logo} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 ring-2 ring-amber-500/30" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-amber-500/30"
                      style={{ backgroundColor: task.project_color || '#6d28d9' }}
                    >
                      {task.project_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{task.project_name}</span>
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium text-amber-400">{TASK_LABELS[task.task_type] || task.task_type}</span>
                      {task.project_platforms.length > 0 && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className="text-[10px] text-slate-500">{task.project_platforms.join(', ')}</span>
                        </>
                      )}
                      {task.started_at && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className="text-[10px] text-slate-600">{formatTime(task.started_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 font-semibold">RUNNING</span>
                </div>
              </div>
            ))}

            {/* Pending tasks */}
            {agentTasks.pending.map((task) => (
              <div key={task.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {task.project_logo ? (
                    <img src={task.project_logo} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0 opacity-70" />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 opacity-70"
                      style={{ backgroundColor: task.project_color || '#6d28d9' }}
                    >
                      {task.project_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-300">{task.project_name}</span>
                      <Clock className="w-3 h-3 text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400">{TASK_LABELS[task.task_type] || task.task_type}</span>
                      {task.project_platforms.length > 0 && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className="text-[10px] text-slate-500">{task.project_platforms.join(', ')}</span>
                        </>
                      )}
                      {task.scheduled_for && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className="text-[10px] text-slate-600">{formatTime(task.scheduled_for)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {task.priority >= 10 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">PRIORITY</span>
                    )}
                    <span className="text-[10px] px-2 py-1 rounded-md bg-slate-800 text-slate-400">PENDING</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Recent completed/failed */}
            {agentTasks.recent.slice(0, 8).map((task) => (
              <div key={task.id} className="px-4 py-2.5 opacity-60">
                <div className="flex items-center gap-3">
                  {task.project_logo ? (
                    <img src={task.project_logo} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ backgroundColor: task.project_color || '#6d28d9' }}
                    >
                      {task.project_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-xs text-slate-400">{task.project_name}</span>
                      <span className="text-slate-700">·</span>
                      <span className={`text-[11px] ${task.status === 'completed' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {TASK_LABELS[task.task_type] || task.task_type}
                      </span>
                    </div>
                    {task.error_message && (
                      <div className="text-[10px] text-red-400/60 mt-0.5 truncate ml-5">{task.error_message}</div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600">{task.completed_at ? formatTime(task.completed_at) : ''}</span>
                </div>
              </div>
            ))}

            {agentTasks.counts.running === 0 && agentTasks.counts.pending === 0 && agentTasks.recent.length === 0 && (
              <div className="p-6 text-center">
                <Bot className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Agent je v klidu</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cron Status */}
      {cronStatus && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Cron Jobs</h2>
            </div>
            <div className="flex items-center gap-2">
              {cronStatus.cron_secret_configured ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> CRON_SECRET OK
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-red-400">
                  <ShieldAlert className="w-3 h-3" /> CRON_SECRET chybí!
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Agent Cron */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-white">Agent Hugo</span>
              </div>
              <div className="text-[11px] text-slate-500 mb-2">{cronStatus.cron_agent.schedule}</div>
              {cronStatus.cron_agent.last_run ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-300">Poslední běh: {formatTime(cronStatus.cron_agent.last_run)}</span>
                  </div>
                  {cronStatus.cron_agent.details && (
                    <div className="text-[10px] text-slate-500">
                      {(cronStatus.cron_agent.details as Record<string, unknown>).message as string || 'OK'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-red-400">Nikdy neběžel</span>
                </div>
              )}
            </div>
            {/* RSS Cron */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-white">RSS Fetch</span>
              </div>
              <div className="text-[11px] text-slate-500 mb-2">{cronStatus.cron_rss.schedule}</div>
              {cronStatus.cron_rss.last_run ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-300">Poslední běh: {formatTime(cronStatus.cron_rss.last_run)}</span>
                  </div>
                  {cronStatus.cron_rss.details && (
                    <div className="text-[10px] text-slate-500">
                      {JSON.stringify(cronStatus.cron_rss.details).substring(0, 100)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-red-400">Nikdy neběžel</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects list */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Projekty</h2>
            </div>
            <span className="text-xs text-slate-500">{projectStats.length} aktivních</span>
          </div>

          {projectStats.length === 0 ? (
            <div className="p-8 text-center">
              <FolderKanban className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Žádné projekty</p>
              <p className="text-xs text-slate-600 mt-1">Přejděte do Projekty a přidejte první projekt</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {projectStats.map((p) => (
                <div key={p.id} className="px-4 py-3 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Logo / color dot */}
                    <div className="flex-shrink-0">
                      {p.logo_url ? (
                        <img src={p.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: p.primary_color || '#6d28d9' }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name + platforms */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{p.name}</span>
                        {p.orchestrator_enabled ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">AUTO</span>
                        ) : (
                          <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-medium">OFF</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.platforms.map((pl: string) => (
                          <span key={pl} className="text-[10px] text-slate-500">{pl}</span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <div className="text-white font-semibold">{p.total_posts}</div>
                        <div className="text-[10px] text-slate-500">postu</div>
                      </div>
                      {p.review > 0 && (
                        <div className="text-center">
                          <div className="text-amber-400 font-semibold">{p.review}</div>
                          <div className="text-[10px] text-slate-500">review</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-emerald-400 font-semibold">{p.sent}</div>
                        <div className="text-[10px] text-slate-500">sent</div>
                      </div>
                      {p.avg_score && (
                        <div className="text-center">
                          <div className={`font-semibold ${p.avg_score >= 8 ? 'text-emerald-400' : p.avg_score >= 6 ? 'text-amber-400' : 'text-red-400'}`}>
                            {p.avg_score}
                          </div>
                          <div className="text-[10px] text-slate-500">score</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Orchestrator config row */}
                  {p.orchestrator_enabled && (
                    <div className="flex items-center gap-3 mt-2 ml-12 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {FREQ_LABELS[p.posting_frequency] || p.posting_frequency}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {p.posting_times.join(', ')}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        max {p.max_posts_per_day}/den
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {p.content_strategy}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.auto_publish ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {p.auto_publish ? `auto-publish ≥${p.auto_publish_threshold}` : 'manual review'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        media: {p.media_strategy}
                      </span>
                      {p.pause_weekends && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                          pause weekends
                        </span>
                      )}
                      {p.media_count > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                          {p.media_count} medii
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Activity + Media */}
        <div className="space-y-6">
          {/* Agent Activity */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 p-4 border-b border-slate-800">
              <Bot className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Aktivita Huga</h2>
            </div>

            {activity.length === 0 ? (
              <div className="p-6 text-center">
                <Bot className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Žádná aktivita</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50 max-h-[300px] overflow-y-auto">
                {activity.map((item) => {
                  const meta = ACTION_LABELS[item.action] || { label: item.action, color: 'text-slate-400', icon: Zap };
                  const Icon = meta.icon;
                  return (
                    <div key={item.id} className="px-4 py-2.5 flex items-start gap-2.5">
                      <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${meta.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                          <span className="text-[10px] text-slate-600">·</span>
                          <span className="text-[10px] text-slate-500 truncate">{item.project_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">{formatTime(item.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Media Stats */}
          {mediaStats && mediaStats.total > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Media Library</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-lg font-bold text-white">{mediaStats.total}</div>
                  <div className="text-slate-500">celkem médií</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-400">{mediaStats.processed}</div>
                  <div className="text-slate-500">otagováno</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-violet-400">{mediaStats.imagen_generated}</div>
                  <div className="text-slate-500">AI generováno</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-300">{mediaStats.total_size_mb} MB</div>
                  <div className="text-slate-500">celková velikost</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Rychlé akce</h2>
            </div>
            <div className="space-y-2">
              <QuickAction icon={Sparkles} label="Generovat post" color="violet" href="generate" />
              <QuickAction icon={ClipboardCheck} label="Review fronta" color="amber" href="review" />
              <QuickAction icon={Play} label="Spustit agenta" color="emerald" href="agent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, href }: { icon: typeof Bot; label: string; color: string; href: string }) {
  const colorMap: Record<string, string> = {
    violet: 'bg-violet-600/10 text-violet-400 hover:bg-violet-600/20',
    amber: 'bg-amber-600/10 text-amber-400 hover:bg-amber-600/20',
    emerald: 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20',
  };

  return (
    <button
      onClick={() => {
        // Navigate via parent - dispatch custom event
        window.dispatchEvent(new CustomEvent('navigate', { detail: href }));
      }}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${colorMap[color] || colorMap.violet}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
