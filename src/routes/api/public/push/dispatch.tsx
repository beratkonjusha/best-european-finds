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

/**
 * Cron-Endpunkt: prüft gespeicherte Suchen und sendet Push für neue Treffer.
 * Throttle pro Suche, Duplikatschutz über public.push_deliveries.
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

        for (const search of searches ?? []) {
          const throttle = (search.throttle_minutes ?? 60) * 60 * 1000;
          const last = search.last_notified_at ? Date.parse(search.last_notified_at) : 0;
          if (Date.now() - last < throttle) {
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

          // Duplikatschutz: nur Anzeigen, die dieser Nutzer noch nie bekam.
          const { data: seen } = await supabaseAdmin
            .from("push_deliveries")
            .select("listing_id")
            .eq("user_id", search.user_id)
            .in(
              "listing_id",
              matches.map((m) => m.id),
            );
          const seenIds = new Set((seen ?? []).map((s) => s.listing_id));
          const fresh = matches.filter((m) => !seenIds.has(m.id));
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

          for (const sub of subs) {
            const res = await sendWebPush(sub as never, payload);
            if (res.gone) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
            } else if (res.ok) {
              notified += 1;
              await supabaseAdmin
                .from("push_subscriptions")
                .update({ last_success_at: new Date().toISOString() })
                .eq("id", sub.id);
            }
          }

          await supabaseAdmin.from("push_deliveries").upsert(
            fresh.map((m) => ({
              user_id: search.user_id,
              saved_search_id: search.id,
              listing_id: m.id,
            })),
            { onConflict: "user_id,listing_id", ignoreDuplicates: true },
          );

          await supabaseAdmin
            .from("saved_searches")
            .update({
              last_notified_at: new Date().toISOString(),
              last_checked_at: new Date().toISOString(),
            })
            .eq("id", search.id);
        }

        return Response.json({ ok: true, notified, skipped });
      },
    },
  },
});
