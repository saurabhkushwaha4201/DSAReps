import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { saveProblem } from '../../api/problem.api';
import toast from 'react-hot-toast';

// ── Lightweight platform detection (mirrors platformConfigs.js) ──
const PLATFORM_MAP = [
  { host: 'leetcode.com', platform: 'leetcode', label: 'LeetCode' },
  { host: 'codeforces.com', platform: 'codeforces', label: 'Codeforces' },
  { host: 'cses.fi', platform: 'cses', label: 'CSES' },
  { host: 'geeksforgeeks.org', platform: 'gfg', label: 'GFG' },
];

function detectPlatform(url) {
  try {
    const { hostname } = new URL(url);
    for (const p of PLATFORM_MAP) {
      if (hostname.includes(p.host)) return p.platform;
    }
  } catch {
    // invalid URL
  }
  return 'other';
}

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function AddProblemModal({ isOpen, onClose, onAdded }) {
  const [form, setForm] = useState({
    url: '',
    title: '',
    platform: 'leetcode',
    difficulty: 'medium',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Auto-detect platform when URL changes
  useEffect(() => {
    if (form.url.length > 10) {
      const detected = detectPlatform(form.url);
      setForm((f) => ({ ...f, platform: detected }));
    }
  }, [form.url]);

  const handleChange = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.url || !form.title) {
      toast.error('URL and Title are required');
      return;
    }

    setSaving(true);
    try {
      const res = await saveProblem({
        url: form.url.trim(),
        title: form.title.trim(),
        platform: form.platform,
        difficulty: form.difficulty,
        notes: form.notes.trim(),
      });

      if (res.isDuplicate) {
        toast('Problem already tracked!', { icon: '📌' });
      } else {
        toast.success('Problem added!');
      }

      onAdded?.();
      onClose();
      setForm({ url: '', title: '', platform: 'leetcode', difficulty: 'medium', notes: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Problem</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Problem URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://leetcode.com/problems/two-sum/"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Two Sum"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Platform + Difficulty row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => handleChange('platform', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="leetcode">LeetCode</option>
                <option value="codeforces">Codeforces</option>
                <option value="cses">CSES</option>
                <option value="gfg">GFG</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
              <div className="flex gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleChange('difficulty', d)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      form.difficulty === d
                        ? d === 'easy'
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-400'
                          : d === 'medium'
                          ? 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-400'
                          : 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400'
                        : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Key patterns, edge cases, approach..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {saving ? 'Saving...' : 'Add Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
