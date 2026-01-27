import {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback,
    useMemo,
} from 'react';
import { getTodayRevisions, reviseProblem } from '../api/problem.api';
import { useAuth } from '../auth/AuthContext';

const DashboardContext = createContext(null);

/* ---------------- helpers ---------------- */

const normalizeResponse = (res) =>
    Array.isArray(res) ? res : res?.data || [];

const getStatus = (p) =>
    p.status ?? (p.nextRevisionAt === null ? 'MASTERED' : 'ACTIVE');

/* ---------------- provider ---------------- */

export const DashboardProvider = ({ children }) => {
    const { user } = useAuth();

    const [todayProblems, setTodayProblems] = useState([]);
    const [loading, setLoading] = useState(false);

    /* -------- fetch today -------- */

    const refreshToday = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const res = await getTodayRevisions();
            setTodayProblems(normalizeResponse(res));
        } catch (err) {
            console.error('Failed to fetch today revisions', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) refreshToday();
    }, [user, refreshToday]);

    /* -------- optimistic revise -------- */

    const markProblemRevised = useCallback(
        async (id, comfortLevel) => {
            const prevSnapshot = todayProblems;

            // optimistic remove
            setTodayProblems((prev) => prev.filter((p) => p._id !== id));

            try {
                const quality = comfortLevel === 'Yes' ? 5 : 3;
                await reviseProblem(id, quality);

                // background sync
                const res = await getTodayRevisions();
                setTodayProblems(normalizeResponse(res));
            } catch (err) {
                console.error('Failed to mark revised', err);
                // rollback safely
                setTodayProblems(prevSnapshot);
                throw err; // let UI handle toast
            }
        },
        [todayProblems]
    );

    /* -------- derived stats -------- */

    const stats = useMemo(() => {
        const total = todayProblems.length;
        const mastered = todayProblems.filter(
            (p) => getStatus(p) === 'MASTERED'
        ).length;

        return {
            total,
            mastered,
            active: total - mastered,
            streak: 0, // compute later from backend
        };
    }, [todayProblems]);

    return (
        <DashboardContext.Provider
            value={{
                todayProblems,
                loading,
                refreshToday,
                markProblemRevised,
                stats,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
};

/* ---------------- hook ---------------- */

export const useDashboard = () => {
    const ctx = useContext(DashboardContext);
    if (!ctx) {
        throw new Error('useDashboard must be used within DashboardProvider');
    }
    return ctx;
};
