import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * DSA Revision Tracker - Intelligence Layer
 * Strictly Frontend Logic
 */
// ... existing imports/code ...

/**
 * Returns an Urgency Score (1-10) for UI highlights.
 * @param {Object} problem
 * @returns {{score: number, label: string, color: string}}
 */
export const getUrgencyScore = (problem) => {
    // ... existing code ...
    const status = getProblemStatus(problem);

    if (status === 'Overdue') {
        const nextRev = problem.nextRevisionAt || problem.nextReviewDate;
        const daysOverdue = nextRev ? differenceInDays(new Date(), new Date(nextRev)) : 0;

        if (daysOverdue > 7) return { score: 10, label: 'Blocking Streak', color: 'border-l-red-600' }; // Critical
        if (daysOverdue > 3) return { score: 8, label: `Overdue ${daysOverdue} days`, color: 'border-l-orange-500' }; // High
        return { score: 6, label: 'Overdue', color: 'border-l-orange-400' };
    }

    if (status === 'Due Today') {
        return { score: 5, label: 'Due Today', color: 'border-l-emerald-500' }; // Normal
    }

    return { score: 1, label: 'Upcoming', color: 'border-l-slate-200' };
};

/**
 * Calculates a priority score. Higher = More Urgent.
 * Formula: (OverdueDays * 10) + (100 - Mastery) + (DaysSinceLastRev / 10)
 */
export function calculatePriorityScore(problem) {
    const today = new Date();
    const nextDate = problem.nextRevisionAt ? new Date(problem.nextRevisionAt) : new Date();
    // Ensure lastRevised is handled safely
    const lastDate = problem.lastRevised ? new Date(problem.lastRevised) : new Date();

    // 1. Overdue Score (Heavy Weight)
    // differenceInCalendarDays(dateLeft, dateRight): the number of calendar days between the given dates.
    const overdueDays = differenceInCalendarDays(today, nextDate);
    const urgencyScore = overdueDays > 0 ? overdueDays * 10 : 0;

    // 2. Mastery Gap (Medium Weight)
    // Lower mastery = Higher priority
    const masteryGap = 100 - (calculateMastery(problem) || 0);

    // 3. Staleness (Light Weight)
    // Longer time since last touch = slight bump
    const daysSinceRev = differenceInCalendarDays(today, lastDate);
    const staleness = daysSinceRev > 0 ? daysSinceRev / 10 : 0;

    return urgencyScore + masteryGap + staleness;
}

export function getWeightedSmartSort(problems) {
    return [...problems].sort((a, b) => {
        const scoreA = calculatePriorityScore(a);
        const scoreB = calculatePriorityScore(b);
        return scoreB - scoreA; // Descending (High priority first)
    });
}

/**
 * Returns a new Date object set to the very start of the day (00:00:00.000)
 * matching the local timezone of the user's browser.
 * @param {Date|number|string} date 
 * @returns {Date}
 */
export const startOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Checks if the first date is strictly before the second date (ignoring time if desired, but here we compare timestamps).
 * For status checks, we typically compare normalized start-of-day dates.
 * @param {Date} date 
 * @param {Date} dateToCompare 
 * @returns {boolean}
 */
export const isBefore = (date, dateToCompare) => {
    return date.getTime() < dateToCompare.getTime();
};

/**
 * Checks if two dates resolve to the same calendar day in local time.
 * @param {Date} date 
 * @param {Date} now 
 * @returns {boolean}
 */
export const isToday = (date, now = new Date()) => {
    const d1 = startOfDay(date);
    const d2 = startOfDay(now);
    return d1.getTime() === d2.getTime();
};

/**
 * Returns number of days between two dates.
 * @param {Date} dateLeft 
 * @param {Date} dateRight 
 * @returns {number}
 */
