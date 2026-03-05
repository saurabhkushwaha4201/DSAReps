/**
 * Stats are now computed server-side via GET /api/problems/stats.
 * This helper is kept for backward compatibility.
 */
export function calculateStats(problems = []) {
    return { totalSaved: problems.length };
}
