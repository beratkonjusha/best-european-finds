import { createFileRoute } from "@tanstack/react-router";

type Filters = {
  q?: string;
  category?: string;
  country?: string;
  regionId?: string;
  cityId?: string;
  sourceIds?: string[];
  priceMin?: string;
  priceMax?: string;
};

/** Idempotenz-Fenster: pro Suche + Throttle-Slot genau ein Dispatch. */
function dispatchKey(searchId: string, throttleMinutes: number) {
  const slot = Math.floor(Date.now() / (Math.max(throttleMinutes, 1) * 60 * 1000));
  return `${searchId}:${throttleMinutes}:${slot}`;
}

/** Endpunkte, die dauerhaft ungültig sind, werden entfernt. */
function isGone(status: number) {
  return status === 400 || status === 401 || status === 403 || status === 404 || status === 410;
}

/**
 * Cron-Endpunkt: prüft gespeicherte Suchen und sendet Push für neue Treffer.
 * Throttle pro Suche, Idempotenz pro Zeitfenster, Duplikatschutz über public.push_deliveries.
 */
export const Route = createFileRoute("/api/public/push/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["INGEST_SECRET"];
        if (!secret) return new Response("Push dispatch not configured", { status: 503 });
        if ((request.headers.get("x-ingest-secret") ?? "") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendWebPush } = await import("@/lib/webpush.server");

        const { data: searches } = await supabaseAdmin
          .from("saved_searches")
          .select("id,user_id,label,query,notify,throttle_minutes,last_notified_at")
          .eq("notify", true);

        let notified = 0;
        let skipped = 0;
        let removedTokens = 0;

        for (const search of searches ?? []) {
          const throttleMinutes = search.throttle_minutes ?? 60;
          const throttle = throttleMinutes * 60 * 1000;
          const last = search.last_notified_at ? Date.parse(search.last_notified_at) : 0;
          if (Date.now() - last < throttle) {
            skipped += 1;
            continue;
          }

          // Idempotenz: parallele/wiederholte Cron-Läufe im selben Slot abweisen.
          const key = dispatchKey(search.id, throttleMinutes);
          const { error: claimError } = await supabaseAdmin
            .from("push_dispatch_runs")
            .insert({ saved_search_id: search.id, dispatch_key: key });
          if (claimError) {
            skipped += 1;
            continue;
          }

          const f = (search.query ?? {}) as Filters;
          let q = supabaseAdmin
            .from("listings")
            .select("id,title,price_eur,currency,price_band,images")
            .eq("active", true)
            .order("price_eur", { ascending: true })
            .limit(5);

          if (search.last_notified_at) q = q.gt("fetched_at", search.last_notified_at);
          if (f.category && f.category !== "all") q = q.eq("category", f.category as never);
          if (f.country) q = q.eq("country_code", f.country);
          if (f.regionId) q = q.eq("region_id", f.regionId);
          if (f.cityId) q = q.eq("city_id", f.cityId);
          if (f.sourceIds?.length) q = q.in("source_id", f.sourceIds);
          if (f.priceMin) q = q.gte("price_eur", Number(f.priceMin));
          if (f.priceMax) q = q.lte("price_eur", Number(f.priceMax));
          if (f.q) q = q.ilike("title", `%${f.q}%`);

          const { data: matches } = await q;
          if (!matches?.length) {
            await supabaseAdmin
              .from("saved_searches")
              .update({ last_checked_at: new Date().toISOString() })
              .eq("id", search.id);
            continue;
          }

          // Serverseitiger Duplikatschutz: Auslieferung vorab reservieren.
          const { data: claimed } = await supabaseAdmin
            .from("push_deliveries")
            .upsert(
              matches.map((m) => ({
                user_id: search.user_id,
                saved_search_id: search.id,
                listing_id: m.id,
              })),
              { onConflict: "user_id,listing_id", ignoreDuplicates: true },
            )
            .select("listing_id");

          const claimedIds = new Set((claimed ?? []).map((c) => c.listing_id));
          const fresh = matches.filter((m) => claimedIds.has(m.id));
          if (!fresh.length) {
            skipped += 1;
            continue;
          }

          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("id,endpoint,keys")
            .eq("user_id", search.user_id);
          if (!subs?.length) continue;

          const top = fresh[0]!;
          const payload = {
            title: search.label,
            body:
              fresh.length > 1
                ? `${fresh.length} neue Treffer – ab ${Math.round(Number(top.price_eur))} €`
                : `${top.title} – ${Math.round(Number(top.price_eur))} €`,
            url: fresh.length > 1 ? "/" : `/listing/${top.id}`,
            image: Array.isArray(top.images) ? (top.images[0] as string | undefined) : undefined,
            tag: `search-${search.id}`,
          };

          let deliveredForSearch = 0;
          for (const sub of subs) {
            const res = await sendWebPush(sub as never, payload);
            if (res.gone || isGone(res.status)) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
              removedTokens += 1;
            } else if (res.ok) {
              notified += 1;
              deliveredForSearch += 1;
              await supabaseAdmin
                .from("push_subscriptions")
                .update({ last_success_at: new Date().toISOString() })
                .eq("id", sub.id);
            }
          }

          // Kein Empfänger erreicht → Reservierung freigeben, damit später erneut zugestellt wird.
          if (deliveredForSearch === 0) {
            await supabaseAdmin
              .from("push_deliveries")
              .delete()
              .eq("user_id", search.user_id)
              .in(
                "listing_id",
                fresh.map((m) => m.id),
              );
          } else {
            await supabaseAdmin
              .from("push_dispatch_runs")
              .update({ notified: deliveredForSearch })
              .eq("saved_search_id", search.id)
              .eq("dispatch_key", key);
          }

          await supabaseAdmin
            .from("saved_searches")
            .update({
              last_notified_at: new Date().toISOString(),
              last_checked_at: new Date().toISOString(),
            })
            .eq("id", search.id);
        }

        return Response.json({ ok: true, notified, skipped, removedTokens });
      },
    },
  },
});