export const differenceInDays = (dateLeft, dateRight) => {
    const diffTime = Math.abs(dateLeft - dateRight);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- Priority Engine ---

/**
 * Determines the revision status of a problem.
 * @param {Object} problem - Must contain nextRevisionAt (ISO string or timestamp)
 * @returns {'Overdue' | 'Due Today' | 'Upcoming' | 'Unknown'}
 */
export const getProblemStatus = (problem) => {
    if (!problem?.nextRevisionAt && !problem?.nextReviewDate) return 'Unknown';

    // Support both field names if schema varies, prefer nextRevisionAt
    const targetDateStr = problem.nextRevisionAt || problem.nextReviewDate;
    const targetDate = startOfDay(new Date(targetDateStr));
    const today = startOfDay(new Date());

    if (isBefore(targetDate, today)) {
        return 'Overdue';
    }

    // Since we normalized both to startOfDay, equality check works for "Due Today"
    if (targetDate.getTime() === today.getTime()) {
        return 'Due Today';
    }

    return 'Upcoming';
};

/**
 * Sorts problems by Urgency (Overdue > Due Today > Upcoming) then Difficulty (Hard > Medium > Easy).
 * @param {Array} problems 
 * @returns {Array} Sorted new array
 */
export const getSmartSortedProblems = (problems = []) => {
    const difficultyScore = { 'Hard': 3, 'Medium': 2, 'Easy': 1, 'Unknown': 0 };
    const statusScore = { 'Overdue': 3, 'Due Today': 2, 'Upcoming': 1, 'Unknown': 0 };

    // Pre-calculate status to avoid re-computing during sort
    const withStatus = problems.map(p => ({
        ...p,
        _tempStatus: getProblemStatus(p)
    }));

    return withStatus.sort((a, b) => {
        const statusA = statusScore[a._tempStatus] || 0;
        const statusB = statusScore[b._tempStatus] || 0;

        if (statusA !== statusB) {
            return statusB - statusA; // Higher status first
        }

        // If status same, sort by difficulty (descending)
        const diffA = difficultyScore[a.difficulty] || 0;
        const diffB = difficultyScore[b.difficulty] || 0;
        return diffB - diffA;
    }).map(({ _tempStatus, ...p }) => p); // Remove temp field
};

// --- Derived Metrics ---

/**
 * Calculates Mastery Score (0-100)
 * Formula: min(100, (revisionCount * 15) + (daysSinceCreated / 10))
 * @param {Object} problem 
 * @returns {number}
 */
export const calculateMastery = (problem) => {
    const revisions = problem.revisedCount || problem.revisionCount || 0;

    // Estimate creation date if not present. Use lastRevised or default to now (score 0 for age)
    const createdAt = problem.createdAt ? new Date(problem.createdAt) : new Date();
    const daysActive = differenceInDays(new Date(), createdAt);

    const score = (revisions * 15) + (daysActive / 10);
    return Math.min(100, Math.floor(score));
};

/**
 * Calculates Retention Rate
 * % of problems with > 3 revisions
 * @param {Array} problems 
 * @returns {number} 0-100
 */
export const calculateRetention = (problems = []) => {
    if (!problems.length) return 0;
    const stableProblems = problems.filter(p => {
        const count = p.revisedCount || p.revisionCount || 0;
        return count > 3;
    });
    return Math.round((stableProblems.length / problems.length) * 100);
};

/**
 * Calculates Learning Health
 * Composite score based on backlog size.
 * @param {Array} problems 
 * @returns {Object} { score: 0-100, status: 'Great' | 'Good' | 'Needs Attention', overdueCount }
 */
export const calculateLearningHealth = (problems = []) => {
    if (!problems.length) return { score: 100, status: 'Great', overdueCount: 0 };

    const overdueCount = problems.filter(p => getProblemStatus(p) === 'Overdue').length;

    // Simple health algorithm: Start at 100, deduct 10 for every overdue problem
    let score = 100 - (overdueCount * 10);
    score = Math.max(0, score); // Clamp at 0

    let status = 'Great';
    if (score < 50) status = 'Needs Attention';
    else if (score < 80) status = 'Good';

    return { score, status, overdueCount };
};

/**
 * Calculates Mastery Level (0-5) for visual progress bar.
 * @param {Object} problem
 * @returns {number} 0 to 5
 */
export const calculateMasteryLevel = (problem) => {
    const revisions = problem.revisedCount || problem.revisionCount || 0;
    return Math.min(5, revisions);
};

/**
 * Returns an Urgency Score (1-10) for UI highlights.
 * @param {Object} problem
 * @returns {{score: number, label: string, color: string}}
 */

