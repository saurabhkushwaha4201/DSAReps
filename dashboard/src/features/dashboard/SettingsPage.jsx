import React, { useEffect, useState } from 'react';
import DataExport from '../../components/settings/DataExport';
import { getUserSettings, updateUserSettings } from '../../api/problem.api';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [intervals, setIntervals] = useState({ hard: 1, medium: 3, easy: 5 });
    const [dailyGoal, setDailyGoal] = useState(3);

    useEffect(() => {
        async function load() {
            try {
                const data = await getUserSettings();
                const s = data?.settings;
                if (s) {
                    setIntervals(s.revisionIntervals || { hard: 1, medium: 3, easy: 5 });
                    setDailyGoal(s.dailyGoal || 3);
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
            });
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

            {/* Save Button */}

            {/* ── Data Management ────────────────────────────────── */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Data Management</h2>
                <DataExport />
            </section>
        </div>
    );
};

export default SettingsPage;
