import React, { useEffect, useState } from 'react';
import { getAllProblems } from '../../api/problem.api';
import RevisionCard from './RevisionCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { SessionSummary, calculateSessionStats } from '../../components/session/SessionSummary';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const FocusMode = () => {
    const [revisions, setRevisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completedProblems, setCompletedProblems] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [sessionStats, setSessionStats] = useState(null);

    useEffect(() => {
        fetchRevisions();
    }, []);

    const fetchRevisions = async () => {
        try {
            const data = await getAllProblems();
            const active = (data || []).filter(p => (p.status || 'active') !== 'archived');
            setRevisions(active);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load revisions");
        } finally {
            setLoading(false);
        }
    };

    const handleRevise = async (id) => {
        try {
            const problem = revisions.find(p => (p._id || p.id) === id);

            toast.success("Problem revised!");

            if (problem) {
                setCompletedProblems(prev => [...prev, { ...problem, rating: 'GOOD' }]);
            }

            setRevisions(prev => prev.filter(p => (p._id || p.id) !== id));
        } catch (error) {
            console.error(error);
            toast.error("Failed to save revision");
        }
    };

    const handleFinishSession = () => {
        if (completedProblems.length === 0) {
            toast.error("Complete at least one problem to finish session");
            return;
        }

        const stats = calculateSessionStats(completedProblems);
        setSessionStats(stats);
        setShowSummary(true);
    };

    const handleCloseSummary = () => {
        setShowSummary(false);
        setCompletedProblems([]);
    };

    if (loading) return (
        <div className="space-y-6 max-w-4xl mx-auto pt-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pt-4">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Today's Focus</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-100 dark:border-indigo-800">{revisions.length} problems</span> waiting for review.
                </p>
            </div>

            {/* Progress Indicator */}
            {completedProblems.length > 0 && (
                <div className="p-4 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                                    Great Progress!
                                </div>
                                <div className="text-xs text-emerald-700 dark:text-emerald-400">
                                    {completedProblems.length} problem{completedProblems.length > 1 ? 's' : ''} completed
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleFinishSession}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            🎉 Finish Session
                        </button>
                    </div>
                </div>
            )}

            {revisions.length > 0 ? (
                <div className="space-y-4">
                    {revisions.map(problem => (
                        <RevisionCard
                            key={problem._id || problem.id}
                            problem={problem}
                            onRevise={handleRevise}
                        />
                    ))}
                </div>
            ) : completedProblems.length > 0 ? (
                /* All done - show finish button */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                >
                    <div className="w-20 h-20 mx-auto mb-4 bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        All Done for Today! 🎉
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        You completed {completedProblems.length} problem{completedProblems.length > 1 ? 's' : ''}. Amazing work!
                    </p>
                    <button
                        onClick={handleFinishSession}
                        className="px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                        🏆 View Session Summary
                    </button>
                </motion.div>
            ) : (
                /* Nothing to do */
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <EmptyState
                        title="All caught up!"
                        description="You've completed all your revisions for today. Keep up the streak!"
                        actionLabel="Go to Dashboard"
                        onAction={() => window.location.href = '/'}
                    />
                </motion.div>
            )}

            {/* Session Summary Modal */}
            <SessionSummary
                isOpen={showSummary}
                onClose={handleCloseSummary}
                stats={sessionStats}
            />
        </div>
    );
};

export default FocusMode;
