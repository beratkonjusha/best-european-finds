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
  const images = Array.isArray(listing.images) ? (listing.images as string[]) : [];
  const attrs = (listing.attributes ?? {}) as Attributes;
  const attrKeys = orderedAttributes(listing.category, attrs).slice(0, 3);
  const place = listing.cities?.name ?? listing.country_code;

  return (
    <article className="group relative overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-float">
      <Link
        to="/listing/$id"
        params={{ id: listing.id }}
        className="block focus-visible:outline-none"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {images[0] ? (
            <img
              src={images[0]}
              alt={listing.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="hero-gradient size-full" />
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
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{listing.title}</h3>
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
