'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Bot, Play, Loader2, CheckCircle, XCircle, Clock, AlertTriangle,
  Sparkles, Calendar, Brain, Shield, TrendingUp, BookOpen,
  ChevronDown, ChevronUp, Zap, Activity, RotateCcw, Trash2, Map,
} from 'lucide-react';
import { AgentDiagram } from './AgentDiagram';

interface Project {
  id: string;
  name: string;
  slug: string;
  platforms: string[];
}

interface AgentTask {
  id: string;
  project_id: string;
  task_type: string;
  params: Record<string, unknown>;
  status: string;
  priority: number;
  result: Record<string, unknown> | null;
  error_message: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  created_at: string;
  completed_at: string | null;
  projects?: { name: string; slug: string };
}

interface LogEntry {
  id: string;
  project_id: string;
  action: string;
  details: Record<string, unknown>;
  tokens_used: number | null;
  created_at: string;
  projects?: { name: string; slug: string };
}

interface ProjectHealth {
  health: string;
  kb_entries: number;
  kb_missing_categories: string[];
  posts_total: number;
  posts_recent: number;
  pending_tasks: number;
  avg_quality_score: number | null;
  content_mix_actual: Record<string, number>;
  content_mix_target: Record<string, number>;
}

const TASK_TYPES = [
  { value: 'generate_content', label: 'Generovat post', icon: Sparkles, desc: 'Vytvoří příspěvek podle KB a content mixu' },
  { value: 'generate_week_plan', label: 'Plán na týden', icon: Calendar, desc: 'Naplánuje celý týden obsahu dopředu' },
  { value: 'suggest_topics', label: 'Navrhnout témata', icon: Brain, desc: 'Navrhne 5 témat z KB' },
  { value: 'analyze_content_mix', label: 'Analýza mixu', icon: TrendingUp, desc: 'Porovná aktuální vs cílový content mix' },
  { value: 'kb_gap_analysis', label: 'Analýza KB', icon: BookOpen, desc: 'Najde mezery v Knowledge Base' },
  { value: 'performance_report', label: 'Report výkonu', icon: Activity, desc: 'Shrnutí výkonu obsahu' },
  { value: 'sentiment_check', label: 'Sentiment check', icon: Shield, desc: 'Kontrola bezpečnosti textu' },
  { value: 'optimize_schedule', label: 'Optimalizace časů', icon: Clock, desc: 'Navrhne nejlepší časy publikace' },
] as const;

const HEALTH_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  excellent: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Výborný' },
  good: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Dobrý' },
  needs_attention: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Potřebuje pozornost' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Kritický' },
  idle: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Neaktivní' },
};

