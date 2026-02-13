'use client';

import { useEffect, useState, useCallback } from 'react';
import { Send, Calendar, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface QueueItem {
  id: string;
  project_id: string;
  text_content: string;
  platforms: string[];
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  late_post_id: string | null;
  created_at: string;
  projects?: { name: string; slug: string };
}

export function PublishView() {
  const [approved, setApproved] = useState<QueueItem[]>([]);
  const [scheduled, setScheduled] = useState<QueueItem[]>([]);
  const [sent, setSent] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scheduleDate, setScheduleDate] = useState('');
  const [publishResult, setPublishResult] = useState<Array<{ id: string; status: string; error?: string }>>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [approvedRes, scheduledRes, sentRes] = await Promise.all([
      fetch('/api/queue?status=approved').then(r => r.json()),
      fetch('/api/queue?status=scheduled').then(r => r.json()),
      fetch('/api/queue?status=sent').then(r => r.json()),
    ]);
    setApproved(Array.isArray(approvedRes) ? approvedRes : []);
    setScheduled(Array.isArray(scheduledRes) ? scheduledRes : []);
    setSent(Array.isArray(sentRes) ? sentRes : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selectedIds.size === 0) return;
    setPublishing(true);
    setPublishResult([]);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          scheduledFor: scheduleDate ? new Date(scheduleDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      setPublishResult(data.results || []);
      setSelectedIds(new Set());
      loadData();
    } catch {
      setPublishResult([{ id: 'error', status: 'failed', error: 'Chyba při publikaci' }]);
    }
    setPublishing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Publikovat</h1>
        <p className="text-slate-400 mt-1">Odeslat schválené příspěvky přes getLate.dev</p>
      </div>

      {/* Publish controls */}
      {approved.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-medium text-white mb-3">Odeslat vybrané ({selectedIds.size})</h2>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">
                Naplánovat na (volitelné)
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing || selectedIds.size === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : scheduleDate ? (
                <Calendar className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {scheduleDate ? 'Naplánovat' : 'Odeslat nyní'}
            </button>
          </div>
        </div>
      )}

      {/* Publish results */}
      {publishResult.length > 0 && (
        <div className="mb-6 space-y-2">
          {publishResult.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                r.status === 'sent'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {r.status === 'sent' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {r.status === 'sent' ? 'Odesláno' : `Chyba: ${r.error}`}
            </div>
          ))}
        </div>
      )}

      {/* Approved posts */}
      <Section title="Schváleno – připraveno k odeslání" count={approved.length} icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}>
        {approved.map(item => (
          <PostCard
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onToggle={() => toggleSelect(item.id)}
            selectable
          />
        ))}
      </Section>

      {/* Scheduled */}
      <Section title="Naplánováno" count={scheduled.length} icon={<Clock className="w-4 h-4 text-blue-400" />}>
        {scheduled.map(item => (
          <PostCard key={item.id} item={item} />
        ))}
      </Section>

      {/* Sent */}
      <Section title="Odesláno" count={sent.length} icon={<Send className="w-4 h-4 text-slate-400" />}>
        {sent.slice(0, 20).map(item => (
          <PostCard key={item.id} item={item} />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, count, icon, children }: { title: string; count: number; icon: React.ReactNode; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-medium text-white">{title}</h2>
        <span className="text-xs text-slate-500">({count})</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PostCard({
  item,
  selected,
  onToggle,
  selectable,
}: {
  item: QueueItem;
  selected?: boolean;
  onToggle?: () => void;
  selectable?: boolean;
}) {
  return (
    <div
      className={`bg-slate-900 border rounded-lg p-4 transition-colors ${
        selected ? 'border-emerald-500/50' : 'border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3">
        {selectable && onToggle && (
          <button
            onClick={onToggle}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              selected ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 hover:border-slate-400'
            }`}
          >
            {selected && <CheckCircle className="w-3 h-3 text-white" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-violet-400">{item.projects?.name}</span>
            {item.platforms.map(p => (
              <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-xs text-slate-400">{p}</span>
            ))}
            {item.scheduled_for && (
              <span className="text-xs text-blue-400">
                {new Date(item.scheduled_for).toLocaleString('cs-CZ')}
              </span>
            )}
            {item.sent_at && (
              <span className="text-xs text-slate-500">
                Odesláno {new Date(item.sent_at).toLocaleString('cs-CZ')}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 line-clamp-2">{item.text_content}</p>
        </div>
      </div>
    </div>
  );
}
