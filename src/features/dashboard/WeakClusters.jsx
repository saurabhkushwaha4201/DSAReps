import React from 'react';

/**
 * Weak Clusters — shows average stability per difficulty tag.
 * Highlights areas that need the most attention.
 * Expects weakClusters: Array<{ tag: string, avgStability: number, count: number }>
 */

const TAG_COLORS = {
  hard: { bar: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
  medium: { bar: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
  easy: { bar: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
};

const DEFAULT_COLOR = { bar: 'bg-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' };

export default function WeakClusters({ weakClusters = [] }) {
  // Sort by lowest stability first (weakest on top)
  const sorted = [...weakClusters].sort((a, b) => a.avgStability - b.avgStability);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Weak Clusters
      </h3>

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          No data yet. Save some problems to see your weak areas.
        </p>
      ) : (
        <div className="space-y-4">
          {sorted.map((cluster) => {
            const colors = TAG_COLORS[cluster.tag?.toLowerCase()] || DEFAULT_COLOR;
            return (
              <div key={cluster.tag}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {cluster.tag}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {cluster.count} problem{cluster.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {cluster.avgStability}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${colors.bar}`}
                    style={{ width: `${cluster.avgStability}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
