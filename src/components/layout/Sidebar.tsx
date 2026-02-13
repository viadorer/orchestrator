'use client';

import { useAuth } from '@/lib/auth/auth-context';
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  ClipboardCheck,
  Send,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

export type AdminView = 'dashboard' | 'projects' | 'generate' | 'review' | 'publish' | 'calendar' | 'settings';

interface SidebarProps {
  currentView: AdminView;
  onNavigate: (view: AdminView) => void;
}

const NAV_ITEMS: Array<{ view: AdminView; label: string; icon: React.ElementType }> = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'projects', label: 'Projekty', icon: FolderKanban },
  { view: 'generate', label: 'Generovat', icon: Sparkles },
  { view: 'review', label: 'Review', icon: ClipboardCheck },
  { view: 'publish', label: 'Publikovat', icon: Send },
  { view: 'calendar', label: 'Kalendář', icon: Calendar },
  { view: 'settings', label: 'Nastavení', icon: Settings },
];

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-800">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <span className="text-sm font-bold text-white">O</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-white truncate">Orchestrator</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
          const isActive = currentView === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed && user && (
          <p className="text-xs text-slate-500 truncate mb-2 px-1">{user.email}</p>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Odhlásit se"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Odhlásit</span>}
        </button>
      </div>
    </aside>
  );
}
