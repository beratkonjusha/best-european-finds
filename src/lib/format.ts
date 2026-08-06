import type { Lang } from "./i18n";

export const CATEGORIES = ["real_estate", "apartments", "cars", "motorcycles"] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRICE_BANDS = ["great", "good", "fair", "high", "check"] as const;
export type PriceBand = (typeof PRICE_BANDS)[number];

export const SORTS = ["price_asc", "best_deal", "relevance", "newest", "price_desc"] as const;
export type SortKey = (typeof SORTS)[number];
export const DEFAULT_SORT: SortKey = "price_asc";


export const RADIUS_OPTIONS = [0, 10, 25, 50, 100, 250] as const;

export function formatPrice(value: number, lang: Lang): string {
  const locale = lang === "de" ? "de-DE" : lang === "sq" ? "sq-AL" : "en-GB";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, lang: Lang): string {
  const locale = lang === "de" ? "de-DE" : lang === "sq" ? "sq-AL" : "en-GB";
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(iso: string, lang: Lang): string {
  const locale = lang === "de" ? "de-DE" : lang === "sq" ? "sq-AL" : "en-GB";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

/** Bounding box around a point for a given radius in km. */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const dLat = radiusKm / 111.32;
  const dLng = radiusKm / (111.32 * Math.max(0.15, Math.cos((lat * Math.PI) / 180)));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

export function countryName(
  c: { name_de: string; name_en: string; name_sq: string },
  lang: Lang,
): string {
  return lang === "de" ? c.name_de : lang === "sq" ? c.name_sq : c.name_en;
}

const ATTR_ORDER: Record<Category, string[]> = {
  cars: ["year", "km", "fuel", "gearbox", "power_hp"],
  motorcycles: ["year", "km", "ccm", "power_hp"],
  apartments: ["sqm", "rooms", "floor", "year"],
  real_estate: ["sqm", "rooms", "plot_sqm", "year"],
};

export type Attributes = Record<string, string | number | null | undefined>;

const HIDDEN_ATTRS = new Set(["city_label", "tags"]);

export function orderedAttributes(category: Category, attrs: Attributes) {
  const usable = (k: string) => {
    const v = attrs[k];
    return (
      !HIDDEN_ATTRS.has(k) &&
      v !== null &&
      v !== undefined &&
      (typeof v === "string" || typeof v === "number")
    );
  };
  const keys = ATTR_ORDER[category] ?? [];
  const known = keys.filter(usable);
  const rest = Object.keys(attrs).filter((k) => !keys.includes(k) && usable(k));
  return [...known, ...rest];
}


export function formatAttribute(key: string, value: string | number, lang: Lang): string {
  if (typeof value === "number") {
    if (key === "km") return `${formatNumber(value, lang)} km`;
    if (key === "sqm" || key === "plot_sqm") return `${formatNumber(value, lang)} m²`;
    if (key === "power_hp") return `${formatNumber(value, lang)} PS`;
    if (key === "ccm") return `${formatNumber(value, lang)} ccm`;
    if (key === "year") return String(value);
    return formatNumber(value, lang);
  }
  return String(value);
}

/**
 * Relevanz-Score für die clientseitige Nachsortierung:
 * Texttreffer + Aktualität + Preisbewertung.
 */
export function relevanceScore(
  l: { title: string; posted_at: string; price_score: number | null; price_band: string | null },
  term: string,
): number {
  let score = 0;
  const q = term.trim().toLowerCase();
  if (q) {
    const title = l.title.toLowerCase();
    if (title === q) score += 60;
    else if (title.startsWith(q)) score += 40;
    else if (title.includes(q)) score += 25;
    const words = q.split(/\s+/).filter(Boolean);
    score += words.filter((w) => title.includes(w)).length * 6;
  }
  const ageDays = (Date.now() - new Date(l.posted_at).getTime()) / 86_400_000;
  score += Math.max(0, 30 - ageDays);
  if (l.price_score != null) score += Math.max(-15, Math.min(25, -l.price_score * 10));
  if (l.price_band === "great") score += 12;
  else if (l.price_band === "good") score += 6;
  return score;
}
