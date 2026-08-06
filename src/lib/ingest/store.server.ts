// Gemeinsame Schreib- und Health-Logik für alle Ingest-Wege
// (externer Worker via /api/public/ingest/run und interne Live-Adapter).

export type NormalizedListing = {
  external_id: string;
  url: string;
  category: "real_estate" | "apartments" | "cars" | "motorcycles";
  title: string;
  description?: string | null;
  price_eur: number;
  currency?: string;
  country_code: string;
  city_name?: string | null;
  postal_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  images?: string[];
  attributes?: Record<string, unknown>;
  source_lang?: string | null;
  posted_at?: string;
};

export type IngestStatus = "ok" | "degraded" | "blocked" | "down";

export type StoreResult =
  | { ok: true; upserted: number; retryAfterSeconds: number | null }
  | { ok: false; error: string; status: number };

export async function storeIngestResult(params: {
  sourceSlug: string;
  listings: NormalizedListing[];
  status: IngestStatus;
  error?: string | null;
  runId?: string | null;
}): Promise<StoreResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: source } = await supabaseAdmin
    .from("sources")
    .select("id,fail_count,backoff_seconds,fallback_slug")
    .eq("slug", params.sourceSlug)
    .maybeSingle();

  if (!source) return { ok: false, error: "Unknown source", status: 404 };

  let inserted = 0;
  if (params.listings.length > 0) {
    const now = new Date().toISOString();
    const rows = [];
    // Städte per PLZ/Name + Land auflösen (best effort, mit kleinem Cache).
    const cityCache = new Map<string, { id: string; region_id: string | null } | null>();
    for (const l of params.listings) {
      let cityId: string | null = null;
      let regionId: string | null = null;
      const key = `${l.country_code}|${l.postal_code ?? ""}|${l.city_name ?? ""}`;
      if (l.city_name || l.postal_code) {
        if (!cityCache.has(key)) {
          let hit: { id: string; region_id: string | null } | null = null;
          if (l.postal_code) {
            const { data } = await supabaseAdmin
              .from("cities")
              .select("id,region_id")
              .eq("country_code", l.country_code)
              .eq("postal_code", l.postal_code)
              .limit(1);
            hit = data?.[0] ?? null;
          }
          if (!hit && l.city_name) {
            const { data } = await supabaseAdmin
              .from("cities")
              .select("id,region_id")
              .eq("country_code", l.country_code)
              .ilike("name", l.city_name)
              .limit(1);
            hit = data?.[0] ?? null;
          }
          cityCache.set(key, hit);

        }
        const hit = cityCache.get(key) ?? null;
        cityId = hit?.id ?? null;
        regionId = hit?.region_id ?? null;
      }
      rows.push({
        source_id: source.id,
        external_id: l.external_id,
        url: l.url,
        category: l.category,
        title: l.title,
        description: l.description ?? null,
        price_eur: l.price_eur,
        currency: l.currency ?? "EUR",
        country_code: l.country_code,
        city_id: cityId,
        region_id: regionId,
        lat: l.lat ?? null,
        lng: l.lng ?? null,
        images: l.images ?? [],
        attributes: l.attributes ?? {},
        source_lang: l.source_lang ?? null,
        posted_at: l.posted_at ?? now,
        fetched_at: now,
        last_seen_at: now,
        active: true,
      });
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
      return { ok: false, error: error.message, status: 500 };
    }
    inserted = count ?? rows.length;
  }

  const healthy = params.status === "ok";
  const failCount = healthy ? 0 : (source.fail_count ?? 0) + 1;
  // Exponentielles Backoff (5 Min → max. 6 h), damit blockierte Quellen nicht hämmern.
  const backoff = healthy ? 300 : Math.min(300 * 2 ** Math.min(failCount, 7), 21_600);
  const nextRetryAt = healthy ? null : new Date(Date.now() + backoff * 1000).toISOString();

  await supabaseAdmin
    .from("sources")
    .update({
      health: params.status,
      last_run_at: new Date().toISOString(),
      fail_count: failCount,
      backoff_seconds: backoff,
      next_retry_at: nextRetryAt,
      ...(healthy
        ? { last_success_at: new Date().toISOString(), last_error: null }
        : { last_error: params.error ?? params.status }),
    })
    .eq("id", source.id);

  // Fallback-Quelle aktivieren, sobald eine Quelle mehrfach ausfällt.
  let fallbackActivated: string | null = null;
  if (!healthy && failCount >= 3 && source.fallback_slug) {
    const { data: fb } = await supabaseAdmin
      .from("sources")
      .select("id,enabled")
      .eq("slug", source.fallback_slug)
      .maybeSingle();
    if (fb) {
      if (!fb.enabled) {
        await supabaseAdmin.from("sources").update({ enabled: true }).eq("id", fb.id);
      }
      fallbackActivated = source.fallback_slug;
    }
  }

  await supabaseAdmin.from("source_events").insert({
    source_id: source.id,
    level: healthy ? "info" : params.status === "blocked" ? "warn" : "error",
    kind: healthy ? "ingest_run" : `ingest_${params.status}`,
    message: params.error ?? `${inserted} Anzeigen verarbeitet`,
    meta: {
      run_id: params.runId ?? null,
      count: inserted,
      fail_count: failCount,
      next_retry_at: nextRetryAt,
      fallback: fallbackActivated,
    },
  });

  return { ok: true, upserted: inserted, retryAfterSeconds: healthy ? null : backoff };
}
