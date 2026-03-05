import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Play, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TodaysFocus = ({ revisions = [], upcoming = [] }) => {
    const hasRevisions = revisions.length > 0;

    return (
        <Card className="h-full relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <TargetIcon className="w-32 h-32" />
            </div>

            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Today's Focus
                    {hasRevisions && <Badge variant="secondary" className="ml-2">{revisions.length} Due</Badge>}
                </CardTitle>
                <CardDescription>
                    {hasRevisions ? "Consistency compounds. Tackle them top priority." : "You're all caught up!"}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 flex-1">
                {hasRevisions ? (
                    <div className="space-y-3">
                        {revisions.slice(0, 3).map((problem, idx) => (
                            <div key={problem._id || idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${problem.difficulty === 'Hard' ? 'bg-red-500' : problem.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                    <span className="font-medium text-slate-700 truncate max-w-37.5 md:max-w-75">{problem.title}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">Due</Badge>
                            </div>
                        ))}
                        <div className="pt-2">
                            <Link to="/focus">
                                <Button className="w-full sm:w-auto">
                                    <Play className="w-4 h-4 mr-2" /> Start Session
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center h-full">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mission Complete</h3>
                            <p className="text-slate-500 mb-4">Great job keeping up the streak.</p>
                        </div>

                        {upcoming && upcoming.length > 0 && (
                            <div className="mt-4 w-full text-left border-t border-slate-100 dark:border-slate-800 pt-4">
                                <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Want to get ahead? Tomorrow's tasks:</p>
                                <div className="space-y-2">
                                    {upcoming.slice(0, 3).map((problem, idx) => (
                                        <div key={problem._id || idx} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${problem.difficulty === 'Hard' ? 'bg-red-300' : problem.difficulty === 'Medium' ? 'bg-amber-300' : 'bg-emerald-300'}`} />
                                                <span className="text-sm font-medium truncate max-w-50">{problem.title}</span>
                                            </div>
                                            <span className="text-[10px] border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">Upcoming</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


const TargetIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
)

export default TodaysFocus;
