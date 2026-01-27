import { useState } from 'react';
import MarkDoneModal from './MarkDoneModal';

const getPlatformMeta = (url = '') => {
    if (url.includes('leetcode')) return { label: 'LeetCode', icon: '🟨' };
    if (url.includes('codeforces')) return { label: 'Codeforces', icon: '🔵' };
    return { label: 'Problem', icon: '📘' };
};

const StatusBadge = ({ status }) => {
    const map = {
        ACTIVE: 'bg-blue-100 text-blue-700',
        MASTERED: 'bg-green-100 text-green-700',
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
            {status}
        </span>
    );
};

export default function ProblemCard({ problem, onMarkDone, isCompleting }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const status =
        problem.status ||
        (problem.nextRevisionAt === null ? 'MASTERED' : 'ACTIVE');

    const platform = getPlatformMeta(problem.url);

    const difficultyColor = {
        Easy: 'bg-green-100 text-green-700',
        Medium: 'bg-yellow-100 text-yellow-700',
        Hard: 'bg-red-100 text-red-700',
    }[problem.difficulty] || 'bg-slate-100 text-slate-700';

    const handleMarkDone = (comfortLevel) => {
        onMarkDone(problem._id, comfortLevel);
        setIsModalOpen(false);
    };

    return (
        <div
            className={`transition-all duration-300 ease-out
        ${isCompleting ? 'opacity-0 scale-95 h-0 overflow-hidden margin-0' : 'opacity-100 scale-100'}
      `}
        >
            <div
                className={`bg-surface rounded-xl p-6 border transition-all duration-200 group
        ${status === 'MASTERED'
                        ? 'border-green-200 opacity-90'
                        : 'border-slate-100 hover:shadow-md hover:-translate-y-[1px]'
                    }`}
            >
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColor}`}>
                                {problem.difficulty}
                            </span>
                            <StatusBadge status={status} />
                        </div>

                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                            <a href={problem.url} target="_blank" rel="noopener noreferrer">
                                {problem.title}
                            </a>
                        </h3>

                        <div className="text-xs text-text-muted mt-1 flex items-center gap-1">
                            <span>{platform.icon}</span>
                            <span>{platform.label}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <a
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-4 py-2 rounded-lg
              bg-slate-50 text-slate-700 text-sm font-medium
              hover:bg-slate-100 border border-slate-200 transition"
                    >
                        Open
                    </a>

                    <button
                        disabled={status === 'MASTERED'}
                        onClick={() => setIsModalOpen(true)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition
              ${status === 'MASTERED'
                                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-blue-600 shadow-sm shadow-blue-200/50'
                            }`}
                    >
                        {status === 'MASTERED' ? 'Completed' : 'Mark Done'}
                    </button>
                </div>
            </div>

            <MarkDoneModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleMarkDone}
                title={problem.title}
            />
        </div>
    );
}
