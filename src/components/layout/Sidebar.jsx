import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Target, LogOut, User, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useTheme } from '../../hooks/useTheme';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { label: 'All Problems', icon: List, path: '/problems' },
        { label: 'Today\'s Focus', icon: Target, path: '/focus' },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-[240px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen fixed left-0 top-0 z-40 transition-colors">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2">
                        <Target className="w-8 h-8" />
                        DSA Tracker
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
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-2 py-1 flex justify-around items-center z-50 safe-area-inset-bottom">
                {navItems.map((item) => (
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
