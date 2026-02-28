import api from "./axios";

/**
 * Exchange Google credential for app JWT
 */
export const loginWithGoogle = async (credential) => {
  const res = await api.post("/api/auth/google", { credential });
  return res.data; // { token }
};
