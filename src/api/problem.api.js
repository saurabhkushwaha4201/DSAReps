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


