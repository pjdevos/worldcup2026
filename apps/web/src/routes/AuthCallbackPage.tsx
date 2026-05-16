import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function AuthCallbackPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate("/", { replace: true });
    }
  }, [session, loading, navigate]);

  if (!loading && !session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="section" style={{ textAlign: "center", marginTop: 80 }}>
      <div className="eyebrow" style={{ color: "var(--fari-mint)" }}>
        Signing you in…
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
        Processing your session
      </div>
    </div>
  );
}
