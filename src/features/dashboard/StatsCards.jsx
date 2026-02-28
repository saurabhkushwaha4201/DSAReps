import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Bookmark, Trophy, Activity } from 'lucide-react';

const stats = [
    { label: 'Total Saved', value: '124', icon: Bookmark, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Mastered', value: '12', icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Efficiency', value: '85%', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
];

const StatsCards = ({ total = 0, mastered = 0, efficiency = 0 }) => {
    // Handle N/A case for efficiency
    const efficiencyDisplay = efficiency === 'N/A' ? 'N/A' : `${efficiency}%`;

    // Use props if available, else placeholders or defaults
    const displayStats = [
        {
            label: 'Total Saved',
            value: total,
            icon: Bookmark,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100',
            tooltip: "Total problems added to your library."
        },
        {
            label: 'Mastered',
            value: mastered,
            icon: Trophy,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100',
            tooltip: "Problems revised more than 5 times without resetting."
        },
        {
            label: 'Efficiency',
            value: efficiencyDisplay,
            icon: Activity,
            color: 'text-amber-600',
            bg: 'bg-amber-100',
            tooltip: "Percentage of revisions completed on their scheduled date."
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {displayStats.map((stat, index) => (
                <Card key={index} className="flex items-center p-4 gap-4" title={stat.tooltip}>
                    <div className={`${stat.bg} p-3 rounded-lg flex items-center justify-center`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</h4>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default StatsCards;
