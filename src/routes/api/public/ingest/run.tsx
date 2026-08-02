import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const listingSchema = z.object({
  external_id: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  category: z.enum(["real_estate", "apartments", "cars", "motorcycles"]),
  title: z.string().min(1).max(500),
  description: z.string().max(20000).optional().nullable(),
  price_eur: z.number().nonnegative().max(100_000_000),
  currency: z.string().length(3).default("EUR"),
  country_code: z.string().length(2),
  city_name: z.string().max(200).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  images: z.array(z.string().url()).max(40).default([]),
  attributes: z.record(z.string(), z.unknown()).default({}),
  source_lang: z.string().max(5).optional().nullable(),
  posted_at: z.string().datetime().optional(),
});

const payloadSchema = z.object({
  source_slug: z.string().min(1).max(80),
  run_id: z.string().max(80).optional(),
  status: z.enum(["ok", "degraded", "blocked", "down"]).default("ok"),
  error: z.string().max(1000).optional().nullable(),
  listings: z.array(listingSchema).max(500).default([]),
});

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/ingest/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["INGEST_SECRET"];
        if (!secret) return new Response("Ingest not configured", { status: 503 });

        const provided = request.headers.get("x-ingest-secret") ?? "";
        if (!timingSafeEqual(provided, secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let parsed;
        try {
          parsed = payloadSchema.parse(await request.json());
        } catch (err) {
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "Invalid payload" },
            { status: 400 },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: source } = await supabaseAdmin
          .from("sources")
          .select("id")
          .eq("slug", parsed.source_slug)
          .maybeSingle();

        if (!source) return Response.json({ ok: false, error: "Unknown source" }, { status: 404 });

        let inserted = 0;
        if (parsed.listings.length > 0) {
          // Städte per Name/PLZ + Land auflösen (best effort).
          const rows = [];
          for (const l of parsed.listings) {
            let cityId: string | null = null;
            let regionId: string | null = null;
            if (l.city_name || l.postal_code) {
              const q = supabaseAdmin
                .from("cities")
                .select("id,region_id")
                .eq("country_code", l.country_code)
                .limit(1);
              const { data: city } = l.postal_code
                ? await q.eq("postal_code", l.postal_code)
                : await q.ilike("name", l.city_name!);
              cityId = city?.[0]?.id ?? null;
              regionId = city?.[0]?.region_id ?? null;
            }
            rows.push({
              source_id: source.id,
              external_id: l.external_id,
              url: l.url,
              category: l.category,
              title: l.title,
              description: l.description ?? null,
              price_eur: l.price_eur,
              currency: l.currency,
              country_code: l.country_code,
              city_id: cityId,
              region_id: regionId,
              lat: l.lat ?? null,
              lng: l.lng ?? null,
              images: l.images,
              attributes: l.attributes,
              source_lang: l.source_lang ?? null,
              posted_at: l.posted_at ?? new Date().toISOString(),
              fetched_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              active: true,
            };
          }
          const { error, count } = await supabaseAdmin
            .from("listings")
            .upsert(rows as never, { onConflict: "source_id,external_id", count: "exact" });
          if (error) {
            await supabaseAdmin.from("source_events").insert({
              source_id: source.id,
              level: "error",
              kind: "ingest_write_failed",
              message: error.message,
            });
            return Response.json({ ok: false, error: error.message }, { status: 500 });
          }
          inserted = count ?? rows.length;
        }

        const healthy = parsed.status === "ok";
        await supabaseAdmin
          .from("sources")
          .update({
            health: parsed.status,
            last_run_at: new Date().toISOString(),
            ...(healthy
              ? { last_success_at: new Date().toISOString(), fail_count: 0, last_error: null }
              : { last_error: parsed.error ?? parsed.status }),
          })
          .eq("id", source.id);

        await supabaseAdmin.from("source_events").insert({
          source_id: source.id,
          level: healthy ? "info" : parsed.status === "blocked" ? "warn" : "error",
          kind: healthy ? "ingest_run" : `ingest_${parsed.status}`,
          message: parsed.error ?? `${inserted} Anzeigen verarbeitet`,
          meta: { run_id: parsed.run_id ?? null, count: inserted },
        });

        return Response.json({ ok: true, upserted: inserted });
      },
    },
  },
});
