import React, { useEffect, useState } from 'react';
import DataExport from './DataExport';
import { getUserSettings, updateUserSettings } from '../../api/problem.api';
import { Save, Loader2, Bell, BellOff, Mail, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [intervals, setIntervals] = useState({ hard: 1, medium: 3, easy: 5 });
    const [dailyGoal, setDailyGoal] = useState(3);
    const [notifEnabled, setNotifEnabled] = useState(false);
    const [notifTime, setNotifTime] = useState('09:00');

    useEffect(() => {
        async function load() {
            try {
                const data = await getUserSettings();
                const s = data?.settings;
                if (s) {
                    setIntervals(s.revisionIntervals || { hard: 1, medium: 3, easy: 5 });
                    setDailyGoal(s.dailyGoal || 3);
                    setNotifEnabled(s.notificationEnabled ?? false);
                    setNotifTime(s.notificationTime || '09:00');
                }
            } catch (err) {
                console.error('Failed to load settings', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleSave = async () => {
        const h = parseInt(intervals.hard);
        const m = parseInt(intervals.medium);
        const e = parseInt(intervals.easy);
        const cap = parseInt(dailyGoal);

        if ([h, m, e].some(v => isNaN(v) || v < 1 || v > 30)) {
            toast.error('Intervals must be between 1 and 30 days.');
            return;
        }

        if (h > m || m > e) {
            toast.error('Intervals must follow: Hard ≤ Medium ≤ Easy.');
            return;
        }

        if (isNaN(cap) || cap < 1 || cap > 10) {
            toast.error('Daily cap must be between 1 and 10.');
            return;
        }

        setSaving(true);
        try {
            await updateUserSettings({
                revisionIntervals: { hard: h, medium: m, easy: e },
                dailyGoal: cap,
                notificationEnabled: notifEnabled,
                notificationTime: notifTime,
            });

            // Instantly sync alarm to extension without waiting for 2h polling
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage(
                    { type: 'UPDATE_ALARM', notifEnabled, notifTime },
                    () => {
                        if (chrome.runtime.lastError) {
                            console.warn('[Settings] alarm sync failed:', chrome.runtime.lastError.message);
                        }
                    }
                );
            }

            toast.success('Settings saved');
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to save settings';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto p-8 text-center text-slate-500">
                Loading settings...
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your preferences and data.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors shrink-0 text-sm"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* ── Revision Intervals ─────────────────────────────── */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Revision Intervals
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Set the initial review delay (in days) for each difficulty level when you save a new problem.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[
                        { key: 'hard',   label: 'Hard',   color: 'text-red-600 dark:text-red-400',         focusRing: 'focus:ring-red-500 focus:border-red-500' },
                        { key: 'medium', label: 'Medium', color: 'text-amber-600 dark:text-amber-400',     focusRing: 'focus:ring-amber-500 focus:border-amber-500' },
                        { key: 'easy',   label: 'Easy',   color: 'text-emerald-600 dark:text-emerald-400', focusRing: 'focus:ring-emerald-500 focus:border-emerald-500' },
                    ].map(({ key, label, color, focusRing }) => (
                        <div key={key}>
                            <label className={`block text-sm font-semibold mb-1.5 ${color}`}>
                                {label}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={intervals[key]}
                                    onChange={(e) =>
                                        setIntervals((prev) => ({ ...prev, [key]: e.target.value }))
                                    }
                                    className={`w-16 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:border-transparent outline-none ${focusRing}`}
                                />
                                <span className="text-sm text-slate-500 dark:text-slate-400">days</span>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500">
                    Rule: Hard ≤ Medium ≤ Easy. Range: 1–30 days.
                </p>
            </section>

            {/* ── Daily Cap ──────────────────────────────────────── */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Daily Review Cap
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Maximum problems shown per day. "Revise More" lets you exceed this voluntarily.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={dailyGoal}
                        onChange={(e) => setDailyGoal(e.target.value)}
                        className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        problems per day (1–10)
                    </span>
                </div>
            </section>

            {/* ── Daily Reminder ─────────────────────────────────── */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Daily Digest
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Get a friendly desktop reminder for your pending revisions. Requires the Chrome extension.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    {/* iOS-style CSS toggle */}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifEnabled}
                            onChange={(e) => setNotifEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2 dark:peer-focus:ring-offset-slate-900 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 peer-checked:after:border-white" />
                        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            {notifEnabled
                                ? <><Bell className="w-4 h-4 text-indigo-500" /> Enabled</>
                                : <><BellOff className="w-4 h-4 text-slate-400" /> Disabled</>}
                        </span>
                    </label>

                    {/* Time picker — only visible when enabled */}
                    {notifEnabled && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Remind me at:</span>
                            <input
                                type="time"
                                value={notifTime}
                                onChange={(e) => setNotifTime(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Save Button */}

            {/* ── Weekly Digest ──────────────────────────────────── */}
            <section className="bg-white dark:bg-gradient-to-br dark:from-[#151b2b] dark:to-[#1a1c2e] border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 relative overflow-hidden">
                {/* Coming Soon badge */}
                <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        Coming Soon
                    </span>
                </div>
                <div className="opacity-50 pointer-events-none select-none">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1.5 rounded-lg bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                            <Mail className="w-4 h-4 text-indigo-400" />
                        </span>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Weekly Digest Email
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Get a weekly summary of your progress — problems revised, mastered, streak stats, and upcoming due problems — straight to your inbox.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                        <span className="p-1 rounded-md bg-slate-500/10">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                        <span className="text-sm text-slate-400 dark:text-slate-500">Sent every Monday morning</span>
                    </div>
                </div>
            </section>

            {/* ── Data Management ────────────────────────────────── */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Data Management</h2>
                <DataExport />
            </section>
        </div>
    );
};

export default SettingsPage;
