import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllProblems } from '../../api/problem.api';
import { useLocalData } from '../../hooks/useLocalData';
import { FocusLayout } from '../../components/layout/FocusLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ExternalLink, Timer, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const FocusSession = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sessionComplete, setSessionComplete] = useState(false);

    // Active Problem State
    const [revealSolution, setRevealSolution] = useState(false);
    const [timer, setTimer] = useState(0);
    const [totalSessionTime, setTotalSessionTime] = useState(0);
    const [noteContent, setNoteContent] = useState('');

    // Stats
    const [problemsReviewed, setProblemsReviewed] = useState(0);

    // Hooks
    const { meta, saveProblemNote, getProblemNote, logSession, updateStreak } = useLocalData();
    const timerRef = useRef(null);

    // 1. Fetch Data
    useEffect(() => {
        const init = async () => {
            try {
                // If problems passed via location (e.g., from "Practice All"), use them
                if (location.state?.problems) {
                    setQueue(location.state.problems);
                } else {
                    const allData = await getAllProblems();
                    setQueue(allData || []);
                }
            } catch (e) {
                toast.error("Failed to load session");
            } finally {
                setLoading(false);
            }
        };
        init();
        updateStreak(); // Mark "present" for the day
    }, []);

    // 2. Timer Logic
    useEffect(() => {
        timerRef.current = setInterval(() => {
            if (!sessionComplete && queue.length > 0) {
                setTimer(t => t + 1);
                setTotalSessionTime(t => t + 1);
            }
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [sessionComplete, queue.length]);

    // 3. Load Note when problem changes
    const currentProblem = queue[currentIndex];

    useEffect(() => {
        if (currentProblem) {
            setNoteContent(getProblemNote(currentProblem._id || currentProblem.id) || '');
            setRevealSolution(false);
            setTimer(0); // Reset per-problem timer? Or keep session timer? Let's do session timer mainly, but reset "Time on this card"? 
            // Design choice: Timer usually tracks "Current Problem Time". Let's stick to that for focus.
        }
    }, [currentProblem, getProblemNote]);

    // Handle Note Save (Auto-save on change/blur or confidence vote)
    const handleNoteChange = (e) => {
        setNoteContent(e.target.value);
        if (currentProblem) {
            saveProblemNote(currentProblem._id || currentProblem.id, e.target.value);
        }
    };

    const handleVote = async (confidence) => {
        if (!currentProblem) return;

        try {
            // Move Next
            setProblemsReviewed(p => p + 1);

            if (currentIndex < queue.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                finishSession();
            }
            toast.success(`Marked as ${confidence.toLowerCase()}`);
        } catch (e) {
            toast.error("Failed to save progress");
        }
    };

    const finishSession = () => {
        setSessionComplete(true);
        logSession({
            date: new Date().toISOString(),
            problemsReviewed: problemsReviewed + 1, // Include current
            timeSpentMinutes: Math.ceil(totalSessionTime / 60)
        });
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return <FocusLayout><div className="p-10">Loading session...</div></FocusLayout>;

    if (queue.length === 0) return (
        <FocusLayout>
            <div className="flex flex-col items-center justify-center h-full flex-1 gap-4">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
                <h2 className="text-2xl font-bold">No revisions for now!</h2>
                <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
            </div>
        </FocusLayout>
    );

    if (sessionComplete) return (
        <FocusLayout>
            <div className="flex flex-col items-center justify-center h-full flex-1 gap-6 bg-slate-50">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-3xl">🔥</div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">Session Complete!</h2>
                        <p className="text-slate-500 mt-2">Great focus. Here is what you achieved:</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl">
                            <div className="text-2xl font-bold text-indigo-600">{problemsReviewed}</div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Problems</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                            <div className="text-2xl font-bold text-emerald-600">{Math.ceil(totalSessionTime / 60)}m</div>
                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Focus Time</div>
                        </div>
                    </div>

                    <Button className="w-full h-12 text-lg" onClick={() => navigate('/')}>
                        Return to Dashboard
                    </Button>
                </motion.div>
            </div>
        </FocusLayout>
    );

    return (
        <FocusLayout>
            <div className="flex-1 flex max-h-[calc(100vh-64px)] overflow-hidden">
                {/* LEFT: Context */}
                <div className="w-1/3 border-r border-slate-200 bg-slate-50 p-8 flex flex-col gap-6 overflow-y-auto">
                    <div className="space-y-4">
                        <Badge variant="outline" className="bg-white">{currentProblem.difficulty}</Badge>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                            {currentProblem.title}
                        </h1>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <span>{currentProblem.platform}</span>
                            <a href={currentProblem.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                Open Problem <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="text-xs text-slate-400 font-mono text-center mb-2">
                            Problem {currentIndex + 1} of {queue.length}
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full">
                            <div
                                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Active Area */}
                <div className="w-2/3 flex flex-col bg-white">
                    {/* Top Bar: Timer */}
                    <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8">
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-xl">
                            <Timer className="w-5 h-5" />
                            <span>{formatTime(timer)}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400"
                            onClick={() => setRevealSolution(!revealSolution)}
                        >
                            {revealSolution ? <><EyeOff className="w-4 h-4 mr-2" /> Hide Solution</> : <><Eye className="w-4 h-4 mr-2" /> Reveal Solution</>}
                        </Button>
                    </div>

                    {/* Editor / Note Area */}
                    <div className="flex-1 flex flex-col p-8 gap-4 overflow-y-auto">
                        <label className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                            Scratchpad & Notes
                        </label>
                        <textarea
                            className="flex-1 w-full resize-none p-4 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300 text-slate-700 leading-relaxed font-mono text-sm"
                            placeholder="# Write your approach, pseudocode, or thoughts here...\n\n- Step 1: ...\n- Step 2: ..."
                            value={noteContent}
                            onChange={handleNoteChange}
                        />

                        {/* Solution Reveal Block */}
                        {revealSolution && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-amber-50 border border-amber-100 p-6 rounded-xl"
                            >
                                <h3 className="font-bold text-amber-800 mb-2">Solution / Hint</h3>
                                <p className="text-amber-700 text-sm">
                                    No built-in solution text in current API.
                                    <br />
                                    <a href={currentProblem.url + '/solution'} target="_blank" className="underline font-medium">Check platform solution</a>
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer: Decision Engine */}
                    <div className="h-24 border-t border-slate-100 flex items-center justify-between px-8 bg-white z-10">
                        <div className="text-sm text-slate-400">
                            How did it go?
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="border-red-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 min-w-[120px]"
                                onClick={() => handleVote('STRUGGLED')}
                            >
                                😕 Struggled
                            </Button>
                            <Button
                                variant="outline"
                                className="border-slate-200 hover:bg-slate-50 min-w-[120px]"
                                onClick={() => handleVote('OKAY')}
                            >
                                😐 Okay
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px] shadow-lg shadow-emerald-200"
                                onClick={() => handleVote('MASTERED')}
                            >
                                😎 Mastered
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </FocusLayout>
    );
};

export default FocusSession;
