'use client';

import { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScheduledPost {
  id: string;
  text_content: string;
  platforms: string[];
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  content_type: string;
  projects?: { name: string; slug: string };
}

export function CalendarView() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    Promise.all([
      fetch('/api/queue?status=scheduled').then(r => r.json()),
      fetch('/api/queue?status=sent').then(r => r.json()),
    ]).then(([scheduled, sent]) => {
      const all = [
        ...(Array.isArray(scheduled) ? scheduled : []),
        ...(Array.isArray(sent) ? sent : []),
      ];
      setPosts(all);
      setLoading(false);
    });
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Monday start

  const getPostsForDay = (day: number) => {
    return posts.filter(p => {
      const date = p.scheduled_for || p.sent_at;
      if (!date) return false;
      const d = new Date(date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const typeColor: Record<string, string> = {
    educational: 'bg-blue-500',
    soft_sell: 'bg-amber-500',
    hard_sell: 'bg-red-500',
    news: 'bg-emerald-500',
    engagement: 'bg-violet-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kalendář</h1>
          <p className="text-slate-400 mt-1">Přehled naplánovaných a odeslaných příspěvků</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-white min-w-[140px] text-center">
            {currentMonth.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {Object.entries(typeColor).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-slate-400 capitalize">{type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-slate-800">
          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-800/50 bg-slate-900/50" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPosts = getPostsForDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

            return (
              <div
                key={day}
                className={`min-h-[80px] border-b border-r border-slate-800/50 p-1.5 ${
                  isToday ? 'bg-violet-600/5' : ''
                }`}
              >
                <div className={`text-xs mb-1 ${isToday ? 'text-violet-400 font-bold' : 'text-slate-500'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      className="flex items-center gap-1 px-1 py-0.5 rounded bg-slate-800/80"
                      title={`${post.projects?.name}: ${post.text_content.substring(0, 100)}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeColor[post.content_type] || 'bg-slate-500'}`} />
                      <span className="text-[10px] text-slate-400 truncate">{post.projects?.name}</span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[10px] text-slate-500 px-1">+{dayPosts.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-slate-500 mt-4">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Zatím žádné naplánované příspěvky</p>
        </div>
      )}
    </div>
  );
}
