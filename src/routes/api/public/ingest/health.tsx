import { createFileRoute } from "@tanstack/react-router";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Selbsttest für den externen Ingest-Worker: prüft Secret und meldet,
 * ob die Live-Such-Verdrahtung vollständig konfiguriert ist.
 */
export const Route = createFileRoute("/api/public/ingest/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["INGEST_SECRET"];
        if (!secret) return Response.json({ ok: false, error: "INGEST_SECRET missing" }, { status: 503 });

        const provided = request.headers.get("x-ingest-secret") ?? "";
        if (!timingSafeEqual(provided, secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: sources } = await supabaseAdmin
          .from("sources")
          .select("slug,name,enabled,health,last_success_at,fail_count,next_retry_at,country_codes")
          .order("slug");

        return Response.json({
          ok: true,
          live_search_configured: Boolean(
            process.env["INGEST_WORKER_URL"] && process.env["INGEST_WORKER_TOKEN"],
          ),
          sources: sources ?? [],
        });
      },
    },
  },
});
