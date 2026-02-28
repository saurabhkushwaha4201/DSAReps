import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dsa_user_meta';

const DEFAULT_META = {
    dailyGoal: 3,
    streak: { current: 0, lastLogin: null },
    problemNotes: {}, // { "problemId": "markdown content" }
    sessionLogs: []   // [ { date, problemsRevised, timeSpent } ]
};

export const useLocalData = () => {
    const [data, setData] = useState(DEFAULT_META);
    const [loaded, setLoaded] = useState(false);

    // Initial Load
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                setData({ ...DEFAULT_META, ...JSON.parse(raw) });
            }
        } catch (e) {
            console.error("Failed to load local data", e);
        } finally {
            setLoaded(true);
        }
    }, []);

    // Persistence helper
    const persist = useCallback((newData) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            setData(newData);
        } catch (e) {
            console.error("Failed to save local data", e);
        }
    }, []);

    // Actions
    const updateStreak = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = data.streak.lastLogin;

        // If already logged today, do nothing
        if (lastLogin === today) return;

        let newStreak = data.streak.current;

        // Check if yesterday was the last login
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLogin === yesterdayStr) {
            newStreak += 1;
        } else if (lastLogin !== today) {
            // Broken streak (unless first time)
            newStreak = 1;
        }

        const newStats = {
            ...data,
            streak: { current: newStreak, lastLogin: today }
        };
        persist(newStats);
    }, [data, persist]);

    const saveProblemNote = useCallback((problemId, noteContent) => {
        const newStats = {
            ...data,
            problemNotes: {
                ...data.problemNotes,
                [problemId]: noteContent
            }
        };
        persist(newStats);
    }, [data, persist]);

    const getProblemNote = useCallback((problemId) => {
        return data.problemNotes[problemId] || '';
    }, [data]);

    const logSession = useCallback((sessionData) => {
        // sessionData: { date: ISO, count: number, minutes: number }
        const newStats = {
            ...data,
            sessionLogs: [sessionData, ...data.sessionLogs] // Newest first
        };
        persist(newStats);
    }, [data, persist]);

    return {
        isLoaded: loaded,
        meta: data,
        updateStreak,
        saveProblemNote,
        getProblemNote,
        logSession
    };
};
