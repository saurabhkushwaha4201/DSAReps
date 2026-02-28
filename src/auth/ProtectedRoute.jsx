import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // While checking auth (restoring token)
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Authenticated → allow access
  return children;
}
