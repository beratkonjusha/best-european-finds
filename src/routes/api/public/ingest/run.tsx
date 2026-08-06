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

        const { storeIngestResult } = await import("@/lib/ingest/store.server");
        const result = await storeIngestResult({
          sourceSlug: parsed.source_slug,
          listings: parsed.listings,
          status: parsed.status,
          error: parsed.error ?? null,
          runId: parsed.run_id ?? null,
        });

        if (!result.ok) {
          return Response.json({ ok: false, error: result.error }, { status: result.status });
        }

        return Response.json({
          ok: true,
          upserted: result.upserted,
          retry_after_seconds: result.retryAfterSeconds,
        });
      },
    },
  },
});
