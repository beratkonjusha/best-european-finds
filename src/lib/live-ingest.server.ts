export type LiveSearchInput = {
  q: string;
  category: "all" | "real_estate" | "apartments" | "cars" | "motorcycles";
  country: string;
  regionId: string;
  cityId: string;
  radius: number;
  sourceIds: string[];
  priceMin: string;
  priceMax: string;
};

export type LiveSearchResult = {
  accepted: boolean;
  jobId: string | null;
  message: "accepted" | "not_configured" | "unavailable";
  /** Anzahl frisch eingelieferter Anzeigen (nur beim internen Adapter). */
  upserted?: number;
};

async function requestExternalWorker(
  input: LiveSearchInput,
  workerUrl: string,
  workerToken: string,
): Promise<LiveSearchResult> {
  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${workerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "live-search",
        requestedAt: new Date().toISOString(),
        filters: input,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return { accepted: false, jobId: null, message: "unavailable" };

    const body = (await response.json().catch(() => ({}))) as { jobId?: unknown };
    return {
      accepted: true,
      jobId: typeof body.jobId === "string" ? body.jobId : null,
      message: "accepted",
    };
  } catch {
    return { accepted: false, jobId: null, message: "unavailable" };
  }
}

/**
 * Interner Live-Ingest: ruft öffentlich erlaubte Suchergebnisseiten der Quelle
 * ab, normalisiert sie und schreibt sie in die Datenbank. Läuft immer dann,
 * wenn kein externer Worker konfiguriert ist.
 */
async function runInternalAdapters(input: LiveSearchInput): Promise<LiveSearchResult> {
  const { fetchKleinanzeigen, KLEINANZEIGEN_SLUG } = await import("./ingest/kleinanzeigen.server");
  const { storeIngestResult } = await import("./ingest/store.server");

  const categories: Array<"real_estate" | "apartments" | "cars" | "motorcycles"> =
    input.category === "all"
      ? ["cars", "apartments", "real_estate", "motorcycles"]
      : [input.category];

  let cityName: string | null = null;
  if (input.cityId) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("cities")
      .select("name,country_code")
      .eq("id", input.cityId)
      .maybeSingle();
    // Der interne Adapter deckt derzeit DE ab; Ortsfilter nur bei DE anwenden.
    if (data?.country_code === "DE") cityName = data.name;
  }

  const priceMin = input.priceMin ? Number(input.priceMin) : null;
  const priceMax = input.priceMax ? Number(input.priceMax) : null;

  const results = await Promise.all(
    categories.map((category) =>
      fetchKleinanzeigen({
        category,
        q: input.q || undefined,
        cityName,
        priceMin,
        priceMax,
      }),
    ),
  );

  const listings = results.flatMap((r) => r.listings);
  const blocked = results.find((r) => r.status !== "ok");
  const stored = await storeIngestResult({
    sourceSlug: KLEINANZEIGEN_SLUG,
    listings,
    status: blocked && listings.length === 0 ? blocked.status : "ok",
    error: blocked?.error ?? null,
    runId: `live-${Date.now()}`,
  });

  if (!stored.ok) return { accepted: false, jobId: null, message: "unavailable" };
  return {
    accepted: true,
    jobId: `live-${Date.now()}`,
    message: "accepted",
    upserted: stored.upserted,
  };
}

export async function requestLiveIngest(input: LiveSearchInput): Promise<LiveSearchResult> {
  const workerUrl = process.env["INGEST_WORKER_URL"];
  const workerToken = process.env["INGEST_WORKER_TOKEN"];

  if (workerUrl && workerToken) {
    const external = await requestExternalWorker(input, workerUrl, workerToken);
    if (external.accepted) return external;
  }

  return runInternalAdapters(input);
}
