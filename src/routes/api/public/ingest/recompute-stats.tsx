import { createFileRoute } from "@tanstack/react-router";

/** Health-/Statistik-Endpunkt für Cron und externe Worker. */
export const Route = createFileRoute("/api/public/ingest/recompute-stats")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["INGEST_SECRET"];
        if (!secret) return new Response("Ingest not configured", { status: 503 });
        if ((request.headers.get("x-ingest-secret") ?? "") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Anzeigen deaktivieren, die seit 24 h nicht mehr gesehen wurden.
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from("listings")
          .update({ active: false })
          .lt("last_seen_at", cutoff)
          .eq("active", true);

        const { error } = await supabaseAdmin.rpc("recompute_price_stats");
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        return Response.json({ ok: true });
      },
    },
  },
});
