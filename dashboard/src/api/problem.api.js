import api from "./axios";

/**
 * Fetch today's problems scheduled for revision
 */
export const getTodayRevisions = async () => {
  const res = await api.get("/api/problems/today");
  return res.data;
};

/**
 * Fetch all problems with optional filters
 */
export const getAllProblems = async (filters = {}) => {
  const res = await api.get("/api/problems", {
    params: filters,
  });
  return res.data;
};

/**
 * Submit revision feedback for a problem
 * @param {string} id - problem id
 * @param {boolean} quality - true = comfortable, false = hard
 */
export const reviseProblem = async (id, quality) => {
  const res = await api.post(`/api/problems/${id}/revise`, {
    solvedComfortably: quality,
  });
  return res.data;
};

/**
 * Archive a problem (soft delete)
 */
export const archiveProblem = async (id) => {
  const res = await api.patch(`/api/problems/${id}/archive`);
  return res.data;
};

/**
 * Restore an archived problem
 */
export const unarchiveProblem = async (id) => {
  const res = await api.patch(`/api/problems/${id}/unarchive`);
  return res.data;
};

/**
 * Reschedule a problem's next review date without affecting SRS
 * @param {string} id 
 * @param {string|Date} nextDate - ISO string or Date object
 */
export const rescheduleProblem = async (id, nextDate) => {
  const res = await api.patch(`/api/problems/${id}/reschedule`, {
    nextReviewDate: nextDate
  });
  return res.data;
};

/**
 * Update problem notes
 * @param {string} id - problem id
 * @param {string} notes - Markdown notes content
 */
export const updateNotes = async (id, notes) => {
  const res = await api.patch(`/api/problems/${id}/notes`, { notes });
  return res.data;
};

/**
 * Export all user data as JSON
 */
export const exportUserData = async () => {
  const res = await api.get('/api/user/export');
  return res.data;
};
