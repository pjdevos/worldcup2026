// Vercel cron entry — runs on the schedule in vercel.json (default: hourly).
// Auth: requires `Authorization: Bearer <CRON_SECRET>` header. Vercel cron
// sends this automatically; external schedulers (cron-job.org etc.) must
// include it manually.
//
// Runs on the Node.js runtime (the default — no `config` export). It must NOT
// use the Edge runtime: `runFetchResults` builds a `@supabase/supabase-js`
// client, which pulls in the realtime/ws dependency that crashes on Edge.
//
// The heavy module (`../_lib/fetch-results`, which imports supabase-js) is
// loaded with a dynamic import INSIDE the handler so any load-time failure is
// caught and returned as readable JSON instead of an opaque
// FUNCTION_INVOCATION_FAILED. This route module itself has no runtime imports.

import type { IncomingMessage, ServerResponse } from "node:http";

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return send(res, 500, { error: "CRON_SECRET not configured" });
  }

  const auth = req.headers.authorization ?? "";
  if (auth !== `Bearer ${secret}`) {
    return send(res, 401, { error: "Unauthorized" });
  }

  try {
    const { runFetchResults } = await import("../_lib/fetch-results");
    const summary = await runFetchResults();
    return send(res, summary.ok ? 200 : 502, summary);
  } catch (err) {
    // Log to Vercel Runtime Logs (the JSON body below is only seen by the
    // cron caller, which discards it).
    console.error("[cron/fetch-results] failed:", err);
    const msg =
      err instanceof Error
        ? `${err.message}\n${err.stack ?? ""}`
        : String(err);
    return send(res, 500, { error: msg });
  }
}
