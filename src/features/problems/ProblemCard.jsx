import React, { useState } from 'react';
import { Archive, RotateCcw, ExternalLink, CheckCircle, StickyNote, CalendarClock, Pin, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useLocalData } from '../../hooks/useLocalData';
import { rescheduleProblem } from '../../api/problem.api';
import toast from 'react-hot-toast';

const PLATFORM_COLORS = {
    leetcode:   { dot: 'bg-orange-500',  text: 'text-orange-600 dark:text-orange-400' },
    codeforces: { dot: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400' },
    cses:       { dot: 'bg-cyan-500',    text: 'text-cyan-600 dark:text-cyan-400' },
    gfg:        { dot: 'bg-green-500',   text: 'text-green-600 dark:text-green-400' },
    other:      { dot: 'bg-gray-400',    text: 'text-gray-500 dark:text-gray-400' },
};

function PlatformBadge({ platform }) {
    const p = platform?.toLowerCase() || 'other';
    const colors = PLATFORM_COLORS[p] || PLATFORM_COLORS.other;
    const labels = { leetcode: 'LeetCode', codeforces: 'Codeforces', cses: 'CSES', gfg: 'GFG', other: 'Other' };
    return (
        <span className={`inline-flex items-center gap-1.5 font-medium ${colors.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {labels[p] || p}
        </span>
    );
}

export default function ProblemCard({ problem, onMarkRevised, onArchive, onRestore, onOpenNotes, onReschedule }) {
    const isOnline = useOnlineStatus();
    const { getProblemNote } = useLocalData();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduling, setRescheduling] = useState(false);

    // Normalization
    const id = problem._id || problem.id;
    const isArchived = problem.status === 'archived';
    const hasNotes = !!getProblemNote(id);
    const isPinned = problem.isManualOverride;

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const handleReschedule = async () => {
        if (!rescheduleDate) {
            toast.error('Pick a date first');
            return;
        }
        setRescheduling(true);
        try {
            await rescheduleProblem(id, rescheduleDate);
            toast.success('Problem pinned to ' + rescheduleDate);
            setShowDatePicker(false);
            setRescheduleDate('');
            onReschedule?.();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to reschedule';
            toast.error(msg);
        } finally {
            setRescheduling(false);
        }
    };

    return (
        <Card className={`group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between p-4 hover:border-indigo-200 transition-colors border-l-4 ${isPinned ? 'border-l-indigo-500' : 'border-l-slate-200'} ${isArchived ? 'opacity-60 bg-slate-50 dark:bg-slate-900/50' : ''}`}>

            {/* LEFT: Info */}
            <div className="flex items-center gap-4 min-w-0 flex-1 mb-2 md:mb-0">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${problem.difficulty === 'Hard' ? 'bg-red-500' :
                    problem.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        {problem.url ? (
                            <a
                                href={problem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-semibold text-lg text-slate-900 dark:text-white truncate pr-2 hover:text-indigo-600 transition-colors ${isArchived ? 'line-through decoration-slate-400' : ''}`}
                                title="Open problem on platform"
                            >
                                {problem.title}
                            </a>
                        ) : (
                            <h3 className={`font-semibold text-lg text-slate-900 dark:text-white truncate pr-2 ${isArchived ? 'line-through decoration-slate-400' : ''}`}>
                                {problem.title}
                            </h3>
                        )}
                        {hasNotes && <StickyNote className="w-3 h-3 text-slate-400" />}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <PlatformBadge platform={problem.platform} />
                        <span>•</span>
                        <span>{problem.difficulty}</span>
                        {isPinned && (
                            <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                                    <Pin className="w-3 h-3" /> Pinned
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Actions - Always visible */}
            <div className="flex items-center gap-3 mt-2 md:mt-0 z-10">
                {!isArchived ? (
                    <>
                        {/* External Link */}
                        {problem.url && (
                            <a href={problem.url} target="_blank" rel="noopener noreferrer" className="transition-opacity cursor-pointer">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </a>
                        )}

                        {/* Notes Button */}
                        <button
                            onClick={() => onOpenNotes(problem)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Edit Notes"
                        >
                            <StickyNote className="w-4 h-4" />
                        </button>

                        {/* Reschedule */}
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            disabled={!isOnline}
                            className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                isPinned
                                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                            }`}
                            title="Reschedule / Pin to date"
                        >
                            <CalendarClock className="w-4 h-4" />
                        </button>

                        {/* Mark Revised */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-opacity"
                            onClick={() => onMarkRevised(problem)}
                            title="Mark as Revised"
                        >
                            <CheckCircle className="w-4 h-4" />
                        </Button>

                        {/* Archive */}
                        <button
                            onClick={() => onArchive(id)}
                            disabled={!isOnline}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Archive Problem"
                        >
                            <Archive size={18} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => onRestore(id)}
                        disabled={!isOnline}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RotateCcw size={14} /> Restore
                    </button>
                )}
            </div>
            {/* Inline date picker */}
            {showDatePicker && (
                <div className="w-full mt-2 flex items-center gap-2 px-4 pb-2">
                    <input
                        type="date"
                        min={today}
                        max={maxDate}
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                        onClick={handleReschedule}
                        disabled={rescheduling || !rescheduleDate}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
                    >
                        {rescheduling ? 'Pinning...' : 'Pin'}
                    </button>
                    <button
                        onClick={() => { setShowDatePicker(false); setRescheduleDate(''); }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </Card>
    );
};
