import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DbProfile } from "./database.types";
import { getProfile } from "./queries";
import { supabase } from "./supabase";

interface AuthCtx {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      qc.invalidateQueries({ queryKey: ["profile"] });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
        qc.clear();
      },
    }),
    [session, loading, qc],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery<DbProfile | null>({
    queryKey: ["profile", userId ?? "anon"],
    enabled: Boolean(userId),
    queryFn: () => (userId ? getProfile(userId) : Promise.resolve(null)),
  });
}
