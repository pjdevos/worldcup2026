import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

/**
 * Gate a route behind authentication. If not signed in, send to /login with
 * the original path in state so the callback can return there.
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { playerName, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!playerName) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // For now, we don't have admin role tracking in localStorage.
  // If you need admin checks, implement them separately.
  if (requireAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
