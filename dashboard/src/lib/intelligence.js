/**
 * DSA Revision Tracker - Intelligence Layer (V2)
 * Cleaned for V2 pivot. V1 SRS/Mastery/Retention/Health logic removed.
 * Only generic date utilities remain.
 */

/**
 * Returns a new Date object set to the very start of the day (00:00:00.000)
 * @param {Date|number|string} date 
 * @returns {Date}
 */
export const startOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Checks if the first date is strictly before the second date.
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

