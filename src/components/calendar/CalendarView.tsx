'use client';

import { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, Clock, Send, FileText } from 'lucide-react';

interface ScheduledPost {
  id: string;
  text_content: string;
  platforms: string[];
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  content_type: string;
  image_url?: string | null;
  projects?: { name: string; slug: string };
}

const TYPE_COLOR: Record<string, string> = {
  educational: 'bg-blue-500',
  soft_sell: 'bg-amber-500',
  hard_sell: 'bg-red-500',
  news: 'bg-emerald-500',
  engagement: 'bg-violet-500',
};

const TYPE_LABEL: Record<string, string> = {
  educational: 'Edukace',
  soft_sell: 'Soft sell',
  hard_sell: 'Hard sell',
  news: 'Aktualita',
  engagement: 'Engagement',
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Naplánováno', cls: 'bg-blue-500/10 text-blue-400' },
  sent: { label: 'Odesláno', cls: 'bg-emerald-500/10 text-emerald-400' },
  review: { label: 'K review', cls: 'bg-amber-500/10 text-amber-400' },
  approved: { label: 'Schváleno', cls: 'bg-violet-500/10 text-violet-400' },
  rejected: { label: 'Zamítnuto', cls: 'bg-red-500/10 text-red-400' },
};

export function CalendarView() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/queue?status=scheduled').then(r => r.json()),
      fetch('/api/queue?status=sent').then(r => r.json()),
      fetch('/api/queue?status=review').then(r => r.json()),
      fetch('/api/queue?status=approved').then(r => r.json()),
    ]).then(([scheduled, sent, review, approved]) => {
      const all = [
        ...(Array.isArray(scheduled) ? scheduled : []),
        ...(Array.isArray(sent) ? sent : []),
        ...(Array.isArray(review) ? review : []),
        ...(Array.isArray(approved) ? approved : []),
      ];
      setPosts(all);
      setLoading(false);
    });
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const getPostsForDate = (date: Date) => {
    return posts.filter(p => {
      const d = new Date(p.scheduled_for || p.sent_at || p.id); // fallback
      if (!p.scheduled_for && !p.sent_at) return false;
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    }).sort((a, b) => {
      const ta = new Date(a.scheduled_for || a.sent_at || '').getTime();
      const tb = new Date(b.scheduled_for || b.sent_at || '').getTime();
      return ta - tb;
    });
  };

  const getPostsForDay = (day: number) => {
    return getPostsForDate(new Date(year, month, day));
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ---- Day Detail View ----
  if (selectedDay) {
    const dayPosts = getPostsForDate(selectedDay);
    const dayLabel = selectedDay.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const isToday = selectedDay.toDateString() === new Date().toDateString();

    const prevDay = () => {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() - 1);
      setSelectedDay(d);
      if (d.getMonth() !== month) setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    };
    const nextDay = () => {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() + 1);
      setSelectedDay(d);
      if (d.getMonth() !== month) setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    };

    return (
      <div className="p-4 w-full h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white capitalize">{dayLabel}</h1>
              <p className="text-slate-400 mt-0.5 text-sm">
                {dayPosts.length} {dayPosts.length === 1 ? 'příspěvek' : dayPosts.length < 5 ? 'příspěvky' : 'příspěvků'}
                {isToday && <span className="ml-2 text-violet-400 font-medium">dnes</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setSelectedDay(new Date()); setCurrentMonth(new Date()); }}
              className="px-3 py-1 rounded-lg hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Dnes
            </button>
            <button onClick={nextDay} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {dayPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Calendar className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">Žádné příspěvky pro tento den</p>
              <p className="text-xs text-slate-600 mt-1">Klikněte na šipky pro navigaci mezi dny</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayPosts.map((post) => {
                const time = post.scheduled_for || post.sent_at;
                const st = STATUS_STYLE[post.status] || { label: post.status, cls: 'bg-slate-800 text-slate-400' };

                return (
                  <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                    <div className="flex">
                      {/* Time column */}
                      <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-800 bg-slate-900/80 p-3">
                        {time ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-slate-500 mb-1" />
                            <span className="text-sm font-mono font-medium text-white">{formatTime(time)}</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-600">--:--</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {/* Type badge */}
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${TYPE_COLOR[post.content_type] || 'bg-slate-500'}`} />
                            <span className="text-xs font-medium text-slate-300">
                              {TYPE_LABEL[post.content_type] || post.content_type}
                            </span>
                          </div>

                          <span className="text-slate-700">|</span>

                          {/* Project */}
                          <span className="text-xs text-slate-400">{post.projects?.name || '—'}</span>

                          <span className="text-slate-700">|</span>

                          {/* Platforms */}
                          <div className="flex items-center gap-1">
                            {post.platforms.map(pl => (
                              <span key={pl} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{pl}</span>
                            ))}
                          </div>

                          {/* Status */}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ml-auto ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>

                        {/* Text content */}
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">
                          {post.text_content}
                        </p>

                        {/* Image preview */}
                        {post.image_url && (
                          <div className="mt-3">
                            <img
                              src={post.image_url}
                              alt=""
                              className="w-32 h-20 object-cover rounded-lg border border-slate-800"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Month View ----
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
            {Object.entries(TYPE_COLOR).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-[11px] text-slate-500 capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setSelectedDay(new Date()); setCurrentMonth(new Date()); }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            Dnes
          </button>
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
            const hasPosts = dayPosts.length > 0;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(new Date(year, month, day))}
                className={`border-b border-r border-slate-800/50 p-1.5 overflow-hidden text-left transition-colors ${
                  isToday ? 'bg-violet-600/5' : isWeekend ? 'bg-slate-900/70' : ''
                } ${hasPosts ? 'hover:bg-slate-800/50 cursor-pointer' : 'hover:bg-slate-800/20 cursor-pointer'}`}
              >
                <div className={`text-xs mb-0.5 ${isToday ? 'text-violet-400 font-bold' : 'text-slate-500'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 4).map(post => (
                    <div
                      key={post.id}
                      className="flex items-center gap-1 px-1 py-0.5 rounded bg-slate-800/80"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_COLOR[post.content_type] || 'bg-slate-500'}`} />
                      <span className="text-[10px] text-slate-400 truncate">{post.projects?.name}</span>
                    </div>
                  ))}
                  {dayPosts.length > 4 && (
                    <span className="text-[10px] text-slate-500 px-1">+{dayPosts.length - 4}</span>
                  )}
                </div>
              </button>
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
