import React, { useState, useEffect, useMemo } from 'react';
import ProblemCard from './ProblemCard';
import AddProblemModal from './AddProblemModal';
import { NotesDrawer } from '../../components/notes/NotesDrawer';
import toast from 'react-hot-toast';
import { getAllProblems, archiveProblem, unarchiveProblem, reviseProblem } from '../../api/problem.api';
import { Loader2, ChevronDown, Plus } from 'lucide-react';

// --- MOCK DATA (Fallback) ---
const INITIAL_PROBLEMS = [
    { _id: '1', title: "Two Sum", difficulty: "Easy", platform: "LeetCode", nextReviewDate: new Date(Date.now() - 86400000).toISOString(), status: 'active' },
    { _id: '2', title: "LRU Cache", difficulty: "Medium", platform: "LeetCode", nextReviewDate: new Date().toISOString(), status: 'active' },
    { _id: '3', title: "Merge K Lists", difficulty: "Hard", platform: "LeetCode", nextReviewDate: new Date(Date.now() + 86400000).toISOString(), status: 'active' },
];

export default function ProblemList() {
    const [problems, setProblems] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [view, setView] = useState('active'); // 'active' | 'archived'
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Global NotesDrawer state
    const [activeProblem, setActiveProblem] = useState(null);
    // Add Problem modal
    const [showAddModal, setShowAddModal] = useState(false);
    // Rating picker: { id, title } of problem being rated, or null
    const [ratingTarget, setRatingTarget] = useState(null);

    // Helpers
    const getId = (prob) => prob._id || prob.id;

    useEffect(() => {
        loadProblems(1);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadProblems(1);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const loadProblems = async (pageNum) => {
        try {
            if (pageNum === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const data = await getAllProblems({ page: pageNum, limit: 20 });

            // Handle both paginated response and array response
            const problemsData = data.problems || data;
            const hasMoreData = data.hasMore !== undefined ? data.hasMore : false;

            if (pageNum === 1) {
                setProblems(problemsData.length > 0 ? problemsData : INITIAL_PROBLEMS);
            } else {
                setProblems(prev => [...prev, ...problemsData]);
            }

            setHasMore(hasMoreData);
            setPage(pageNum);
        } catch (e) {
            console.error(e);
            if (pageNum === 1) {
                setProblems(INITIAL_PROBLEMS);
            }
            toast.error('Failed to load problems');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // 1. Filter & Sort Logic
    const visibleProblems = useMemo(() => {
        let filtered = problems;

        // A. Filter by Difficulty/Platform
        if (activeFilter !== 'All') {
            const filter = activeFilter.toLowerCase();
            filtered = filtered.filter(p => {
                const diff = p.difficulty?.toLowerCase() || '';
                const plat = p.platform?.toLowerCase() || '';
                return diff === filter || plat === filter;
            });
        }

        // B. Filter by Archive Status
        filtered = filtered.filter(p => {
            const status = p.status || 'active';
            return view === 'active' ? status !== 'archived' : status === 'archived';
        });

        return filtered;
    }, [problems, activeFilter, view]);

    // 2. Handlers
    const handleArchive = async (id) => {
        setProblems(prev => prev.map(p => getId(p) === id ? { ...p, status: 'archived' } : p));
        try {
            await archiveProblem(id);
            toast.success("Problem archived");
        } catch (error) {
            console.error(error);
            toast.error("Failed to archive");
            // Revert state if needed (omitted for brevity)
        }
    };

    const handleRestore = async (id) => {
        setProblems(prev => prev.map(p => getId(p) === id ? { ...p, status: 'active' } : p));
        try {
            await unarchiveProblem(id);
            toast.success("Problem restored");
        } catch (error) {
            console.error(error);
            toast.error("Failed to restore");
        }
    };

    const handleMarkRevised = (problem) => {
        setRatingTarget({ id: getId(problem), title: problem.title });
    };

    const handleRatingSubmit = async (rating) => {
        if (!ratingTarget) return;
        const { id } = ratingTarget;
        setRatingTarget(null);
        try {
            await reviseProblem(id, rating);
            toast.success(`Marked as revised (${rating.toLowerCase()})`)
        } catch (err) {
            toast.error('Failed to save revision');
        }
    };

    const handleReschedule = (id, date) => {
        setProblems(prev => prev.map(p =>
            getId(p) === id
                ? { ...p, nextReviewDate: date.toISOString(), isManualOverride: true }
                : p
        ));
    };

    // Update notes in local state when saved in NotesDrawer
    const handleNotesUpdate = (problemId, newNotes) => {
        setProblems(prev => prev.map(p =>
            getId(p) === problemId ? { ...p, notes: newNotes } : p
        ));
    };

    // Open global NotesDrawer for a specific problem
    const handleOpenNotes = (problem) => {
        setActiveProblem(problem);
    };

    // Color-coded filter styling with improved contrast
    const getFilterStyle = (filter, isActive) => {
        const styles = {
            'All': {
                base: 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-600',
                active: 'bg-indigo-600 text-white border border-indigo-600'
            },
            'Easy': {
                base: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-transparent dark:border-emerald-500/30',
                active: 'bg-emerald-600 text-white border border-emerald-600'
            },
            'Medium': {
                base: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-transparent dark:border-amber-500/30',
                active: 'bg-amber-500 text-white border border-amber-500'
            },
            'Hard': {
                base: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border border-transparent dark:border-red-500/30',
                active: 'bg-red-600 text-white border border-red-600'
            },
            'LeetCode': {
                base: 'bg-orange-50 dark:bg-[rgba(255,161,22,0.15)] text-orange-700 dark:text-[#FFB84D] border border-transparent dark:border-orange-500/30',
                active: 'bg-orange-500 text-white border border-orange-500'
            },
            'Codeforces': {
                base: 'bg-blue-50 dark:bg-[rgba(49,140,231,0.15)] text-blue-700 dark:text-[#66B2FF] border border-transparent dark:border-blue-500/30',
                active: 'bg-blue-600 text-white border border-blue-600'
            },
            'CSES': {
                base: 'bg-cyan-50 dark:bg-[rgba(6,182,212,0.15)] text-cyan-700 dark:text-[#67E8F9] border border-transparent dark:border-cyan-500/30',
                active: 'bg-cyan-600 text-white border border-cyan-600'
            },
            'GFG': {
                base: 'bg-green-50 dark:bg-[rgba(34,197,94,0.15)] text-green-700 dark:text-[#86EFAC] border border-transparent dark:border-green-500/30',
                active: 'bg-green-600 text-white border border-green-600'
            },
            'Other': {
                base: 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-500/30',
                active: 'bg-gray-600 text-white border border-gray-600'
            },
        };
        return isActive ? styles[filter]?.active : styles[filter]?.base;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading problems...</div>;

    return (
        <div className="space-y-8">

            {/* Header: Tabs & Add Button */}
            <div className="flex items-center justify-between gap-3">
                {/* Tabs - consistent height h-9 */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg w-fit">
                    <button
                        onClick={() => setView('active')}
                        className={`h-9 px-5 text-sm font-medium rounded-md transition-all cursor-pointer ${view === 'active' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setView('archived')}
                        className={`h-9 px-5 text-sm font-medium rounded-md transition-all cursor-pointer ${view === 'archived' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'}`}
                    >
                        Archived
                    </button>
                </div>

                {/* Add Problem button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="h-9 px-4 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Problem</span>
                </button>
            </div>

            {/* Filter Bar - Better spacing and alignment */}
            <div className="p-2 bg-white dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-700 w-full md:w-fit">
                {/* Mobile: Two rows with consistent grid */}
                <div className="flex flex-col gap-2 md:hidden">
                    {/* Row 1: Difficulty filters - 4 equal columns */}
                    <div className="grid grid-cols-4 gap-1.5">
                        {['All', 'Easy', 'Medium', 'Hard'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`h-9 px-2 text-xs font-medium rounded-md transition-all cursor-pointer ${getFilterStyle(filter, activeFilter === filter)} ${activeFilter === filter ? 'shadow-sm ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-current/20' : 'hover:opacity-80 hover:scale-105 active:scale-95'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                    {/* Row 2: Platform filters */}
                    <div className="grid grid-cols-2 gap-1.5">
                        {['LeetCode', 'Codeforces', 'CSES', 'GFG'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`h-9 px-2 text-xs font-medium rounded-md transition-all cursor-pointer ${getFilterStyle(filter, activeFilter === filter)} ${activeFilter === filter ? 'shadow-sm ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-current/20' : 'hover:opacity-80 hover:scale-105 active:scale-95'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop: Single row */}
                <div className="hidden md:flex items-center gap-2">
                    {['All', 'Easy', 'Medium', 'Hard', 'LeetCode', 'Codeforces', 'CSES', 'GFG'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`h-9 px-4 text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${getFilterStyle(filter, activeFilter === filter)} ${activeFilter === filter ? 'shadow-sm ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-current/20' : 'hover:opacity-80 hover:scale-105 active:scale-95'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {visibleProblems.length > 0 ? (
                    <>
                        {visibleProblems.map((prob) => (
                            <ProblemCard
                                key={getId(prob)}
                                problem={prob}
                                onMarkRevised={handleMarkRevised}
                                onArchive={handleArchive}
                                onRestore={handleRestore}
                                onOpenNotes={handleOpenNotes}
                                onReschedule={handleReschedule}
                            />
                        ))}
                    </>
                ) : view === 'active' ? (
                    /* Head Start Section - Only for Active view when empty */
                    <HeadStartSection problems={problems} onOpenNotes={handleOpenNotes} />
                ) : (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        No archived problems found.
                    </div>
                )}
            </div>

            {/* Load More Button */}
            {hasMore && !loading && visibleProblems.length > 0 && view === 'active' && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => loadProblems(page + 1)}
                        disabled={loadingMore}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading more...
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                Load More Problems
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Global NotesDrawer - Single instance for all problems */}
            <NotesDrawer
                isOpen={!!activeProblem}
                onClose={() => setActiveProblem(null)}
                problemId={activeProblem?._id || activeProblem?.id}
                initialNotes={activeProblem?.notes || ''}
                onNotesUpdate={handleNotesUpdate}
            />

            {/* Add Problem Modal */}
            <AddProblemModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdded={() => loadProblems(1)}
            />

            {/* Rating Picker Modal */}
            {ratingTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRatingTarget(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 w-[420px] mx-4" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <span className="text-2xl">🧠</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">How did it go?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs mx-auto">{ratingTarget.title}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => handleRatingSubmit('CLEAN')}
                                className="cursor-pointer flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all duration-150"
                            >
                                <span className="text-3xl">✅</span>
                                <span className="text-sm font-bold">Clean</span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">Got it</span>
                            </button>
                            <button
                                onClick={() => handleRatingSubmit('SLOW')}
                                className="cursor-pointer flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all duration-150"
                            >
                                <span className="text-3xl">🐢</span>
                                <span className="text-sm font-bold">Slow</span>
                                <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">Struggled</span>
                            </button>
                            <button
                                onClick={() => handleRatingSubmit('FORGOT')}
                                className="cursor-pointer flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all duration-150"
                            >
                                <span className="text-3xl">❌</span>
                                <span className="text-sm font-bold">Forgot</span>
                                <span className="text-xs text-red-600 dark:text-red-500 font-medium">Blanked</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setRatingTarget(null)}
                            className="cursor-pointer mt-5 w-full py-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-150"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * HeadStartSection - Shown when all due items are complete
 * Suggests next 3 upcoming problems to get a head start
 */
function HeadStartSection({ problems, onOpenNotes }) {
    // Get next 3 upcoming problems (earliest nextReviewDate)
    const upcomingProblems = useMemo(() => {
        return problems
            .filter(p => {
                const status = p.status || 'active';
                return status === 'active';  // Only active problems
            })
            .filter(p => {
                const nextDate = p.nextReviewDate;
                if (!nextDate) return false;
                const reviewDate = new Date(nextDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);  // Start of today
                return reviewDate > today;  // Future dates only
            })
            .sort((a, b) => {
                const dateA = new Date(a.nextReviewDate);
                const dateB = new Date(b.nextReviewDate);
                return dateA - dateB;
            })
            .slice(0, 3);
    }, [problems]);

    if (upcomingProblems.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Mission Complete!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    You're all caught up! No active problems found. Add more problems from any supported platform.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🎉</span>
                </div>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-300 mb-2">
                    All Caught Up!
                </h3>
                <p className="text-emerald-700 dark:text-emerald-400 text-sm">
                    You've completed all your revisions for today. Excellent work!
                </p>
            </div>

            {/* Head Start Section */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🚀</span>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Get a Head Start
                        </h4>
                    </div>
                    <div className="flex-1 h-px bg-linear-to-r from-indigo-200 to-transparent dark:from-indigo-800" />
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    These problems are coming up soon. Review them now to stay ahead of schedule:
                </p>

                <div className="grid gap-3">
                    {upcomingProblems.map((problem) => (
                        <ProblemCard
                            key={problem._id || problem.id}
                            problem={problem}
                            onMarkRevised={handleMarkRevised}
                            onArchive={() => { }}
                            onRestore={() => { }}
                            onOpenNotes={onOpenNotes}
                        />
                    ))}
                </div>

                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs text-indigo-800 dark:text-indigo-300">
                        💡 <strong>Pro Tip:</strong> Getting ahead helps build buffer for busy days. Even 15 minutes counts!
                    </p>
                </div>
            </div>
        </div>
    );
}
