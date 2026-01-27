import { useEffect, useState } from 'react';
import { getAllProblems } from '../api/problem.api';
import EmptyState from '../common/EmptyState';

const StatCard = ({ label, value, helper }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {helper && <p className="text-xs text-slate-400 mt-2">{helper}</p>}
    </div>
);

export default function Progress() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await getAllProblems();
                const problems = Array.isArray(res) ? res : res?.data || [];

                const mastered = problems.filter(
                    (p) => p.nextRevisionAt === null
                ).length;

                const active = problems.length - mastered;

                setStats({
                    total: problems.length,
                    mastered,
                    active,
                });
            } catch (err) {
                console.error(err);
            }
        };

        loadStats();
    }, []);

    if (!stats || stats.total === 0) {
        return (
            <EmptyState
                message="No progress yet"
                subtext="Start revising problems to build momentum."
            />
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
                Your Progress
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatCard
                    label="Total Problems Saved"
                    value={stats.total}
                    helper="Your learning backlog"
                />
                <StatCard
                    label="Problems Mastered"
                    value={stats.mastered}
                    helper="Fully confident solutions"
                />
                <StatCard
                    label="Active Revisions"
                    value={stats.active}
                    helper="Need periodic review"
                />
            </div>

            {/* Narrative Feedback */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                <p className="text-slate-700 text-sm leading-relaxed">
                    You’ve mastered <strong>{stats.mastered}</strong> problems so far.
                    Staying consistent with daily revisions will help move more problems
                    into mastery.
                </p>
            </div>

            {/* Future Scope (honest, not fake) */}
            <div className="text-sm text-slate-400 text-center">
                Difficulty breakdown, streaks, and trends will appear here as you keep
                revising.
            </div>
        </div>
    );
}
