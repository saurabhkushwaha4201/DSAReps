import api from "./axios";

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

/**
 * Fetch today's triage tasks (max 3, Anti-Avalanche)
 */
export const getTodayTasks = async () => {
  const res = await api.get('/api/problems/today');
  return res.data;
};

/**
 * Submit a revision rating for a problem
 * @param {string} id - problem id
 * @param {string} rating - FORGOT | SLOW | CLEAN
 */
export const reviseProblem = async (id, rating) => {
  const res = await api.post(`/api/problems/${id}/revise`, {
    rating,
    device: 'Web',
  });
  return res.data;
};

/**
 * Fetch dashboard stats (heatmap, weak clusters, streak)
 */
export const getStats = async () => {
  const res = await api.get('/api/problems/stats');
  return res.data;
};
