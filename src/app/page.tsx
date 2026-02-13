'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { Sidebar, type AdminView } from '@/components/layout/Sidebar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ProjectsView } from '@/components/projects/ProjectsView';
import { GenerateView } from '@/components/generate/GenerateView';
import { ReviewView } from '@/components/review/ReviewView';
import { PublishView } from '@/components/publish/PublishView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { SettingsView } from '@/components/settings/SettingsView';
import { AgentView } from '@/components/agent/AgentView';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<AdminView>('dashboard');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentView={view} onNavigate={setView} />
      <main className="flex-1 overflow-y-auto">
        {view === 'dashboard' && <DashboardView />}
        {view === 'projects' && <ProjectsView />}
        {view === 'agent' && <AgentView />}
        {view === 'generate' && <GenerateView />}
        {view === 'review' && <ReviewView />}
        {view === 'publish' && <PublishView />}
        {view === 'calendar' && <CalendarView />}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
