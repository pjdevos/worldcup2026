// Admin-triggered manual fetch. Auth: requires a valid Supabase JWT from a
// user whose profile has `is_admin = true`. The CRON_SECRET is never exposed
// to the client — admin just sends their own access token.

import { createClient } from "@supabase/supabase-js";
import { runFetchResults } from "../_lib/fetch-results";

export const config = { runtime: "nodejs" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return json({ error: "Server missing Supabase env vars" }, 500);
  }

  // Extract the user's access token from the Authorization header.
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!bearer) {
    return json({ error: "Missing Bearer token" }, 401);
  }

  // Verify the JWT and look up the user's profile via service role.
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userRes = await supabase.auth.getUser(bearer);
  if (userRes.error || !userRes.data?.user) {
    return json({ error: "Invalid or expired token" }, 401);
  }

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", userRes.data.user.id)
    .maybeSingle();

  if (profErr || !profile || !profile.is_admin) {
    return json({ error: "Forbidden — admin only" }, 403);
  }

  try {
    const summary = await runFetchResults();
    return json(summary, summary.ok ? 200 : 502);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
