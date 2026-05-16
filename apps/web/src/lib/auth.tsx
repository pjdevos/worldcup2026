import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AuthCtx {
  playerName: string | null;
  loading: boolean;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const PLAYER_NAME_KEY = "worldcup_player_name";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    // Load player name from localStorage on mount
    const saved = localStorage.getItem(PLAYER_NAME_KEY);
    setPlayerName(saved);
    setLoading(false);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      playerName,
      loading,
      signOut: () => {
        localStorage.removeItem(PLAYER_NAME_KEY);
        setPlayerName(null);
        qc.clear();
      },
    }),
    [playerName, loading, qc],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
