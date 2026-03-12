import React, { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Difficulty Mastery — shows average stability per difficulty tag.
 * Only counts problems that have been revised at least once.
 * Expects weakClusters: Array<{ tag: string, avgStability: number, revisedCount: number, totalCount: number }>
 */

const TAG_COLORS = {
  hard: { bar: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
  medium: { bar: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
  easy: { bar: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
};

const DEFAULT_COLOR = { bar: 'bg-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' };

export default function WeakClusters({ weakClusters = [] }) {
  const [infoVisible, setInfoVisible] = useState(false);
  // Sort by lowest stability first (weakest on top)
  const sorted = [...weakClusters].sort((a, b) => (a.avgStability ?? 0) - (b.avgStability ?? 0));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Difficulty Mastery
        </h3>
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setInfoVisible(true)}
            onMouseLeave={() => setInfoVisible(false)}
            onFocus={() => setInfoVisible(true)}
            onBlur={() => setInfoVisible(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="What is stability score?"
          >
            <Info className="w-4 h-4" />
          </button>
          {infoVisible && (
            <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 shadow-lg z-50 pointer-events-none">
              <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">What is Stability?</p>
              <p>Average mastery across your <strong>revised</strong> problems per difficulty. Rises with correct recalls, drops on forgetting.</p>
              <p className="mt-1">Unrevised problems are excluded until you attempt them at least once.</p>
              <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-800" />
            </div>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          No data yet. Save some problems to see your mastery.
        </p>
      ) : (
        <div className="space-y-4">
          {sorted.map((cluster, index) => {
            const colors = TAG_COLORS[cluster.tag?.toLowerCase()] || DEFAULT_COLOR;
            const hasRevisions = cluster.revisedCount > 0;
            return (
              <div key={cluster.tag ?? index} className={!hasRevisions ? 'opacity-50' : ''}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {cluster.tag}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {hasRevisions
                        ? `${cluster.revisedCount} of ${cluster.totalCount} revised`
                        : `${cluster.totalCount} problem${cluster.totalCount !== 1 ? 's' : ''} · not yet revised`}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {hasRevisions ? `${cluster.avgStability}%` : '—'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  {hasRevisions ? (
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${colors.bar}`}
                      style={{ width: `${cluster.avgStability}%` }}
                    />
                  ) : (
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 w-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
