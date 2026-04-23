import React, { useState } from 'react';
import { Download, Database, Loader2 } from 'lucide-react';
import { getAllProblems } from '../../api/problem.api';
import toast from 'react-hot-toast';

const DataExport = () => {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            // 1. Fetch all API data
            const problems = await getAllProblems({ limit: 10000 }); // Try to get all

            // 2. Fetch LocalStorage Data
            const localMetaRaw = localStorage.getItem('dsa_user_meta');
            let localMeta = {};
            if (localMetaRaw) {
                try {
                    localMeta = JSON.parse(localMetaRaw);
                } catch (error) {
                    console.error("[DataExport] Failed to parse localStorage key 'dsa_user_meta':", error);
                }
            }

            // 3. Construct the Dump
            const dump = {
                exportedAt: new Date().toISOString(),
                version: '1.0',
                stats: {
                    totalProblems: problems.length,
                    notesCount: Object.keys(localMeta.problemNotes || {}).length,
                    streak: localMeta.streak?.current || 0
                },
                data: {
                    problems,
                    userMeta: localMeta
                }
            };

            // 4. Create Blob & Trigger Download
            const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `dsa_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Export started! 📥");

        } catch (e) {
            console.error(e);
            toast.error("Failed to export data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Data Sovereignty</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Your data belongs to you. Export a full copy of your problems, progress history, and notes.
                    </p>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={handleExport}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-indigo-600/10 hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-50 transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {loading ? 'Exporting...' : 'Export My Data (JSON)'}
                </button>            </div>
        </div>
    );
};

export default DataExport;
