import React, { useState, useRef } from 'react';
import { Archive, RotateCcw, Calendar, ExternalLink, CheckCircle, Zap, StickyNote, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ReschedulePopover } from './ReschedulePopover';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useLocalData } from '../../hooks/useLocalData';
import { calculateMasteryLevel, getUrgencyScore } from '../../lib/intelligence';
import toast from 'react-hot-toast';

export default function ProblemCard({ problem, onMarkRevised, onArchive, onRestore, onReschedule, onOpenNotes }) {
    const [showSchedule, setShowSchedule] = useState(false);
    const scheduleRef = useRef(null);
    const isOnline = useOnlineStatus();
    const { getProblemNote } = useLocalData();

    // Normalization
    const id = problem._id || problem.id;
    const isArchived = problem.status === 'archived';
    const hasNotes = !!getProblemNote(id);
    const masteryLevel = calculateMasteryLevel(problem);
    const urgency = getUrgencyScore(problem);

    const handleDateSelect = (newDate) => {
        onReschedule(id, newDate);
        toast.success(`Rescheduled to ${format(newDate, 'MMM d')}`);
    };

    const getMasteryColor = (level) => {
        if (level === 0) return 'bg-slate-100';
        if (level < 3) return 'bg-emerald-200'; // Familiar
        return 'bg-emerald-500'; // Mastered
    };

    return (
        <Card className={`group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between p-4 hover:border-indigo-200 transition-colors border-l-4 ${urgency.color} ${isArchived ? 'opacity-60 bg-slate-50 dark:bg-slate-900/50' : ''}`}>

            {/* Visual: Mastery Progress Bar (Segmented) */}
            <div className="absolute bottom-0 left-0 w-full flex gap-0.5 h-1.5 opacity-80 pointer-events-none">
                {[1, 2, 3, 4, 5].map((step) => (
                    <div
                        key={step}
                        className={`flex-1 ${step <= masteryLevel ? getMasteryColor(masteryLevel) : 'bg-slate-100 dark:bg-slate-800'}`}
                        title={`Mastery Level: ${masteryLevel}/5`}
                    />
                ))}
            </div>

            {/* LEFT: Info */}
            <div className="flex items-center gap-4 min-w-0 flex-1 mb-2 md:mb-0">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${problem.difficulty === 'Hard' ? 'bg-red-500' :
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
                        {masteryLevel >= 5 && <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        {hasNotes && <StickyNote className="w-3 h-3 text-slate-400" />}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="capitalize">{problem.platform}</span>
                        <span>•</span>

                        {/* Editable Schedule Trigger */}
                        <div className="relative">
                            <button
                                ref={scheduleRef}
                                onClick={() => !isArchived && setShowSchedule(!showSchedule)}
                                className={`flex items-center gap-1 hover:text-indigo-500 transition-colors ${isArchived ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                disabled={isArchived}
                            >
                                <Calendar size={12} />
                                {isArchived ? 'Archived' : `Next: ${problem.nextRevisionAt || problem.nextReviewDate ? format(new Date(problem.nextRevisionAt || problem.nextReviewDate), 'MMM d') : 'None'}`}
                            </button>
                            <ReschedulePopover
                                isOpen={showSchedule}
                                onClose={() => setShowSchedule(false)}
                                onSelect={handleDateSelect}
                                triggerRef={scheduleRef}
                            />
                        </div>

                        {!isArchived && urgency.score >= 5 && (
                            <span className={`${urgency.score >= 8 ? "text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 rounded" : "text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 rounded"}`}>
                                {urgency.label}
                            </span>
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
        </Card>
    );
};
