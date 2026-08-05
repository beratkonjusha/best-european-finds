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
};

export async function requestLiveIngest(input: LiveSearchInput): Promise<LiveSearchResult> {
  const workerUrl = process.env["INGEST_WORKER_URL"];
  const workerToken = process.env["INGEST_WORKER_TOKEN"];
  if (!workerUrl || !workerToken) {
    return { accepted: false, jobId: null, message: "not_configured" };
  }

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