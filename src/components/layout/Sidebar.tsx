'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { SafeImage } from '@/components/ui/SafeImage';
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
  Bot,
  MessageCircle,
  PenSquare,
  FileText,
  Menu,
  X,
  Camera,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export type AdminView = 'dashboard' | 'projects' | 'agent' | 'generate' | 'manual-post' | 'review' | 'publish' | 'calendar' | 'chat' | 'blog' | 'settings';

interface SidebarProps {
  currentView: AdminView;
  onNavigate: (view: AdminView) => void;
}

const NAV_ITEMS: Array<{ view: AdminView; label: string; icon: React.ElementType }> = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'projects', label: 'Projekty', icon: FolderKanban },
  { view: 'agent', label: 'Agent Hugo', icon: Bot },
  { view: 'generate', label: 'Generovat', icon: Sparkles },
  { view: 'manual-post', label: 'Ruční post', icon: PenSquare },
  { view: 'review', label: 'Review', icon: ClipboardCheck },
  { view: 'publish', label: 'Publikovat', icon: Send },
  { view: 'calendar', label: 'Kalendář', icon: Calendar },
  { view: 'chat', label: 'Chat', icon: MessageCircle },
  { view: 'blog', label: 'Blog', icon: FileText },
  { view: 'settings', label: 'Nastavení', icon: Settings },
];

const CURRENT_LABEL: Record<AdminView, string> = NAV_ITEMS.reduce(
  (acc, n) => ({ ...acc, [n.view]: n.label }),
  {} as Record<AdminView, string>,
);

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  // Desktop: collapse the rail to a 64px icon strip.
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: off-canvas drawer open/closed.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll + close on Escape while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const handleNav = (view: AdminView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  // The aside expands the layout slot. On mobile it's pulled out of flow
  // (fixed) so the main content fills the screen; on md+ it's part of flex
  // flow with width 56/16.
  const widthClass = collapsed ? 'md:w-16' : 'md:w-56';
  const transformClass = mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0';

  return (
    <>
      {/* Mobile top bar — hamburger + current view title. Hidden on md+. */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-slate-900 border-b border-slate-800 z-30 flex items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Otevřít menu"
          aria-expanded={mobileOpen}
          aria-controls="primary-sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <SafeImage src="/logo-orchestrator.png" alt="" width={28} height={28} className="w-7 h-7 object-contain" priority />
        <span className="text-sm font-semibold text-white truncate">
          {CURRENT_LABEL[currentView] ?? 'Orchestrator'}
        </span>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          aria-hidden="true"
        />
      )}

      <aside
        id="primary-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-transform md:transition-all duration-200 w-64 ${widthClass} ${transformClass}`}
      >
        {/* Logo + collapse / close */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-800">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center">
            <SafeImage src="/logo-orchestrator.png" alt="Orchestrator" width={32} height={32} className="w-8 h-8 object-contain" priority />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-white truncate">Orchestrator</span>
          )}
          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto md:hidden p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Zavřít menu"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Desktop collapse button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:inline-flex ml-auto p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label={collapsed ? 'Rozbalit menu' : 'Sbalit menu'}
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
                onClick={() => handleNav(view)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {/* On mobile drawer always show label, on desktop honour collapsed flag */}
                <span className={collapsed ? 'md:hidden' : ''}>{label}</span>
              </button>
            );
          })}

          {/* Standalone routes — links into separate page shells (e.g. mobile
              upload page that doesn't render the admin shell). */}
          <Link
            href="/upload"
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={collapsed ? 'Nahrát fotku' : undefined}
          >
            <Camera className="w-5 h-5 flex-shrink-0" />
            <span className={collapsed ? 'md:hidden' : ''}>Nahrát fotku</span>
          </Link>
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-3">
          {user && (
            <p className={`text-xs text-slate-500 truncate mb-2 px-1 ${collapsed ? 'md:hidden' : ''}`}>
              {user.email}
            </p>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Odhlásit se"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={collapsed ? 'md:hidden' : ''}>Odhlásit</span>
          </button>
        </div>
      </aside>
    </>
  );
}
