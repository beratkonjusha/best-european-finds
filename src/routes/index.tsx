import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SlidersHorizontal, Search, Radio, BellPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ListingCard, type FeedListing } from "@/components/ListingCard";
import { ListingCardSkeletonGrid } from "@/components/ListingCardSkeleton";
import { DEFAULT_FILTERS, FiltersPanel, type Filters } from "@/components/FiltersPanel";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useCity, LIST_SELECT } from "@/lib/reference-queries";
import { boundingBox, relevanceScore, SORTS, DEFAULT_SORT, type SortKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { startLiveIngest } from "@/lib/live-ingest.functions";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EuroDeal – Immobilien & Fahrzeuge in Europa mit Preis-Check" },
      {
        name: "description",
        content:
          "Immobilien, Autos und Motorräder aus ganz Europa und dem Balkan an einem Ort – jede Anzeige mit transparenter Preisbewertung gegen den Marktmedian.",
      },
      { property: "og:title", content: "EuroDeal – Europas Anzeigen mit echtem Preis-Check" },
      {
        property: "og:description",
        content:
          "Suche Immobilien, Autos und Motorräder in ganz Europa und sieh sofort, ob der Preis günstig, marktüblich oder überteuert ist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedPage,
});

const PAGE_SIZE = 24;

function FeedPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [queryInput, setQueryInput] = useState("");
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [ingesting, setIngesting] = useState(false);
  const ingestSequence = useRef(0);
  const { isFavorite, toggle } = useFavorites();
  const requestIngest = useServerFn(startLiveIngest);

  const selectedCity = useCity(filters.cityId).data ?? null;

  const feed = useInfiniteQuery({
    queryKey: ["listings", filters, sort, selectedCity?.id ?? null],
    initialPageParam: 0,
    getNextPageParam: (last: FeedListing[], pages) =>
      last.length < PAGE_SIZE ? undefined : pages.length,
    queryFn: async ({ pageParam }) => {
      let q = supabase.from("listings").select(LIST_SELECT).eq("active", true);

      if (filters.q.trim()) {
        const term = filters.q.trim().replace(/[%,()]/g, " ");
        q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      if (filters.category !== "all") q = q.eq("category", filters.category);
      if (filters.country) q = q.eq("country_code", filters.country);
      if (filters.regionId) q = q.eq("region_id", filters.regionId);
      if (filters.sourceIds.length) q = q.in("source_id", filters.sourceIds);
      if (filters.priceMin) q = q.gte("price_eur", Number(filters.priceMin));
      if (filters.priceMax) q = q.lte("price_eur", Number(filters.priceMax));

      if (selectedCity && filters.radius > 0) {
        const box = boundingBox(selectedCity.lat, selectedCity.lng, filters.radius);
        q = q
          .gte("lat", box.minLat)
          .lte("lat", box.maxLat)
          .gte("lng", box.minLng)
          .lte("lng", box.maxLng);
      } else if (filters.cityId) {
        q = q.eq("city_id", filters.cityId);
      }

      if (sort === "price_desc") q = q.order("price_eur", { ascending: false });
      else if (sort === "newest") q = q.order("posted_at", { ascending: false });
      else if (sort === "best_deal")
        q = q.order("price_score", { ascending: true, nullsFirst: false });
      else if (sort === "relevance") q = q.order("posted_at", { ascending: false });
      else q = q.order("price_eur", { ascending: true });

      const from = (pageParam as number) * PAGE_SIZE;
      const { data, error } = await q.range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as unknown as FeedListing[];
    },
  });

  const listings = useMemo(() => {
    const all = (feed.data?.pages ?? []).flat();
    if (sort !== "relevance") return all;
    return [...all].sort((a, b) => relevanceScore(b, filters.q) - relevanceScore(a, filters.q));
  }, [feed.data, sort, filters.q]);

  // Echtzeit-Hintergrundsuche: neue Anzeigen sofort melden
  useEffect(() => {
    setLiveCount(0);
    const channel = supabase
      .channel("feed-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "listings" },
        (payload) => {
          const row = payload.new as { category?: string; country_code?: string };
          if (filters.category !== "all" && row.category !== filters.category) return;
          if (filters.country && row.country_code !== filters.country) return;
          setLiveCount((n) => n + 1);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [filters.category, filters.country, filters.q, filters.cityId, sort]);

  const runLiveSearch = useCallback(
    async (next: Filters, quiet = false) => {
      const sequence = ++ingestSequence.current;
      setFilters(next);
      setIngesting(true);
      try {
        const result = await requestIngest({ data: next });
        if (sequence !== ingestSequence.current) return;
        if (!quiet) {
          if (result.accepted) toast.success(t("feed.ingestAccepted"));
          else if (result.message === "not_configured") toast.info(t("feed.ingestNotConfigured"));
          else toast.error(t("feed.ingestUnavailable"));
        }

        // Der externe Worker schreibt über /api/public/ingest/run. Währenddessen
        // mehrmals neu laden, damit Treffer auch ohne Realtime-Publikation erscheinen.
        for (const delay of [0, 1500, 3000, 5000]) {
          if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
          if (sequence !== ingestSequence.current) return;
          await feed.refetch();
        }
      } catch {
        if (!quiet) toast.error(t("feed.ingestUnavailable"));
      } finally {
        if (sequence === ingestSequence.current) setIngesting(false);
      }
    },
    [requestIngest, t, feed],
  );

  const applySearch = () => {
    void runLiveSearch({ ...filters, q: queryInput.trim() });
  };

  // Texteingaben starten nach kurzer Tipp-Pause automatisch eine Live-Suche.
  useEffect(() => {
    const term = queryInput.trim();
    if (!term || term === filters.q) return;
    const timer = window.setTimeout(() => {
      void runLiveSearch({ ...filters, q: term }, true);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  const saveSearch = async () => {
    if (!user) {
      toast.error(t("saved.needAuth"));
      return;
    }
    const label = filters.q.trim() || t(`cat.${filters.category}`);
    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      label,
      query: JSON.parse(JSON.stringify(filters)),
      notify: true,
    });
    if (error) toast.error(error.message);
    else toast.success(t("search.savedOk"));
  };

  return (
    <AppShell>
      <section className="hero-gradient">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight text-primary-foreground sm:text-4xl">
            {t("app.tagline")}
          </h1>
          <form
            className="mt-7 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
          >
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={t("search.placeholder")}
                className="h-12 border-transparent bg-card pl-9 text-base shadow-elev-2"
                aria-label={t("search.button")}
              />
            </div>
            <Button type="submit" size="lg" variant="secondary" className="h-12" disabled={ingesting}>
              {ingesting ? t("search.running") : t("search.button")}
            </Button>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button type="button" size="lg" variant="secondary" className="h-12 gap-2">
                  <SlidersHorizontal className="size-4" />
                  {t("filters.title")}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>{t("filters.title")}</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">
                  <FiltersPanel
                    value={filters}
                    onChange={setFilters}
                    onReset={() => {
                      setFilters(DEFAULT_FILTERS);
                      setQueryInput("");
                    }}
                  />
                   <Button
                     className="mt-6 w-full"
                     onClick={() => {
                       setSheetOpen(false);
                       void runLiveSearch({ ...filters, q: queryInput.trim() });
                     }}
                     disabled={ingesting}
                   >
                    {t("filters.apply")}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate text-sm text-muted-foreground">
              {ingesting
                ? t("feed.ingesting")
                : feed.isPending
                  ? t("results.loading")
                  : t("results.count", { n: listings.length })}
            </p>
            <span className="flex items-center gap-1.5 text-xs text-price-great">
              <Radio className="size-3 animate-pulse" />
              {t("feed.live")}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={saveSearch}>
              <BellPlus className="size-4" />
              <span className="hidden sm:inline">{t("search.save")}</span>
            </Button>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-44 sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`sort.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {liveCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setLiveCount(0);
              void feed.refetch();
            }}
            className="mb-5 w-full rounded-xl border border-price-great/30 bg-price-great/10 px-4 py-2.5 text-sm font-medium text-price-great shadow-elev-1 transition hover:bg-price-great/15"
          >
            {t("feed.newResults", { n: liveCount })} · {t("feed.showNew")}
          </button>
        )}

        {feed.isPending ? (
          <ListingCardSkeletonGrid count={6} />
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center shadow-elev-1">
            <p className="text-sm text-muted-foreground">{t("results.none")}</p>
            <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
              {t("results.noneHint")}
            </p>
          </div>

        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  isFavorite={isFavorite(l.id)}
                  onToggleFavorite={toggle}
                />
              ))}
            </div>
            {feed.hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                >
                  {feed.isFetchingNextPage ? t("results.loading") : t("results.more")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}
