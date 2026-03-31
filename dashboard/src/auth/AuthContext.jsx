import { createContext, useCallback, useContext, useState } from "react";
import { loginWithGoogle } from "../api/auth.api";

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "authUser";

const base64UrlToUint8Array = (base64Url) => {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binaryString = atob(padded);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
};

const decodeJwtPayload = (token) => {
  if (!token) return null;

  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;

    const bytes = base64UrlToUint8Array(payloadSegment);
    const decodedString = new TextDecoder('utf-8').decode(bytes);

    return JSON.parse(decodedString);
  } catch {
    return null;
  }
};

const normalizeUser = (rawUser = {}, fallbackUser = {}) => {
  const safeRawUser = rawUser && typeof rawUser === 'object' ? rawUser : {};
  const safeFallbackUser = fallbackUser && typeof fallbackUser === 'object' ? fallbackUser : {};

  const name = (safeRawUser.name || safeFallbackUser.name || '').trim();
  const email = safeRawUser.email || safeFallbackUser.email || null;
  const id = safeRawUser.id || safeRawUser.userId || safeFallbackUser.id || safeFallbackUser.userId || null;
  const picture = safeRawUser.picture || safeRawUser.avatar || safeFallbackUser.picture || safeFallbackUser.avatar || null;
  const firstName = name ? name.split(/\s+/)[0] : null;

  if (!email && !name && !picture && !id) {
    return null;
  }

  return {
    id,
    email,
    name,
    firstName,
    avatar: picture,
    picture,
  };
};

const getInitialAuthState = () => {
  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!storedToken) {
    return { token: null, user: null };
  }

  const payload = decodeJwtPayload(storedToken);
  if (!payload || payload.exp * 1000 < Date.now()) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    return { token: null, user: null };
  }

  let storedUser = null;
  try {
    const rawStoredUser = localStorage.getItem(USER_STORAGE_KEY);
    storedUser = rawStoredUser ? JSON.parse(rawStoredUser) : null;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  const normalizedUser = normalizeUser(storedUser, payload) || normalizeUser(payload);
  if (normalizedUser) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
  }

  return { token: storedToken, user: normalizedUser };
};

export const AuthProvider = ({ children }) => {
  const [initialAuth] = useState(getInitialAuthState);
  const [token, setToken] = useState(initialAuth.token);
  const [authUser, setAuthUser] = useState(initialAuth.user);
  const [loading] = useState(false);

  const clearAuthStorage = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const persistAuth = useCallback(({ nextToken, nextUser }) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);

    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      setAuthUser(nextUser);
      return;
    }

    localStorage.removeItem(USER_STORAGE_KEY);
    setAuthUser(null);
  }, []);

  const login = useCallback(async (credential) => {
    const data = await loginWithGoogle(credential);
    const payload = decodeJwtPayload(data.token);
    const normalizedUser = normalizeUser(data.user, payload) || normalizeUser(payload);
    persistAuth({ nextToken: data.token, nextUser: normalizedUser });
  }, [persistAuth]);

  const setAuthFromToken = useCallback((nextToken) => {
    const payload = decodeJwtPayload(nextToken);
    const normalizedUser = normalizeUser(payload);
    persistAuth({ nextToken, nextUser: normalizedUser });
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setAuthUser(null);
  }, [clearAuthStorage]);

  const isAuthenticated = Boolean(token);
  const getCurrentUser = () => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  };

  const user = authUser;

  const value = {
    token,
    user,
    isAuthenticated,
    login,
    setAuthFromToken,
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
