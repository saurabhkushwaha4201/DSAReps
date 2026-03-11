import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import TodayTasks from './TodayTasks';
import ContributionHeatmap from './ContributionHeatmap';
import WeakClusters from './WeakClusters';
import InterviewMode from './InterviewMode';
import { getStats } from '../../api/problem.api';
import { Skeleton } from '../../components/ui/Skeleton';

const DashboardHome = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

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
                <p className="text-slate-500 dark:text-slate-400">
                    {stats ? (
                        <>
                            Tracking <span className="font-semibold text-indigo-600">{stats.totalProblems} problems</span>
                            {stats.streak > 0 && (
                                <> · <span className="font-semibold text-emerald-600">{stats.streak}-day streak 🔥</span></>
                            )}
                        </>
                    ) : (
                        'Loading your progress...'
                    )}
                </p>
            </div>

            {loading ? (
                <DashboardSkeleton />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column: Today + Heatmap */}
                    <div className="lg:col-span-2 space-y-6">
                        <TodayTasks />
                        <ContributionHeatmap heatmap={stats?.heatmap || []} />
                    </div>

                    {/* Right column: Weak Clusters + Interview Mode */}
                    <div className="space-y-6">
                        <WeakClusters weakClusters={stats?.weakClusters || []} />
                        <InterviewMode />
                    </div>
                </div>
            )}
        </div>
    );
};

const DashboardSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-70" />
            <Skeleton className="h-50" />
        </div>
        <div className="space-y-6">
            <Skeleton className="h-60" />
            <Skeleton className="h-40" />
        </div>
    </div>
);

export default DashboardHome;
