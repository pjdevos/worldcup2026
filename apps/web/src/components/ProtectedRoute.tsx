import { Navigate, useLocation } from "react-router-dom";
import { useAuth, useProfile } from "../lib/auth";

/**
 * Gate a route behind authentication. If not signed in, send to /login with
 * the original path in state so the callback can return there. If the user
 * hasn't completed onboarding, send to /onboarding first.
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { session, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || profileLoading) return null;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Onboarding gate: a fresh profile gets display_name = email-local-part.
  // Treat that as "not yet onboarded".
  const emailLocal = session.user.email?.split("@")[0] ?? "";
  const needsOnboarding =
    !profile ||
    profile.display_name === emailLocal ||
    profile.display_name.trim() === "";

  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireAdmin && !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
