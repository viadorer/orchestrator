'use client';

import { useEffect, useState, useCallback } from 'react';
import { Send, Calendar, Loader2, CheckCircle, XCircle, Clock, Pencil, Trash2, Save, X, Eye, Filter, Image as ImageIcon } from 'lucide-react';

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
  image_url: string | null;
  chart_url: string | null;
  card_url: string | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const projectParam = selectedProject ? `&projectId=${selectedProject}` : '';
    const [approvedRes, scheduledRes, sentRes] = await Promise.all([
      fetch(`/api/queue?status=approved${projectParam}`).then(r => r.json()),
      fetch(`/api/queue?status=scheduled${projectParam}`).then(r => r.json()),
      fetch(`/api/queue?status=sent${projectParam}`).then(r => r.json()),
    ]);
    setApproved(Array.isArray(approvedRes) ? approvedRes : []);
    setScheduled(Array.isArray(scheduledRes) ? scheduledRes : []);
    setSent(Array.isArray(sentRes) ? sentRes : []);
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => { loadData(); }, [loadData]);

  // Get unique projects from all data
  const allProjects = [...approved, ...scheduled, ...sent]
    .map(item => item.projects)
    .filter((p, i, arr) => p && arr.findIndex(x => x?.slug === p.slug) === i) as Array<{ name: string; slug: string }>;

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

  const handleEdit = (item: QueueItem) => {
    setEditingId(item.id);
    setEditText(item.text_content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, text_content: editText }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditText('');
        loadData();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = async (id: string) => {
    setDeleting(prev => new Set(prev).add(id));
    try {
      const res = await fetch('/api/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      if (res.ok) {
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        loadData();
      }
    } catch { /* ignore */ }
    setDeleting(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(new Set(selectedIds));
    try {
      const res = await fetch('/api/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        loadData();
      }
    } catch { /* ignore */ }
    setDeleting(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Publikovat</h1>
        <p className="text-slate-400 mt-1">Odeslat schválené příspěvky přes getLate.dev</p>
      </div>

      {/* Project filter */}
      {allProjects.length > 1 && (
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Všechny projekty</option>
              {allProjects.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

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
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Smazat ({selectedIds.size})
              </button>
            )}
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
            editable
            isEditing={editingId === item.id}
            editText={editText}
            saving={saving}
            isDeleting={deleting.has(item.id)}
            onEdit={() => handleEdit(item)}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onEditTextChange={setEditText}
            onDelete={() => handleDelete(item.id)}
            onPreview={setPreviewItem}
          />
        ))}
      </Section>

      {/* Scheduled */}
      <Section title="Naplánováno" count={scheduled.length} icon={<Clock className="w-4 h-4 text-blue-400" />}>
        {scheduled.map(item => (
          <PostCard
            key={item.id}
            item={item}
            editable
            isEditing={editingId === item.id}
            editText={editText}
            saving={saving}
            isDeleting={deleting.has(item.id)}
            onEdit={() => handleEdit(item)}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onEditTextChange={setEditText}
            onDelete={() => handleDelete(item.id)}
            onPreview={setPreviewItem}
          />
        ))}
      </Section>

      {/* Sent */}
      <Section title="Odesláno" count={sent.length} icon={<Send className="w-4 h-4 text-slate-400" />}>
        {sent.slice(0, 20).map(item => (
          <PostCard key={item.id} item={item} onPreview={setPreviewItem} />
        ))}
      </Section>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6" onClick={() => setPreviewItem(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Náhled příspěvku</h3>
                <p className="text-xs text-slate-400 mt-1">{previewItem.projects?.name}</p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Platforms */}
              <div className="flex items-center gap-2 mb-4">
                {previewItem.platforms.map(p => (
                  <span key={p} className="px-2 py-1 rounded-lg bg-slate-800 text-xs text-slate-300">{p}</span>
                ))}
                {previewItem.scheduled_for && (
                  <span className="text-xs text-blue-400">
                    📅 {new Date(previewItem.scheduled_for).toLocaleString('cs-CZ')}
                  </span>
                )}
              </div>

              {/* Text content */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">{previewItem.text_content}</p>
              </div>

              {/* Visual assets */}
              {(previewItem.image_url || previewItem.chart_url || previewItem.card_url) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Vizuální obsah</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {previewItem.chart_url && (
                      <div className="rounded-lg overflow-hidden border border-slate-700">
                        <img src={previewItem.chart_url} alt="Graf" className="w-full" />
                        <div className="bg-slate-800 px-3 py-2">
                          <p className="text-xs text-slate-400">📊 Graf</p>
                        </div>
                      </div>
                    )}
                    {previewItem.card_url && (
                      <div className="rounded-lg overflow-hidden border border-slate-700">
                        <img src={previewItem.card_url} alt="Karta" className="w-full" />
                        <div className="bg-slate-800 px-3 py-2">
                          <p className="text-xs text-slate-400">🎴 Textová karta</p>
                        </div>
                      </div>
                    )}
                    {previewItem.image_url && (
                      <div className="rounded-lg overflow-hidden border border-slate-700">
                        <img src={previewItem.image_url} alt="Fotka" className="w-full" />
                        <div className="bg-slate-800 px-3 py-2">
                          <p className="text-xs text-slate-400">📷 Fotka</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
  editable,
  isEditing,
  editText,
  saving,
  isDeleting,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onDelete,
  onPreview,
}: {
  item: QueueItem;
  selected?: boolean;
  onToggle?: () => void;
  selectable?: boolean;
  editable?: boolean;
  isEditing?: boolean;
  editText?: string;
  saving?: boolean;
  isDeleting?: boolean;
  onEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onEditTextChange?: (text: string) => void;
  onDelete?: () => void;
  onPreview?: (item: QueueItem) => void;
}) {
  return (
    <div
      className={`bg-slate-900 border rounded-lg p-4 transition-colors ${
        selected ? 'border-emerald-500/50' : isEditing ? 'border-violet-500/50' : 'border-slate-800'
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

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editText}
                onChange={(e) => onEditTextChange?.(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={onSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Uložit
                </button>
                <button
                  onClick={onCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Zrušit
                </button>
                <span className="text-xs text-slate-500 ml-auto">{editText?.length || 0} znaků</span>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-300 whitespace-pre-line">{item.text_content}</p>
              
              {/* Visual assets preview */}
              {(item.image_url || item.chart_url || item.card_url) && (
                <div className="flex items-center gap-2 mt-2">
                  {item.chart_url && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                      <img src={item.chart_url} alt="Graf" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  {item.card_url && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                      <img src={item.card_url} alt="Karta" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  {item.image_url && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                      <img src={item.image_url} alt="Fotka" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isEditing && (
            <button
              onClick={() => onPreview?.(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors"
              title="Náhled"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          {editable && !isEditing && (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-slate-800 transition-colors"
                title="Upravit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Smazat"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
