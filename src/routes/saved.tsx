import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ListingCard, type FeedListing } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { LIST_SELECT } from "@/lib/reference-queries";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { getSnapshots } from "@/lib/offline";
import { useI18n } from "@/lib/i18n";
import { ListingCardSkeletonGrid } from "@/components/ListingCardSkeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Gespeicherte Anzeigen | EuroDeal" },
      {
        name: "description",
        content:
          "Deine gemerkten Immobilien, Autos und Motorräder – jederzeit, auch offline, mit aktueller Preisbewertung abrufbar.",
      },
      { property: "og:title", content: "Gespeicherte Anzeigen | EuroDeal" },
      {
        property: "og:description",
        content: "Alle gemerkten Angebote aus ganz Europa an einem Ort – auch offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { online } = useNetworkStatus();
  const { ids, isFavorite, toggle } = useFavorites();
  const [snapshots, setSnapshots] = useState<FeedListing[]>([]);

  useEffect(() => {
    setSnapshots(getSnapshots(ids) as unknown as FeedListing[]);
  }, [ids]);

  const q = useQuery({
    queryKey: ["saved-listings", ids],
    enabled: ids.length > 0 && online,
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select(LIST_SELECT).in("id", ids);
      if (error) throw error;
      return (data ?? []) as unknown as FeedListing[];
    },
  });

  // Offline oder Fehler → gespeicherte Offline-Kopien anzeigen.
  const live = q.data ?? [];
  const merged: FeedListing[] = ids
    .map((id) => live.find((l) => l.id === id) ?? snapshots.find((s) => s.id === id))
    .filter(Boolean) as FeedListing[];
  const usingOffline = !online || (q.isError && merged.length > 0);

  return (
    <AppShell showBack>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold">{t("saved.title")}</h1>
        {usingOffline && (
          <p className="mt-2 text-xs text-muted-foreground">{t("offline.badge")}</p>
        )}
        {!user && <p className="mt-2 text-sm text-muted-foreground">{t("saved.needAuth")}</p>}
        {!user && (
          <Button asChild className="mt-4" size="sm">
            <Link to="/auth">{t("nav.signin")}</Link>
          </Button>
        )}

        <div className="mt-8">
          {ids.length === 0 ? (
            <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
              {t("saved.empty")}
            </p>
          ) : q.isPending && merged.length === 0 ? (
            <ListingCardSkeletonGrid count={3} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {merged.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  isFavorite={isFavorite(l.id)}
                  onToggleFavorite={toggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
