'use client';

import { useEffect, useState } from 'react';
import { FolderKanban, ClipboardCheck, Send, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';

interface Stats {
  totalProjects: number;
  reviewCount: number;
  approvedCount: number;
  sentCount: number;
  scheduledCount: number;
  lowScorePosts: number;
}

export function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [projectsRes, reviewRes, approvedRes, sentRes, scheduledRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/queue?status=review'),
          fetch('/api/queue?status=approved'),
          fetch('/api/queue?status=sent'),
          fetch('/api/queue?status=scheduled'),
        ]);

        const projects = await projectsRes.json();
        const review = await reviewRes.json();
        const approved = await approvedRes.json();
        const sent = await sentRes.json();
        const scheduled = await scheduledRes.json();

        const reviewArr = Array.isArray(review) ? review : [];
        const lowScore = reviewArr.filter((p: { ai_scores?: { overall?: number } }) =>
          p.ai_scores?.overall !== undefined && p.ai_scores.overall < 7
        );

        setStats({
          totalProjects: Array.isArray(projects) ? projects.length : 0,
          reviewCount: reviewArr.length,
          approvedCount: Array.isArray(approved) ? approved.length : 0,
          sentCount: Array.isArray(sent) ? sent.length : 0,
          scheduledCount: Array.isArray(scheduled) ? scheduled.length : 0,
          lowScorePosts: lowScore.length,
        });
      } catch {
        // Supabase not configured yet
        setStats({
          totalProjects: 0,
          reviewCount: 0,
          approvedCount: 0,
          sentCount: 0,
          scheduledCount: 0,
          lowScorePosts: 0,
        });
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const cards = [
    { label: 'Projekty', value: stats?.totalProjects ?? 0, icon: FolderKanban, color: 'from-violet-500 to-indigo-600' },
    { label: 'K review', value: stats?.reviewCount ?? 0, icon: ClipboardCheck, color: 'from-amber-500 to-orange-600' },
    { label: 'Schváleno', value: stats?.approvedCount ?? 0, icon: Sparkles, color: 'from-emerald-500 to-teal-600' },
    { label: 'Naplánováno', value: stats?.scheduledCount ?? 0, icon: TrendingUp, color: 'from-blue-500 to-cyan-600' },
    { label: 'Odesláno', value: stats?.sentCount ?? 0, icon: Send, color: 'from-green-500 to-emerald-600' },
    { label: 'Nízké skóre', value: stats?.lowScorePosts ?? 0, icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
  ];

  return (
    <div className="p-6 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Přehled orchestrátoru</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-slate-400">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {stats?.totalProjects === 0 && (
        <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white mb-2">Začněte přidáním projektu</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Přejděte do sekce &quot;Projekty&quot; a přidejte svůj první projekt. 
            Nastavte Knowledge Base, tone of voice a constraints – a Hugo začne tvořit obsah.
          </p>
        </div>
      )}
    </div>
  );
}
