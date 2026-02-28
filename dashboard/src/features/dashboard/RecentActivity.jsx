import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Flame } from 'lucide-react';

const RecentActivity = ({ streak = 0 }) => {
    return (
        <Card className="h-full bg-gradient-to-br from-orange-500 to-amber-600 text-white border-none dark:bg-none dark:bg-orange-600">
            <CardContent className="flex flex-col items-center justify-center py-8 h-full">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm animate-pulse">
                    <Flame className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-5xl font-bold">{streak}</h2>
                <p className="text-orange-100 font-medium mt-2">Day Streak</p>
                <p className="text-xs text-orange-200 mt-4 opacity-80">
                    {streak > 0 ? "Keep the fire burning!" : "Start a revision to build fire."}
                </p>
            </CardContent>
        </Card>
    );
};

export default RecentActivity;
