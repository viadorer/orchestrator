'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface EditPostModalProps {
  postId: string;
  initialText: string;
  onSave: (text: string, feedbackNote: string) => void;
  onClose: () => void;
  saving?: boolean;
}

export function EditPostModal({ postId, initialText, onSave, onClose, saving }: EditPostModalProps) {
  const [editText, setEditText] = useState(initialText);
  const [feedbackNote, setFeedbackNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Upravit příspěvek</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Text příspěvku</label>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={Math.min(20, Math.max(8, editText.split('\n').length + 2))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
              placeholder="Zadej text příspěvku..."
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-500">{editText.length} znaků</span>
              {editText !== initialText && (
                <span className="text-xs text-amber-400">Upraveno</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Poznámka pro Huga (volitelné)</label>
            <input
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Např. 'Zkrátit hook', 'Víc dat', 'Změnit tón'..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Hugo se z tvých úprav učí a zlepšuje budoucí příspěvky
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={() => onSave(editText, feedbackNote)}
            disabled={saving || editText === initialText}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Ukládám...' : 'Uložit úpravu'}
          </button>
        </div>
      </div>
    </div>
  );
}
