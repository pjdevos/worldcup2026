// Vercel cron entry — runs on the schedule in vercel.json (default: hourly).
// Auth: requires `Authorization: Bearer <CRON_SECRET>` header. Vercel cron
// sends this automatically; external schedulers (cron-job.org etc.) must
// include it manually.

import { runFetchResults } from "../_lib/fetch-results";

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response(
      JSON.stringify({ error: "CRON_SECRET not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const summary = await runFetchResults();
    return new Response(JSON.stringify(summary), {
      status: summary.ok ? 200 : 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
