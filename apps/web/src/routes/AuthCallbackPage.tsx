import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function AuthCallbackPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase auto-detects the hash via detectSessionInUrl: true.
    // Once the session lands, bounce to /.
    if (!loading && session) {
      navigate("/", { replace: true });
    }
  }, [session, loading, navigate]);

  if (!loading && !session) {
    // Hash was invalid / expired — back to login.
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="section" style={{ textAlign: "center", marginTop: 80 }}>
      <div className="eyebrow" style={{ color: "var(--fari-mint)" }}>
        Inloggen…
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
        Sessie wordt verwerkt
      </div>
    </div>
  );
}