export function AgentView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [health, setHealth] = useState<ProjectHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [creatingTask, setCreatingTask] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [agentTab, setAgentTab] = useState<'tasks' | 'diagram'>('tasks');

  const filteredTasks = taskFilter === 'all' ? tasks : tasks.filter(t => t.status === taskFilter);

  // Load projects
  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(data => {
      const p = Array.isArray(data) ? data : [];
      setProjects(p);
      if (p.length > 0) setSelectedProject(p[0].id);
      setLoading(false);
    });
  }, []);

  // Load tasks, logs, health when project changes
  const loadProjectData = useCallback(async () => {
    if (!selectedProject) return;
    const [tasksRes, logsRes, healthRes] = await Promise.all([
      fetch(`/api/agent/tasks?projectId=${selectedProject}`).then(r => r.json()),
      fetch(`/api/agent/log?projectId=${selectedProject}`).then(r => r.json()),
      fetch(`/api/agent/health/${selectedProject}`).then(r => r.json()).catch(() => null),
    ]);
    setTasks(Array.isArray(tasksRes) ? tasksRes : []);
    setLogs(Array.isArray(logsRes) ? logsRes : []);
    setHealth(healthRes);
  }, [selectedProject]);

  useEffect(() => { loadProjectData(); }, [loadProjectData]);

  // Create task AND immediately execute it
  const handleCreateTask = async (taskType: string) => {
    setCreatingTask(taskType);
    const currentProject = projects.find(p => p.id === selectedProject);
    try {
      // 1. Create task
      const createRes = await fetch('/api/agent/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          taskType,
          params: {
            platform: currentProject?.platforms?.[0] || 'linkedin',
          },
        }),
      });
      const { id: taskId } = await createRes.json();

      // 2. Immediately execute it
      if (taskId) {
        await loadProjectData(); // Show task as "running"
        const execRes = await fetch(`/api/agent/tasks/${taskId}/execute`, { method: 'POST' });
        if (!execRes.ok) {
          const data = await execRes.json().catch(() => ({}));
          console.error('Task execution failed:', data.error || execRes.statusText);
        }
      }
    } catch (err) {
      console.error('Create+execute error:', err);
    }
    await loadProjectData();
    setCreatingTask(null);
    // Auto-refresh after 3s
    setTimeout(() => loadProjectData(), 3000);
  };

  // Execute single task
  const handleExecute = async (taskId: string) => {
    setExecuting(taskId);
    try {
      const res = await fetch(`/api/agent/tasks/${taskId}/execute`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Task execution failed:', data.error || res.statusText);
      }
    } catch (err) {
      console.error('Task execution error:', err);
    }
    await loadProjectData();
    setExecuting(null);
    // Auto-refresh after 3s to catch async completions
    setTimeout(() => loadProjectData(), 3000);
  };

  // Run all pending
  const handleRunAll = async () => {
    setRunningAll(true);
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Run all failed:', data.error || res.statusText);
      }
    } catch (err) {
      console.error('Run all error:', err);
    }
    await loadProjectData();
    setRunningAll(false);
    // Auto-refresh after 5s
    setTimeout(() => loadProjectData(), 5000);
  };

  // Delete single task
  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/agent/tasks?id=${taskId}`, { method: 'DELETE' });
    await loadProjectData();
  };

  // Delete all tasks with given status
  const handleDeleteAllByStatus = async (status: string) => {
    if (!confirm(`Smazat všechny ${status === 'pending' ? 'čekající' : status === 'failed' ? 'chybové' : status} úkoly?`)) return;
    await fetch(`/api/agent/tasks?projectId=${selectedProject}&status=${status}`, { method: 'DELETE' });
    await loadProjectData();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running': return <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const healthInfo = health ? HEALTH_COLORS[health.health] || HEALTH_COLORS.idle : HEALTH_COLORS.idle;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Agent Hugo</h1>
            <p className="text-slate-400 text-sm">Autonomní správa obsahu</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setAgentTab('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                agentTab === 'tasks' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Úkoly
            </button>
            <button
              onClick={() => setAgentTab('diagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                agentTab === 'diagram' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Architektura
            </button>
          </div>
          {/* Project selector */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Run all pending */}
          {pendingCount > 0 && (
            <button
              onClick={handleRunAll}
              disabled={runningAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
            >
              {runningAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Spustit vše ({pendingCount})
            </button>
          )}
        </div>
      </div>

      {/* Diagram tab */}
      {agentTab === 'diagram' && <AgentDiagram />}

      {/* Tasks tab */}
      {agentTab === 'tasks' && <>
      {/* Health card */}
      {health && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" /> Zdraví projektu
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${healthInfo.bg} ${healthInfo.text}`}>
              {healthInfo.label}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="KB záznamy" value={health.kb_entries} />
            <Stat label="Celkem postů" value={health.posts_total} />
            <Stat label="Průměrné skóre" value={health.avg_quality_score?.toString() || '–'} />
            <Stat label="Čekající úkoly" value={health.pending_tasks} />
          </div>
          {health.kb_missing_categories.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Chybí KB kategorie: {health.kb_missing_categories.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task launcher */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-medium text-white mb-3">Služby agenta</h2>
          <div className="space-y-2">
            {TASK_TYPES.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => handleCreateTask(value)}
                disabled={creatingTask === value}
                className="w-full flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-violet-600/20 flex items-center justify-center flex-shrink-0 transition-colors">
                  {creatingTask === value ? (
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks & Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-white">Úkoly ({tasks.length})</h2>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 text-xs">
                  {(['all', 'pending', 'completed', 'failed'] as const).map(s => {
                    const count = s === 'all' ? tasks.length : tasks.filter(t => t.status === s).length;
                    return (
                      <button
                        key={s}
                        onClick={() => setTaskFilter(s)}
                        className={`px-2 py-0.5 rounded font-medium transition-colors ${
                          taskFilter === s ? 'bg-violet-600/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {s === 'all' ? 'Vše' : s === 'pending' ? 'Čekající' : s === 'completed' ? 'Hotové' : 'Chyby'} ({count})
                      </button>
                    );
                  })}
                </div>
                {pendingCount > 0 && (
                  <button
                    onClick={() => handleDeleteAllByStatus('pending')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    Smazat čekající
                  </button>
                )}
                <button
                  onClick={loadProjectData}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Žádné úkoly. Klikněte na službu vlevo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.slice(0, 30).map(task => (
                  <div
                    key={task.id}
                    className={`bg-slate-900 border rounded-lg overflow-hidden ${
                      task.status === 'completed' ? 'border-emerald-800/50' :
                      task.status === 'failed' ? 'border-red-800/50' :
                      task.status === 'running' ? 'border-violet-800/50' :
                      'border-slate-800'
                    }`}
                  >
                    <button
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800/30 transition-colors"
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    >
                      {statusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {TASK_TYPES.find(t => t.value === task.task_type)?.label || task.task_type}
                          </span>
                          {task.status === 'completed' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] text-emerald-400 font-medium">
                              Hotovo
                            </span>
                          )}
                          {task.is_recurring && (
                            <span className="px-1.5 py-0.5 rounded bg-violet-600/20 text-[10px] text-violet-400">
                              {task.recurrence_rule}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(task.created_at).toLocaleString('cs-CZ')}
                          {task.completed_at && ` → ${new Date(task.completed_at).toLocaleString('cs-CZ')}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        {task.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleExecute(task.id)}
                              disabled={executing === task.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
                            >
                              {executing === task.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              Spustit
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                              title="Smazat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {(task.result || task.error_message) && (
                          <div className="p-1.5 text-slate-400">
                            {expandedTask === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Expanded: readable result */}
                    {expandedTask === task.id && task.result && (
                      <TaskResult task={task} />
                    )}

                    {/* Error */}
                    {expandedTask === task.id && task.status === 'failed' && task.error_message && (
                      <div className="border-t border-red-500/20 p-3 bg-red-500/5">
                        <p className="text-xs text-red-400 font-medium mb-1">Chyba:</p>
                        <p className="text-xs text-red-300">{task.error_message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agent log */}
          <div>
            <h2 className="text-sm font-medium text-white mb-3">Log agenta</h2>
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500">Zatím žádné záznamy.</p>
            ) : (
              <div className="space-y-1">
                {logs.slice(0, 20).map(log => (
                  <div key={log.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 text-xs">
                    <span className="text-slate-500 w-36 flex-shrink-0">
                      {new Date(log.created_at).toLocaleString('cs-CZ')}
                    </span>
                    <span className={`font-mono ${
                      log.action.includes('error') || log.action.includes('fail') ? 'text-red-400' :
                      log.action.includes('editor') ? 'text-amber-400' :
                      log.action.includes('media') ? 'text-emerald-400' :
                      'text-violet-400'
                    }`}>{log.action}</span>
                    {log.details && typeof log.details === 'object' && 'result_summary' in log.details && (
                      <span className="text-slate-600 truncate max-w-[200px]">
                        {(log.details as Record<string, unknown>).result_summary as string}
                      </span>
                    )}
                    {log.tokens_used ? (
                      <span className="text-slate-600 ml-auto whitespace-nowrap">{log.tokens_used.toLocaleString()} tok</span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </>}
    </div>
  );
}

/* ---- Task Result: readable output per task type ---- */
function TaskResult({ task }: { task: AgentTask }) {
  if (!task.result) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = task.result as Record<string, any>;

  return (
    <div className="border-t border-slate-800 p-4 bg-slate-800/30 space-y-3">
      {/* Generated post text */}
      {r.text && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Vygenerovaný text</div>
          <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900 rounded-lg p-3 border border-slate-700">
            {r.text as string}
          </div>
        </div>
      )}

      {/* Scores */}
      {r.scores && typeof r.scores === 'object' && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">AI Skóre</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(r.scores as Record<string, number>).map(([key, val]) => (
              <div key={key} className={`px-2 py-1 rounded text-xs font-mono ${
                val >= 8 ? 'bg-emerald-500/20 text-emerald-300' :
                val >= 6 ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {key}: {typeof val === 'number' ? val.toFixed(1) : val}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor review */}
      {r.editor_review && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Hugo-Editor Review</div>
          <div className="text-xs text-slate-300 bg-slate-900 rounded-lg p-3 border border-slate-700 whitespace-pre-wrap">
            {typeof r.editor_review === 'string' ? r.editor_review : JSON.stringify(r.editor_review, null, 2)}
          </div>
        </div>
      )}

      {/* Topics list */}
      {r.topics && Array.isArray(r.topics) && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Navržená témata</div>
          <div className="space-y-1">
            {(r.topics as Array<Record<string, unknown>>).map((topic, i) => (
              <div key={i} className="flex items-start gap-2 text-xs bg-slate-900 rounded-lg p-2 border border-slate-700">
                <span className="text-violet-400 font-mono w-5 flex-shrink-0">{i + 1}.</span>
                <span className="text-slate-200">{String(topic.title || topic.topic || JSON.stringify(topic))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items (generic array output) */}
      {r.items && Array.isArray(r.items) && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Výsledky</div>
          <div className="space-y-1">
            {(r.items as Array<Record<string, unknown>>).map((item, i) => (
              <div key={i} className="text-xs bg-slate-900 rounded-lg p-2 border border-slate-700 text-slate-200">
                {typeof item === 'string' ? item : String(item.title || item.name || item.text || JSON.stringify(item))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week plan */}
      {r.plan && Array.isArray(r.plan) && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Plán na týden</div>
          <div className="space-y-1">
            {(r.plan as Array<Record<string, unknown>>).map((day, i) => (
              <div key={i} className="flex items-start gap-2 text-xs bg-slate-900 rounded-lg p-2 border border-slate-700">
                <span className="text-violet-400 font-medium w-8 flex-shrink-0">{String(day.day || `Den ${i + 1}`)}</span>
                <span className="text-slate-200">{String(day.topic || day.title || day.content || JSON.stringify(day))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content mix analysis */}
      {r.analysis && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Analýza</div>
          <div className="text-xs text-slate-300 bg-slate-900 rounded-lg p-3 border border-slate-700 whitespace-pre-wrap">
            {typeof r.analysis === 'string' ? r.analysis : JSON.stringify(r.analysis, null, 2)}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {r.recommendations && Array.isArray(r.recommendations) && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Doporučení</div>
          <div className="space-y-1">
            {(r.recommendations as string[]).map((rec, i) => (
              <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-violet-400 mt-0.5">•</span> {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw response fallback */}
      {r.raw_response && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Odpověď AI</div>
          <div className="text-xs text-slate-300 bg-slate-900 rounded-lg p-3 border border-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {r.raw_response as string}
          </div>
        </div>
      )}

      {/* Fallback: show JSON for any unhandled fields */}
      {!r.text && !r.topics && !r.items && !r.plan && !r.analysis && !r.raw_response && !r.recommendations && (
        <div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Výsledek</div>
          <pre className="text-xs text-slate-300 bg-slate-900 rounded-lg p-3 border border-slate-700 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
            {JSON.stringify(r, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
