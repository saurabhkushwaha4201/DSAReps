import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

const RevisionCard = ({ problem, onRevise }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleComplete = () => {
        setIsExiting(true);
        // Delay actual callback to allow animation to play
        setTimeout(() => {
            onRevise(problem.id || problem._id);
        }, 500); // match duration
    };

    const isOverdue = new Date(problem.nextReviewDate) < new Date().setHours(0, 0, 0, 0);

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100, transition: { duration: 0.4 } }}
                    layout
                >
                    <Card className={cn(
                        "flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4 border-l-4 hover:-translate-y-1 transition-transform duration-300",
                        isOverdue ? "border-l-red-500" : "border-l-orange-400"
                    )}>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Badge variant={isOverdue ? "destructive" : "secondary"} className={isOverdue ? "" : "bg-orange-100 text-orange-800"}>
                                    {isOverdue ? "Overdue" : "Due Today"}
                                </Badge>
                                <span className="text-sm text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Last reviewed: {new Date(problem.lastRevised).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{problem.title}</h3>
                            <div className="flex items-center gap-2">
                                <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm font-medium">
                                    Solve on {problem.platform}
                                </a>
                            </div>
                        </div>

                        <Button size="lg" className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200" onClick={handleComplete}>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Mark Revised
                        </Button>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RevisionCard;
