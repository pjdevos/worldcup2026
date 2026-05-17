import { Route, Routes } from "react-router-dom";
import { AppNav } from "./components/AppNav";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { IdentityProvider } from "./lib/identity";
import { AdminPage } from "./routes/AdminPage";
import { HomePage } from "./routes/HomePage";
import { LeaderboardPage } from "./routes/LeaderboardPage";
import { LoginPage } from "./routes/LoginPage";
import { PredictPage } from "./routes/PredictPage";
import { ProfilePage } from "./routes/ProfilePage";
import { SchedulePage } from "./routes/SchedulePage";

export default function App() {
  return (
    <IdentityProvider>
      <div className="fari-bg" />
      <div className="shell">
        <AppNav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route
            path="/predict/:matchId"
            element={
              <ProtectedRoute>
                <PredictPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <Footer />
    </IdentityProvider>
  );
}
