import { Navigate, useLocation } from "react-router-dom";
import { useIdentity, useProfile } from "../lib/identity";

/**
 * Gate a route behind the shared-password login. If not signed in, redirect
 * to /login. If `requireAdmin` is set, also enforce the profile's is_admin
 * flag (set per-name via SQL).
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const identity = useIdentity();
  const { data: profile, isLoading } = useProfile();
  const location = useLocation();

  if (!identity) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin) {
    if (isLoading) return null;
    if (!profile?.is_admin) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
