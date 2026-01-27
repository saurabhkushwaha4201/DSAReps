import { useState } from 'react';
import { useDashboard } from './DashboardContext';
import ProblemCard from './ProblemCard';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import { toast } from 'react-toastify';
import { getGreeting, formatDate } from '../utils/formatDate';

export default function Today() {
    const { todayProblems, loading, markProblemRevised } = useDashboard();
    const [completingId, setCompletingId] = useState(null);

    const handleMarkDone = async (id, comfortLevel) => {
        setCompletingId(id);
        try {
            await markProblemRevised(id, comfortLevel);
            toast.success('Revision logged ✓', { autoClose: 1200 });

            // Celebration if this was the last one
            if (todayProblems.length === 1) {
                toast.success('That’s it for today 🎉', { autoClose: 1800 });
            }
        } catch {
            setCompletingId(null);
            toast.error('Could not update. Try again.');
        }
    };

    if (loading) return <Loader />;

    const total = todayProblems.length;
    const dailyGoal = 3; // UX goal, not backend enforced
    const progress = Math.min(dailyGoal - total + 1, dailyGoal);

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header (calm, focused) */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    {getGreeting()}
                </h1>
                <p className="text-sm text-slate-500">
                    {formatDate(new Date())}
                </p>
            </header>

            {/* Daily Focus */}
            <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-sm text-slate-700">
                    Today’s focus
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                    {total > 0
                        ? `${total} problem${total > 1 ? 's' : ''} to revise`
                        : 'All revisions complete 🎉'}
                </p>

                {todayProblems.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                        Small daily revisions build long-term mastery.
                    </p>
                )}
            </div>

            {/* Content */}
            {total > 0 ? (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        Today's Revisions
                        <span
                            key={total}
                            className="ml-3 bg-blue-100 text-blue-700
               text-sm font-bold px-3 py-1 rounded-full
               animate-in zoom-in duration-200"
                        >
                            {total}
                        </span>
                    </h2>
                    {todayProblems.map((problem) => (
                        <ProblemCard
                            key={problem._id}
                            problem={problem}
                            isCompleting={completingId === problem._id}
                            onMarkDone={handleMarkDone}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    message="You're done for today 🎉"
                    subtext="Consistency matters more than intensity. See you tomorrow."
                />
            )}
        </div>
    );
}
