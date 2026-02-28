/**
 * Spaced Repetition Logic (SRS)
 * Calculates the next review date based on user confidence.
 */
import { startOfDay } from './intelligence.js';

const CONFIDENCE_MULTIPLIERS = {
    STRUGGLED: 0.5, // Reset or reduce
    OKAY: 1.5,      // Standard growth
    MASTERED: 2.5   // Acceleration
};

const MIN_INTERVAL = 1; // Minimum 1 day

/**
 * Calculates the next revision date and interval.
 * @param {number} currentInterval - Current interval in days (default 1 if 0/null)
 * @param {'STRUGGLED' | 'OKAY' | 'MASTERED'} confidence 
 * @returns {{ nextDate: Date, newInterval: number }}
 */
export const calculateNextReview = (currentInterval, confidence) => {
    // If no interval exists (first time or lost data), assume 1 day
    let safeInterval = currentInterval || 1;

    // If STRUGGLED, we actually reset to 1 (concept: " relearn today/tomorrow")
    // Alternatively, we could do safeInterval * 0.5, but hard struggle usually means "do it again soon"
    // Let's stick to the multiplier logic but clamp at 1.

    let multiplier = CONFIDENCE_MULTIPLIERS[confidence] || 1.5;

    if (confidence === 'STRUGGLED') {
        // Special case: If struggled, reset to 1 day to enforce re-learning
        safeInterval = 1;
    } else {
        safeInterval = Math.ceil(safeInterval * multiplier);
    }

    const newInterval = Math.max(MIN_INTERVAL, safeInterval);

    const nextDate = startOfDay(new Date());
    nextDate.setDate(nextDate.getDate() + newInterval);

    return {
        nextDate,
        newInterval
    };
};
