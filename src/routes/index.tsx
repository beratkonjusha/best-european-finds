import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ListingCard, type FeedListing } from "@/components/ListingCard";
import { DEFAULT_FILTERS, FiltersPanel, type Filters } from "@/components/FiltersPanel";
import { useI18n } from "@/lib/i18n";
import { useFavorites } from "@/hooks/useFavorites";
import { useCities } from "@/lib/reference-queries";
import { LIST_SELECT } from "@/lib/reference-queries";
import { boundingBox, SORTS, type SortKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [queryInput, setQueryInput] = useState("");
  const [sort, setSort] = useState<SortKey>("best_deal");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isFavorite, toggle } = useFavorites();

  const cities = useCities(filters.country);
  const selectedCity = useMemo(
    () => (cities.data ?? []).find((c) => c.id === filters.cityId) ?? null,
    [cities.data, filters.cityId],
  );

  const feed = useInfiniteQuery({
    queryKey: ["listings", filters, sort, selectedCity?.id ?? null],
    initialPageParam: 0,
    getNextPageParam: (last: FeedListing[], pages) =>
      last.length < PAGE_SIZE ? undefined : pages.length,
    queryFn: async ({ pageParam }) => {
      let q = supabase.from("listings").select(LIST_SELECT).eq("active", true);

      if (filters.q.trim()) {
        const term = filters.q.trim().replace(/[%,]/g, " ");
        q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      if (filters.category !== "all") q = q.eq("category", filters.category);
      if (filters.country) q = q.eq("country_code", filters.country);
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

      if (sort === "price_asc") q = q.order("price_eur", { ascending: true });
      else if (sort === "price_desc") q = q.order("price_eur", { ascending: false });
      else if (sort === "newest") q = q.order("posted_at", { ascending: false });
      else q = q.order("price_score", { ascending: true, nullsFirst: false });

      const from = (pageParam as number) * PAGE_SIZE;
      const { data, error } = await q.range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as unknown as FeedListing[];
    },
  });

  const listings = (feed.data?.pages ?? []).flat();

  const applySearch = () => setFilters((f) => ({ ...f, q: queryInput }));

  return (
    <AppShell>
      <section className="hero-gradient">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight text-primary-foreground sm:text-4xl">
            {t("app.tagline")}
          </h1>
          <form
            className="mt-7 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={t("search.placeholder")}
                className="h-12 border-transparent bg-card pl-9 text-base"
                aria-label={t("search.button")}
              />
            </div>
            <Button type="submit" size="lg" variant="secondary" className="h-12">
              {t("search.button")}
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
                  <Button className="mt-6 w-full" onClick={() => setSheetOpen(false)}>
                    {t("filters.apply")}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {feed.isPending ? t("results.loading") : t("results.count", { n: listings.length })}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("sort.label")}</span>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-52">
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

        {feed.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
            {t("results.none")}
          </p>
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
