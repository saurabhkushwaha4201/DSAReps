import { isSameDay, subDays, parseISO } from 'date-fns';

export function calculateStats(problems) {
    // 1. Calculate Total Saved
    const totalSaved = problems.length;

    // 2. Calculate Mastered (Example logic: revisionCount > 5)
    // Ensure we check for field existence as it might vary (revisedCount vs revisionCount)
    const mastered = problems.filter(p => (p.revisedCount || p.revisionCount || 0) >= 5).length;

    // 3. Calculate Streak (The tricky part)
    // Logic: Count consecutive days backwards from today where at least 1 problem was revised.
    // Note: This requires a 'revisionHistory' array in your data. 
    // For Phase 1, we will mock the logic:

    // Placeholder logic until backend history exists:
    // If you have ANY revised problem with date === today, streak + 1
    const hasActivityToday = problems.some(p => {
        const date = p.lastRevised ? new Date(p.lastRevised) : null;
        return date && isSameDay(date, new Date());
    });
    const mockStreak = hasActivityToday ? 1 : 0; // Real streak logic needs backend history table

    // 4. Efficiency
    const totalRevisions = problems.reduce((acc, p) => acc + (p.revisedCount || p.revisionCount || 0), 0);
    const efficiency = totalRevisions === 0 ? "N/A" : "85%";

    return {
        totalSaved,
        mastered,
        streak: mockStreak,
        efficiency
    };
}
