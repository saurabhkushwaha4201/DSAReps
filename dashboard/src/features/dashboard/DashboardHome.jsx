import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import StatsCards from './StatsCards';
import RecentActivity from './RecentActivity';
import TodaysFocus from './TodaysFocus';
import { getTodayRevisions, getAllProblems } from '../../api/problem.api';
import { Skeleton } from '../../components/ui/Skeleton';
import { calculateLearningHealth, calculateRetention, calculateMastery, getProblemStatus } from '../../lib/intelligence';
import { calculateStats } from '../../lib/statsHelper';

const DashboardHome = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [revisions, setRevisions] = useState([]);
    const [allProblems, setAllProblems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [todayData, allData] = await Promise.all([
                    getTodayRevisions(),
                    getAllProblems()
                ]);

                // --- MOCK DATA INJECTION (Start) ---
                // const mockOverdue = [
                //    { _id: 'mock1', title: 'Two Sum (Mock Overdue)', difficulty: 'Easy', nextRevisionAt: new Date(Date.now() - 86400000).toISOString(), platform: 'LeetCode', revisedCount: 1 },
                //    { _id: 'mock2', title: 'LRU Cache (Mock Overdue)', difficulty: 'Medium', nextRevisionAt: new Date(Date.now() - 172800000).toISOString(), platform: 'LeetCode', revisedCount: 3 },
                //    { _id: 'mock3', title: 'Median Arrays (Mock Overdue)', difficulty: 'Hard', nextRevisionAt: new Date(Date.now() - 259200000).toISOString(), platform: 'LeetCode', revisedCount: 5 }
                // ];

                const mockUpcoming = [
                    { _id: 'mock_up1', title: 'Graph Valid Tree (Mock)', difficulty: 'Medium', nextRevisionAt: new Date(Date.now() + 86400000).toISOString(), platform: 'LeetCode', revisedCount: 2, status: 'Upcoming' },
                    { _id: 'mock_up2', title: 'Climbing Stairs (Mock)', difficulty: 'Easy', nextRevisionAt: new Date(Date.now() + 172800000).toISOString(), platform: 'LeetCode', revisedCount: 1, status: 'Upcoming' },
                    { _id: 'mock_up3', title: 'N-Queens (Mock)', difficulty: 'Hard', nextRevisionAt: new Date(Date.now() + 259200000).toISOString(), platform: 'LeetCode', revisedCount: 0, status: 'Upcoming' }
                ];
                // --- MOCK DATA INJECTION (End) ---

                // If we have no data, use mock upcoming to demonstrate "Head Start" feature
                const finalAllProblems = (allData && allData.length > 0) ? allData : mockUpcoming;

                setRevisions(todayData || []);
                setAllProblems(finalAllProblems);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- Intelligence Layer Integration ---
    const { stats, health, greetingMessage, priorityRevisions, upcomingRevisions } = useMemo(() => {
        const total = allProblems.length;

        // Use new statsHelper for dynamic stats
        const computedStats = calculateStats(allProblems);

        // Health
        const healthData = calculateLearningHealth(allProblems);

        // Ensure legacy stats structure matches if StatsCards expects specific keys
        // calculateStats returns { totalSaved, mastered, streak, efficiency }
        // StatsCards likely expects { total, mastered, efficiency } or similar.
        // Assuming StatsCards adapts or I need to map it.
        // Let's map it safely.
        const stats = {
            total: computedStats.totalSaved,
            mastered: computedStats.mastered,
            efficiency: computedStats.efficiency === 'N/A'
                ? 'N/A'
                : parseInt(computedStats.efficiency), // remove % sign if present in string "85%" -> 85
            streak: computedStats.streak
        };

        // Calculate Priority Revisions (Overdue + Due Today)
        // Ensure "Today's Focus" captures overdue items even if API missed them
        const overdueProblems = allProblems.filter(p => getProblemStatus(p) === 'Overdue');
        const dueProblems = allProblems.filter(p => getProblemStatus(p) === 'Due Today');

        // Upcoming for Head Start
        const upcomingRevisions = allProblems
            .filter(p => getProblemStatus(p) === 'Upcoming')
            .sort((a, b) => {
                const dateA = new Date(a.nextRevisionAt || a.nextReviewDate || 0);
                const dateB = new Date(b.nextRevisionAt || b.nextReviewDate || 0);
                return dateA - dateB;
            });

        // Merge with api revisions (deduplicating by ID)
        const combinedMap = new Map();
        [...overdueProblems, ...dueProblems, ...revisions].forEach(p => {
            combinedMap.set(p._id || p.id, p);
        });
        const priorityRevisions = Array.from(combinedMap.values());


        // Dynamic Greeting Message
        const overdueCount = healthData.overdueCount;
        let message = `Consistency compounds. You have <span class="font-semibold text-indigo-600">${priorityRevisions.length} revisions</span> pending.`;

        if (overdueCount > 0) {
            message = `You have <span class="font-semibold text-red-600">${overdueCount} overdue problems</span>. Clear them to restore your streak!`;
        } else if (priorityRevisions.length === 0 && total > 0) {
            message = `All caught up! Great job maintaining your <span class="font-semibold text-emerald-600">${healthData.status}</span> health score.`;
        }

        return {
            stats: { total: stats.total, mastered: stats.mastered, efficiency: stats.efficiency }, // Pass formatted efficiency
            health: healthData,
            greetingMessage: message,
            priorityRevisions,
            upcomingRevisions
        };
    }, [allProblems, revisions]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'Hero'}
                </h2>
                <p
                    className="text-slate-500 dark:text-slate-400"
                    dangerouslySetInnerHTML={{ __html: greetingMessage }}
                />
            </div>

            {loading ? (
                <DashboardSkeleton />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
                    {/* Card 1: Focus (Wide) */}
                    <div className="col-span-1 md:col-span-2 min-h-[300px]">
                        <TodaysFocus revisions={priorityRevisions} upcoming={upcomingRevisions} />
                    </div>

                    {/* Card 2: Activity (Tall) */}
                    <div className="col-span-1 md:row-span-2 min-h-[300px]">
                        <RecentActivity streak={health?.score || 100} />
                    </div>

                    {/* Stats Row (Wide, under Focus on Desktop) */}
                    <div className="col-span-1 md:col-span-2">
                        <StatsCards {...stats} />
                    </div>
                </div>
            )}
        </div>
    );
};

const DashboardSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="col-span-1 md:col-span-2 h-[300px]" />
        <Skeleton className="col-span-1 md:row-span-2 h-[450px]" />
        <Skeleton className="col-span-1 md:col-span-2 h-[120px]" />
    </div>
);

export default DashboardHome;
