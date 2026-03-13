import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { OfflineBanner } from '../ui/OfflineBanner';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Moon, Sun, Target } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const DashboardLayout = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-200 font-sans transition-colors duration-200 flex flex-col">
            {/* Offline Banner */}
            <OfflineBanner />

            {/* Mobile Header - Only visible on mobile */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
                <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    DSA Tracker
                </h1>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 md:ml-64 overflow-y-auto mb-16 md:mb-0">
                    <div className="max-w-7xl mx-auto px-4 py-6 md:p-8">
                        <ErrorBoundary>
                            <Outlet />
                        </ErrorBoundary>
                    </div>
                </main>
            </div>

            <Toaster position="top-right" toastOptions={{
                className: 'dark:bg-slate-800 dark:text-white',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            }} />
        </div>
    );
};

export { DashboardLayout };
