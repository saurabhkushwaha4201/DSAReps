import { useEffect, useState, useMemo } from 'react';
import { Search, ExternalLink, Circle } from 'lucide-react';
import { getAllProblems } from '../api/problem.api';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';

/* -------------------- helpers -------------------- */

const getStatus = (problem) => {
    if (problem.status) return problem.status;
    return problem.nextRevisionAt === null ? 'MASTERED' : 'ACTIVE';
};

const getHostname = (url = '') => {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return 'link';
    }
};

/* -------------------- UI atoms -------------------- */

const DifficultyBadge = ({ difficulty }) => {
    const colors = {
        Easy: 'text-green-500 bg-green-500/10',
        Medium: 'text-yellow-600 bg-yellow-600/10',
        Hard: 'text-red-500 bg-red-500/10',
    };

    return (
        <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[difficulty] || 'bg-slate-100 text-slate-600'
                }`}
        >
            {difficulty}
        </span>
    );
};

/* -------------------- main -------------------- */

export default function AllProblems() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            setLoading(true);
            const res = await getAllProblems();
            setProblems(Array.isArray(res) ? res : res?.data || []);
        } catch (err) {
            console.error('Failed to fetch problems', err);
        } finally {
            setLoading(false);
        }
    };

    /* -------- derived data (filter + search) -------- */

    const filteredProblems = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();

        return problems.filter((p) => {
            const status = getStatus(p);
            const matchesSearch = p.title.toLowerCase().includes(q);

            if (filter === 'Active') return matchesSearch && status === 'ACTIVE';
            if (filter === 'Mastered') return matchesSearch && status === 'MASTERED';
            return matchesSearch;
        });
    }, [problems, filter, searchQuery]);

    if (loading) return <Loader />;

    return (
        <div className="max-w-6xl mx-auto px-4">
            {/* ---------- Sticky Control Bar ---------- */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 py-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
                        All Problems
                    </h1>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-grow md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search problems…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm
                  focus:ring-2 focus:ring-primary/20 transition"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {['All', 'Active', 'Mastered'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f
                                        ? 'bg-white shadow-sm text-primary'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------- Dense List ---------- */}
            <div className="space-y-1">
                {filteredProblems.length > 0 ? (
                    filteredProblems.map((problem) => {
                        const status = getStatus(problem);

                        return (
                            <div
                                key={problem._id}
                                className="group flex items-center justify-between h-[52px]
                  px-3 rounded-lg border border-transparent
                  hover:bg-slate-50 hover:border-slate-200 transition-all"
                            >
                                {/* Left */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <Circle
                                        className={`w-2 h-2 fill-current ${status === 'MASTERED'
                                            ? 'text-green-500'
                                            : 'text-blue-500'
                                            }`}
                                    />

                                    <span className="font-medium text-slate-800 truncate">
                                        {problem.title}
                                    </span>

                                    <DifficultyBadge difficulty={problem.difficulty} />
                                </div>

                                {/* Right */}
                                <div className="flex items-center gap-6 text-sm">
                                    <span className="hidden sm:block text-slate-400 text-xs font-mono lowercase">
                                        {getHostname(problem.url)}
                                    </span>

                                    <a
                                        href={problem.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        tabIndex={0}
                                        aria-label={`Open ${problem.title}`}
                                        className="opacity-0 group-hover:opacity-100
                      flex items-center gap-1 px-3 py-1
                      bg-white border border-slate-200 rounded-md
                      text-slate-600 hover:text-primary hover:border-primary
                      transition-all text-xs font-semibold"
                                    >
                                        Open <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <EmptyState
                        message={searchQuery ? 'No results found' : 'No problems saved yet'}
                        subtext={
                            searchQuery
                                ? 'Try adjusting your search or filters.'
                                : 'Start by saving problems from the extension.'
                        }
                    />
                )}
            </div>
        </div>
    );
}
