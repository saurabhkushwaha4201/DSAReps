import React from 'react';
import { Card } from '../../components/ui/Card';
import { Bookmark } from 'lucide-react';

const StatsCards = ({ total = 0 }) => {
    return (
        <div className="w-full">
            <Card className="flex items-center p-4 gap-4" title="Total problems added to your library.">
                <div className="bg-indigo-100 p-3 rounded-lg flex items-center justify-center">
                    <Bookmark className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Total Tracked</p>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</h4>
                </div>
            </Card>
        </div>
    );
};

export default StatsCards;
