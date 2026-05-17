import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DbProfile } from "./database.types";
import { getProfile } from "./queries";
import { supabase } from "./supabase";

/** What we persist about the signed-in player. */
export interface Identity {
  name: string;
  userId: string;
}

interface IdentityCtx {
  identity: Identity | null;
  loading: boolean;
  login: (name: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "wc2026.identity";
const Ctx = createContext<IdentityCtx | null>(null);

function readStored(): Identity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as Identity).name === "string" &&
      typeof (parsed as Identity).userId === "string"
    ) {
      return {
        name: (parsed as Identity).name,
        userId: (parsed as Identity).userId,
      };
    }
  } catch {
    /* malformed — fall through */
  }
  return null;
}

function writeStored(id: Identity | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(id));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(() => readStored());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (name: string, password: string) => {
    const expected = import.meta.env.VITE_APP_PASSWORD;
    if (!expected) {
      throw new Error(
        "App password not configured — set VITE_APP_PASSWORD in your env.",
      );
    }
    if (password !== expected) {
      throw new Error("Incorrect password.");
    }
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Please enter your name.");
    }

    setLoading(true);
    try {
      // 1. Try to find an existing profile for this name.
      const { data: existing, error: selErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("display_name", trimmed)
        .maybeSingle();
      if (selErr) throw selErr;

      let userId: string;
      if (existing && typeof (existing as { user_id?: string }).user_id === "string") {
        userId = (existing as { user_id: string }).user_id;
      } else {
        // 2. Not found — create a fresh profile with a client-generated UUID.
        userId = crypto.randomUUID();
        const { error: insErr } = await supabase
          .from("profiles")
          .insert({ user_id: userId, display_name: trimmed });
        if (insErr) {
          // Race condition: someone with the same name created a profile in
          // the meantime. Re-query to pick up their UUID.
          const { data: re, error: reErr } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("display_name", trimmed)
            .single();
          if (reErr || !re) throw insErr;
          userId = (re as { user_id: string }).user_id;
        }
      }

      const id: Identity = { name: trimmed, userId };
      writeStored(id);
      setIdentity(id);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    writeStored(null);
    setIdentity(null);
  }, []);

  const value = useMemo<IdentityCtx>(
    () => ({ identity, loading, login, logout }),
    [identity, loading, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useIdentity(): Identity | null {
  const c = useContext(Ctx);
  if (!c) throw new Error("useIdentity must be used inside <IdentityProvider>");
  return c.identity;
}

export function useIdentityActions(): Pick<IdentityCtx, "login" | "logout" | "loading"> {
  const c = useContext(Ctx);
  if (!c) throw new Error("useIdentityActions must be used inside <IdentityProvider>");
  return { login: c.login, logout: c.logout, loading: c.loading };
}

/**
 * Load the current player's full profile from the DB (display_name, is_admin,
 * tiebreaker, top_scorer, bonus_points, ...). Auto-invalidated when the
 * identity changes.
 */
export function useProfile() {
  const identity = useIdentity();
  return useQuery<DbProfile | null>({
    queryKey: ["profile", identity?.userId ?? "anon"],
    enabled: Boolean(identity),
    queryFn: () =>
      identity ? getProfile(identity.userId) : Promise.resolve(null),
  });
}
