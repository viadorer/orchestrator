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

  // Calculate number of rows needed
  const totalCells = adjustedFirstDay + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  return (
    <div className="p-4 w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Kalendář</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Přehled naplánovaných a odeslaných příspěvků</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3">
            {Object.entries(typeColor).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-[11px] text-slate-500 capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-white min-w-[130px] text-center">
              {currentMonth.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid – fills remaining space */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-slate-800 flex-shrink-0">
          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(d => (
            <div key={d} className="px-2 py-1.5 text-center text-xs font-medium text-slate-500">
              {d}
            </div>
          ))}
        </div>

        {/* Days – equal height rows filling available space */}
        <div className="flex-1 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
          {/* Empty cells before first day */}
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-slate-800/50 bg-slate-900/50" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPosts = getPostsForDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            const isWeekend = ((adjustedFirstDay + i) % 7) >= 5;

            return (
              <div
                key={day}
                className={`border-b border-r border-slate-800/50 p-1.5 overflow-hidden ${
                  isToday ? 'bg-violet-600/5' : isWeekend ? 'bg-slate-900/70' : ''
                }`}
              >
                <div className={`text-xs mb-0.5 ${isToday ? 'text-violet-400 font-bold' : 'text-slate-500'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 4).map(post => (
                    <div
                      key={post.id}
                      className="flex items-center gap-1 px-1 py-0.5 rounded bg-slate-800/80"
                      title={`${post.projects?.name}: ${post.text_content.substring(0, 100)}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeColor[post.content_type] || 'bg-slate-500'}`} />
                      <span className="text-[10px] text-slate-400 truncate">{post.projects?.name}</span>
                    </div>
                  ))}
                  {dayPosts.length > 4 && (
                    <span className="text-[10px] text-slate-500 px-1">+{dayPosts.length - 4}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty cells after last day to fill the grid */}
          {Array.from({ length: rows * 7 - totalCells }).map((_, i) => (
            <div key={`end-${i}`} className="border-b border-r border-slate-800/50 bg-slate-900/50" />
          ))}
        </div>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Zatím žádné naplánované příspěvky</p>
        </div>
      )}
    </div>
  );
}
