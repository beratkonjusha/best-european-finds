import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PriceBadge } from "@/components/PriceBadge";
import { getListingDetail } from "@/lib/listings.functions";
import { useI18n } from "@/lib/i18n";
import { useFavorites } from "@/hooks/useFavorites";
import { useListingTranslation } from "@/hooks/useListingTranslation";
import {
  formatAttribute,
  formatDate,
  formatPrice,
  orderedAttributes,
  type Attributes,
  type Category,
  type PriceBand,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params }) => {
    const result = await getListingDetail({ data: { id: params.id } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "EuroDeal" }, { name: "robots", content: "noindex" }],
      };
    }
    const l = loaderData.listing;
    const title = `${l.title} – ${Math.round(l.price_eur).toLocaleString("de-DE")} € | EuroDeal`;
    const description = (l.description ?? l.title).slice(0, 155);
    const images = Array.isArray(l.images) ? (l.images as string[]) : [];
    const meta: { title?: string; name?: string; property?: string; content?: string }[] = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (images[0]?.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: images[0] },
        { name: "twitter:image", content: images[0] },
      );
    }
    return { meta };
  },
  component: ListingDetail,
});

function ListingDetail() {
  const { listing, stats } = Route.useLoaderData();
  const { t, lang } = useI18n();
  const { isFavorite, toggle } = useFavorites();
  const [active, setActive] = useState(0);
  const tr = useListingTranslation(listing.id, listing.source_lang, {
    title: listing.title,
    description: listing.description,
  });

  const images = Array.isArray(listing.images) ? (listing.images as string[]) : [];
  const attrs = (listing.attributes ?? {}) as Attributes;
  const keys = orderedAttributes(listing.category as Category, attrs);
  const fav = isFavorite(listing.id);

  const diffPct =
    stats && stats.median_eur > 0
      ? Math.round(((listing.price_eur - stats.median_eur) / stats.median_eur) * 100)
      : null;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success(t("detail.copied"));
  };

  return (
    <AppShell showBack>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
            <div className="aspect-[4/3] bg-muted">
              {images[active] ? (
                <img
                  src={images[active]}
                  alt={listing.title}
                  className="size-full object-cover"
                />
              ) : (
                <div className="hero-gradient size-full" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      "size-16 shrink-0 overflow-hidden rounded-lg border-2",
                      i === active ? "border-primary" : "border-transparent opacity-70",
                    )}
                  >
                    <img src={src} alt="" className="size-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {tr.description && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-semibold">{t("detail.description")}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {tr.description}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <PriceBadge
              band={listing.price_band as PriceBand | null}
              score={listing.price_score}
              showDelta
            />
            <p className="mt-3 font-display text-3xl font-bold">
              {formatPrice(listing.price_eur, lang)}
            </p>
            <h1 className="mt-2 text-base font-medium leading-snug">{tr.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {listing.cities?.name ? `${listing.cities.name}, ` : ""}
              {listing.countries
                ? lang === "de"
                  ? listing.countries.name_de
                  : lang === "sq"
                    ? listing.countries.name_sq
                    : listing.countries.name_en
                : listing.country_code}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="flex-1 gap-2">
                <a href={listing.url} target="_blank" rel="noopener noreferrer nofollow">
                  <ExternalLink className="size-4" />
                  {t("detail.original")}
                </a>
              </Button>
              <Button variant="outline" size="icon" onClick={() => toggle(listing.id, listing as never)}>
                <Heart className={cn("size-4", fav && "fill-destructive text-destructive")} />
                <span className="sr-only">{t(fav ? "detail.saved" : "detail.save")}</span>
              </Button>
              <Button variant="outline" size="icon" onClick={share}>
                <Share2 className="size-4" />
                <span className="sr-only">{t("detail.share")}</span>
              </Button>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4 text-sm">
              <dt className="text-muted-foreground">{t("detail.source")}</dt>
              <dd className="text-right font-medium">{listing.sources?.name ?? "—"}</dd>
              <dt className="text-muted-foreground">{t("detail.posted")}</dt>
              <dd className="text-right font-medium">{formatDate(listing.posted_at, lang)}</dd>
            </dl>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="font-display text-base font-semibold">{t("detail.marketCheck")}</h2>
            {stats && stats.n >= 5 ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("band.explain", {
                    median: formatPrice(stats.median_eur, lang),
                    n: stats.n,
                    diff: `${Math.abs(diffPct ?? 0)}%`,
                    dir: t((diffPct ?? 0) >= 0 ? "band.above" : "band.below"),
                  })}
                </p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(4, ((listing.price_score ?? 1) / 2) * 100))}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{formatPrice(stats.p25, lang)}</span>
                  <span>{formatPrice(stats.median_eur, lang)}</span>
                  <span>{formatPrice(stats.p75, lang)}</span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t("band.noData")}</p>
            )}
            <Link
              to="/info"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t("band.how")}
            </Link>
          </div>

          {keys.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <h2 className="font-display text-base font-semibold">{t("detail.details")}</h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {keys.map((k) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{t(`attr.${k}`) ?? k}</dt>
                    <dd className="text-right font-medium">
                      {formatAttribute(k, attrs[k] as string | number, lang)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
