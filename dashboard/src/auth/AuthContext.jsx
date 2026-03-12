import { createContext, useContext, useEffect, useState } from "react";
import { loginWithGoogle } from "../api/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, restore token & check expiry
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        // Check expiry
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          console.log('Session expired');
          localStorage.removeItem("token");
          setToken(null);
        } else {
          setToken(storedToken);
        }
      } catch (e) {
        localStorage.removeItem("token");
        setToken(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (credential) => {
    const data = await loginWithGoogle(credential);
    localStorage.setItem("token", data.token);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    // Let ProtectedRoute handle the client-side redirect to /login.
    // Avoid a hard browser navigation because Vercel will 404 on /login
    // without an SPA rewrite rule.
    setToken(null);
  };

  const isAuthenticated = Boolean(token);
  const getCurrentUser = () => {
    return localStorage.getItem("token");
  };

  // Derive user from token safely
  const user = token ? (() => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) { return null; }
  })() : null;

  const value = {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    getCurrentUser,
    loading,
  };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
