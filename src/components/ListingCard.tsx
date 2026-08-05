import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { Heart, MapPin } from "lucide-react";
import { PriceBadge } from "./PriceBadge";
import { useI18n } from "@/lib/i18n";
import {
  formatAttribute,
  formatPrice,
  orderedAttributes,
  type Attributes,
  type Category,
  type PriceBand,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useListingTranslation } from "@/hooks/useListingTranslation";

export type FeedListing = {
  id: string;
  title: string;
  price_eur: number;
  category: Category;
  country_code: string;
  images: unknown;
  attributes: unknown;
  price_band: PriceBand | null;
  price_score: number | null;
  posted_at: string;
  source_lang?: string | null;
  cities?: { name: string } | null;
  countries?: { name_de: string; name_en: string; name_sq: string } | null;
  sources?: { name: string } | null;
};

export function ListingCard({
  listing,
  isFavorite,
  onToggleFavorite,
}: {
  listing: FeedListing;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, snapshot?: FeedListing) => void;
}) {
  const { t, lang } = useI18n();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const images = Array.isArray(listing.images) ? (listing.images as string[]) : [];
  const cover = typeof images[0] === "string" ? images[0] : null;
  const attrs = (listing.attributes ?? {}) as Attributes;
  const attrKeys = orderedAttributes(listing.category, attrs).slice(0, 3);
  const place = listing.cities?.name ?? listing.country_code;
  const translation = useListingTranslation(listing.id, listing.source_lang, {
    title: listing.title,
    description: null,
  });

  return (
    <article className="group relative overflow-hidden rounded-2xl border bg-card shadow-card transition-[transform,box-shadow] duration-300 will-change-transform hover:-translate-y-1 hover:shadow-float motion-reduce:transform-none">
      <Link
        to="/listing/$id"
        params={{ id: listing.id }}
        className="block focus-visible:outline-none"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {cover && !imgFailed ? (
            <img
              src={cover}
              alt={translation.title}
              loading="lazy"
              decoding="async"
              width={800}
              height={600}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgFailed(true)}
              className={cn(
                "absolute inset-0 size-full object-cover transition-[transform,opacity] duration-500 group-hover:scale-[1.04]",
                imgLoaded ? "opacity-100" : "opacity-0",
              )}
            />
          ) : (
            <div className="hero-gradient absolute inset-0 size-full" />
          )}
          {cover && !imgFailed && !imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
          )}
          <div className="absolute left-3 top-3">
            <PriceBadge band={listing.price_band} score={listing.price_score} showDelta />
          </div>
        </div>


        <div className="space-y-2 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-lg font-bold tracking-tight">
              {formatPrice(listing.price_eur, lang)}
            </p>
            <span className="text-xs text-muted-foreground">{t(`cat.${listing.category}`)}</span>
          </div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{translation.title}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {place}
              {listing.sources?.name ? ` · ${listing.sources.name}` : ""}
            </span>
          </p>
          {attrKeys.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {attrKeys.map((k) => (
                <li
                  key={k}
                  className="rounded-md bg-surface px-2 py-0.5 text-[11px] text-surface-foreground"
                >
                  {formatAttribute(k, attrs[k] as string | number, lang)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          aria-label={t("detail.save")}
          onClick={() => onToggleFavorite(listing.id, listing)}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 text-foreground shadow-card backdrop-blur transition-colors hover:bg-card"
        >
          <Heart className={cn("size-4", isFavorite && "fill-destructive text-destructive")} />
        </button>
      )}
    </article>
  );
}
