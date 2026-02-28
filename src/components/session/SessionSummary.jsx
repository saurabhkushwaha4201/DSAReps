import React from 'react';
import { Trophy, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

/**
 * SessionSummary - Post-focus session completion modal
 * Shows stats, XP earned, and provides navigation back to dashboard
 */
export function SessionSummary({ isOpen, onClose, stats }) {
    const navigate = useNavigate();

    // Handle null/undefined stats
    if (!isOpen) return null;
    if (!stats) return null;

    const {
        problemsReviewed = 0,
        timeSpent = 0, // in minutes
        xpEarned = 0,
        perfectStreak = false
    } = stats;

    const handleBackToDashboard = () => {
        onClose();
        navigate('/');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Header with gradient */}
                <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center">
                    <div className="absolute top-0 left-0 right-0 h-full opacity-20">
                        <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white rounded-full animate-pulse" />
                        <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-white rounded-full animate-pulse delay-75" />
                    </div>

                    <div className="relative">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Session Complete! 🎉
                        </h2>
                        <p className="text-indigo-100 text-sm">
                            Great work! You're building consistency.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="p-6 space-y-4">

                    {/* Primary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Problems Reviewed */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700">
                            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                {problemsReviewed}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                Problems Reviewed
                            </div>
                        </div>

                        {/* XP Earned */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 text-center border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center justify-center gap-1">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                                    {xpEarned}
                                </div>
                            </div>
                            <div className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                XP Earned
                            </div>
                        </div>
                    </div>

                    {/* Time Spent */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                Time Invested
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {timeSpent} minutes of focused practice
                            </div>
                        </div>
                    </div>

                    {/* Perfect Streak Bonus */}
                    {perfectStreak && (
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🔥</span>
                                <div>
                                    <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                                        Perfect Session!
                                    </div>
                                    <div className="text-xs text-emerald-700 dark:text-emerald-400">
                                        All problems marked as "Good" or "Easy"
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Motivational Message */}
                    <div className="text-center py-2">
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                            "Consistency is the bridge between goals and accomplishment."
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <Button
                            onClick={handleBackToDashboard}
                            className="w-full gap-2"
                        >
                            <span>Back to Dashboard</span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>

                        <button
                            onClick={onClose}
                            className="w-full py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Calculate session stats from problem array
 * Helper function to generate stats object
 */
export function calculateSessionStats(problems) {
    const problemsReviewed = problems.length;
    const xpEarned = problemsReviewed * 15; // 15 XP per problem
    const timeSpent = problemsReviewed * 8; // Assume 8 min average per problem
    const perfectStreak = problems.every(p => p.rating !== 'AGAIN');

    return {
        problemsReviewed,
        xpEarned,
        timeSpent,
        perfectStreak
    };
}
