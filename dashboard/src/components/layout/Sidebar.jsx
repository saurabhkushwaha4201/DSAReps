import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, LogOut, User, Moon, Sun, Settings, MessageSquare } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useTheme } from '../../hooks/useTheme';
import FeedbackModal from '../common/FeedbackModal';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { label: 'All Problems', icon: List, path: '/problems' },
    ];

    const bottomNavItems = [
        { label: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen fixed left-0 top-0 z-40 transition-colors">
                <div className="p-6">
                    <h1 className="text-2xl tracking-tight flex items-center gap-2">
                        <svg xmlns="" width="32" height="32" viewBox="0 0 24 24" fill="none">
<path d="M12 5L6 16" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"/>
<path d="M12 5L18 16" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"/>
<path d="M6 16H18" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3"/>
<path d="M12 5v6" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"/>
<circle cx="12" cy="5" r="3.5" fill="#3b82f6" className="drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]"/>
<circle cx="6" cy="16" r="3.5" fill="#10b981" className="drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]"/>
<circle cx="18" cy="16" r="3.5" fill="#f59e0b" className="drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"/>
</svg>
                        <span className="text-white dark:text-white font-extrabold tracking-tight">DSA</span><span className="text-indigo-400 font-extrabold tracking-tight">Reps</span>
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-4 pb-2">
                    {bottomNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                isActive
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                            {user?.name?.[0] || <User className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                {user?.email || 'user@example.com'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            className="flex-1 justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={logout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Log out
                        </Button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </div>

                    <button
                        onClick={() => setFeedbackOpen(true)}
                        className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Send Feedback
                    </button>
                </div>
            </aside>

            <FeedbackModal
                isOpen={feedbackOpen}
                onClose={() => setFeedbackOpen(false)}
                userName={user?.name || 'User'}
                userEmail={user?.email || ''}
            />

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-2 py-1 flex justify-around items-center z-50 safe-area-inset-bottom">
                {[...navItems, ...bottomNavItems].map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex flex-col items-center justify-center px-3 py-2 rounded-xl text-xs font-medium transition-all",
                            isActive
                                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                                : "text-slate-500 dark:text-slate-400"
                        )}
                    >
                        <item.icon className="w-5 h-5 mb-0.5" />
                        <span className="text-[10px]">{item.label}</span>
                    </NavLink>
                ))}

                {/* Logout - Mobile */}
                <button
                    onClick={logout}
                    className="flex flex-col items-center justify-center px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400"
                >
                    <LogOut className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px]">Logout</span>
                </button>
            </div>
        </>
    );
};

export { Sidebar };
