import React, { useEffect, useState } from 'react';
import { getTodayTasks, reviseProblem, getUserSettings } from '../../api/problem.api';
import { CheckCircle2, AlertTriangle, Zap, RotateCcw, Pin, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const REVIEW_TYPE_LABEL = {
  MICRO_RECALL: { label: 'Micro Recall', icon: Zap, color: 'text-emerald-500' },
  PATTERN_REBUILD: { label: 'Pattern Rebuild', icon: RotateCcw, color: 'text-amber-500' },
  FULL_RECODE: { label: 'Full Recode', icon: AlertTriangle, color: 'text-red-500' },
};

export default function TodayTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingId, setRatingId] = useState(null);
  const [dailyCap, setDailyCap] = useState(3);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await getTodayTasks();
      setTasks(data?.problems || []);
    } catch (err) {
      console.error('Failed to load today tasks', err);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [, settingsData] = await Promise.all([
          fetchTasks(),
          getUserSettings(),
        ]);
        setDailyCap(settingsData?.settings?.dailyGoal || 3);
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
      await fetchTasks();
      if (tasks.length === 0) {
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Today's Tasks
        </h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
          {tasks.length}/{dailyCap}
        </span>
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
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Revise More
          </button>
        </div>
      ) : (
        <div className="space-y-3">
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
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-50">
                    {task.title}
                  </h4>
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

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className={`flex items-center gap-1 ${reviewInfo.color}`}>
                    <Icon className="w-3 h-3" />
                    {reviewInfo.label}
                  </span>
                  <span>Stability: {task.stabilityScore}%</span>
                  {task.isManualOverride && (
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={ratingId === task._id}
                    onClick={() => handleRate(task._id, 'FORGOT')}
                    className="py-1.5 text-xs font-semibold rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                  >
                    Forgot
                  </button>
                  <button
                    disabled={ratingId === task._id}
                    onClick={() => handleRate(task._id, 'SLOW')}
                    className="py-1.5 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors"
                  >
                    Slow
                  </button>
                  <button
                    disabled={ratingId === task._id}
                    onClick={() => handleRate(task._id, 'CLEAN')}
                    className="py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 transition-colors"
                  >
                    Clean
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
