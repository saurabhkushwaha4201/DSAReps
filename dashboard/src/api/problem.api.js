import api from "./axios";

/**
 * Save a new problem (manual add from dashboard)
 * @param {Object} data - { platform, title, url, difficulty, attemptType, notes? }
 */
export const saveProblem = async (data) => {
  const res = await api.post('/api/problems', data);
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

/**
 * Reschedule a problem to a specific date (manual override)
 * @param {string} id - problem id
 * @param {string} date - ISO date string (YYYY-MM-DD)
 */
export const rescheduleProblem = async (id, date) => {
  const res = await api.put(`/api/problems/${id}/reschedule`, { date });
  return res.data;
};

/**
 * Fetch user settings (revision intervals + daily cap)
 */
export const getUserSettings = async () => {
  const res = await api.get('/api/user/settings');
  return res.data;
};

/**
 * Update user settings
 * @param {Object} settings - { revisionIntervals?: { hard, medium, easy }, dailyGoal?: number }
 */
export const updateUserSettings = async (settings) => {
  const res = await api.put('/api/user/settings', settings);
  return res.data;
};
