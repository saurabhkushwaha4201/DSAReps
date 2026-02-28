import React from 'react';
import DataExport from '../../components/settings/DataExport';

const SettingsPage = () => {
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your preferences and data.</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Data Management</h2>
                <DataExport />
            </section>
        </div>
    );
};

export default SettingsPage;
