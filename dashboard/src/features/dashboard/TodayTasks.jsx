import React, { useEffect, useState } from 'react';
import { getTodayTasks, reviseProblem, getUserSettings } from '../../api/problem.api';
import { CheckCircle2, AlertTriangle, Zap, RotateCcw, Pin, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import * as Tooltip from '@radix-ui/react-tooltip';
import PlatformIcon from '../../components/ui/PlatformIcon';

const REVIEW_TYPE_LABEL = {
  MICRO_RECALL:    { label: 'Micro Recall',    icon: Zap,           color: 'text-emerald-500', tooltip: 'Well retained! A quick mental run-through is enough.' },
  PATTERN_REBUILD: { label: 'Pattern Rebuild', icon: RotateCcw,     color: 'text-amber-500',  tooltip: 'Pattern is fading. Think through the approach before you start coding.' },
  FULL_RECODE:     { label: 'Full Recode',     icon: AlertTriangle, color: 'text-red-500',    tooltip: 'Almost forgotten. Solve it completely from scratch, like the first time.' },
};

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return 'last month';
  return `${Math.floor(days / 30)} months ago`;
}

export default function TodayTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingId, setRatingId] = useState(null);
  const [dailyCap, setDailyCap] = useState(3);
  const [refreshing, setRefreshing] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTasks = async () => {
    try {
      const data = await getTodayTasks();
      const problems = data?.problems || [];
      setTasks(problems);
      return problems;
    } catch (err) {
      console.error('Failed to load today tasks', err);
      return [];
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [problems, settingsData] = await Promise.all([
          fetchTasks(),
          getUserSettings(),
        ]);
        setDailyCap(settingsData?.settings?.dailyGoal || 3);
        setTotalCount(problems.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRate = async (id, rating) => {
    setRatingId(id);
    try {
      await reviseProblem(id, rating);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setDoneCount((c) => c + 1);
      toast.success(`Rated ${rating.toLowerCase()}`);
    } catch (err) {
      console.error(err);
      toast.error('Rating failed');
    } finally {
      setRatingId(null);
    }
  };

  const handleReviseMore = async () => {
    setRefreshing(true);
    try {
      const newTasks = await fetchTasks();
      setTotalCount(doneCount + newTasks.length);
      if (newTasks.length === 0) {
        toast('No more problems due right now', { icon: '📭' });
      }
    } catch {
      toast.error('Failed to fetch more');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <Tooltip.Provider delayDuration={200}>
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Today's Tasks
        </h3>
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
          )}
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
            {doneCount}/{totalCount || dailyCap}
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            All done for today!
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No reviews pending. Enjoy your day.
          </p>
          <button
            onClick={handleReviseMore}
            disabled={refreshing}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Revise More
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-105 overflow-y-auto pr-1 custom-scrollbar">
          {tasks.map((task) => {
            const reviewInfo = REVIEW_TYPE_LABEL[task.nextReviewType] || {
              label: 'Review',
              icon: RotateCcw,
              color: 'text-slate-500',
            };
            const Icon = reviewInfo.icon;

            return (
              <div
                key={task._id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <PlatformIcon url={task.url || ''} />
                    {typeof task.url === 'string' && task.url.trim() ? (
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={task.title}
                        className="text-sm font-semibold text-slate-900 dark:text-white truncate hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {task.title}
                      </a>
                    ) : (
                      <span
                        title={task.title}
                        className="text-sm font-semibold text-slate-900 dark:text-white truncate"
                      >
                        {task.title}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      task.difficulty === 'hard'
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : task.difficulty === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {task.difficulty}
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {/* Review type — Radix tooltip */}
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <span className={`cursor-help flex items-center gap-1 border-b border-dashed pb-px ${reviewInfo.color} border-current`}>
                        <Icon className="w-3 h-3" />
                        {reviewInfo.label}
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="z-50 w-52 p-2 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg shadow-xl text-xs text-center leading-relaxed animate-in fade-in-0 zoom-in-95"
                        sideOffset={5}
                      >
                        {reviewInfo.tooltip}
                        <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>

                  {/* Stability — Radix tooltip */}
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <span className="cursor-help border-b border-dashed border-slate-400/50 pb-px">
                        Stability: {task.stabilityScore ?? 'N/A'}{task.stabilityScore == null ? '' : '%'}
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="z-50 w-56 p-2 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg shadow-xl text-xs text-center leading-relaxed animate-in fade-in-0 zoom-in-95"
                        sideOffset={5}
                      >
                        How well this problem is retained in memory. Higher = better recall.
                        <div className="mt-1.5 flex justify-center gap-2 text-[10px]">
                          <span className="text-red-400">&lt;40% Recode</span>
                          <span className="text-amber-400">40–69% Rebuild</span>
                          <span className="text-emerald-400">≥70% Recall</span>
                        </div>
                        <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>

                  {task.lastRevised && (
                    <span className="text-slate-400 dark:text-slate-500">
                      • {timeAgo(task.lastRevised)}
                    </span>
                  )}

                  {task.isManualOverride && (
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium" title="Manually scheduled by you">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        disabled={ratingId === task._id}
                        onClick={() => handleRate(task._id, 'FORGOT')}
                        className="py-1.5 text-xs font-semibold rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Forgot
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="z-50 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-lg shadow-xl whitespace-nowrap animate-in fade-in-0 zoom-in-95"
                        sideOffset={5}
                      >
                        Complete blank. Reset progress.
                        <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        disabled={ratingId === task._id}
                        onClick={() => handleRate(task._id, 'SLOW')}
                        className="py-1.5 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Slow
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="z-50 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-lg shadow-xl whitespace-nowrap animate-in fade-in-0 zoom-in-95"
                        sideOffset={5}
                      >
                        Remembered with effort. Minor boost.
                        <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        disabled={ratingId === task._id}
                        onClick={() => handleRate(task._id, 'CLEAN')}
                        className="py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Clean
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="z-50 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded-lg shadow-xl whitespace-nowrap animate-in fade-in-0 zoom-in-95"
                        sideOffset={5}
                      >
                        Perfect recall. Max stability.
                        <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </Tooltip.Provider>
  );
}
