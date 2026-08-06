// Interner Live-Adapter für kleinanzeigen.de.
// Es werden ausschließlich öffentliche Suchergebnisseiten abgerufen, die laut
// robots.txt der Quelle erlaubt sind (/s-*). Keine Detailseiten (/s-anzeige/),
// keine Nutzerdaten, moderate Frequenz, klar identifizierender User-Agent.

import type { NormalizedListing } from "./store.server";

export const KLEINANZEIGEN_SLUG = "kleinanzeigen";

const UA = "Mozilla/5.0 (compatible; EuroDealsBot/1.0; +https://lovable.dev)";
const BASE = "https://www.kleinanzeigen.de";

type Category = "real_estate" | "apartments" | "cars" | "motorcycles";

const CATEGORY_PATHS: Record<Category, { seo: string; code: string; lang: string }> = {
  cars: { seo: "autos", code: "k0c216", lang: "de" },
  motorcycles: { seo: "motorraeder-roller", code: "k0c305", lang: "de" },
  real_estate: { seo: "haus-kaufen", code: "k0c208", lang: "de" },
  apartments: { seo: "wohnung-mieten", code: "k0c203", lang: "de" },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildSearchUrl(params: {
  category: Category;
  q?: string;
  cityName?: string | null;
}) {
  const cat = CATEGORY_PATHS[params.category];
  const segments = [`s-${cat.seo}`];
  if (params.cityName) {
    const city = slugify(params.cityName);
    if (city) segments.push(city);
  }
  if (params.q) {
    const keyword = slugify(params.q);
    if (keyword) segments.push(keyword);
  }
  segments.push(cat.code);
  return `${BASE}/${segments.join("/")}`;
}

function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&euro;/g, "€")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&")
    .trim();
}


function parsePrice(raw: string): number | null {
  const match = raw.replace(/\s/g, "").match(/([\d.]+)(?:,(\d{2}))?\s*€/);
  if (!match) return null;
  const whole = Number(match[1]!.replace(/\./g, ""));
  if (!Number.isFinite(whole)) return null;
  const cents = match[2] ? Number(match[2]) / 100 : 0;
  return whole + cents;
}

export function parseListings(html: string, category: Category): NormalizedListing[] {
  const blocks = html.split('<article class="aditem"').slice(1);
  const out: NormalizedListing[] = [];

  for (const block of blocks) {
    const id = block.match(/data-adid="(\d+)"/)?.[1];
    const href = block.match(/data-href="([^"]+)"/)?.[1];
    if (!id || !href) continue;

    const title = decodeEntities(
      block.match(/<a class="ellipsis"[^>]*>([\s\S]*?)<\/a>/)?.[1]?.replace(/<[^>]+>/g, "") ?? "",
    );
    if (!title) continue;

    const priceRaw = block.match(/--price-shipping--price"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "";
    const price = parsePrice(decodeEntities(priceRaw.replace(/<[^>]+>/g, "")));
    if (price === null || price <= 0) continue;

    const description = decodeEntities(
      block.match(/aditem-main--middle--description"[^>]*>([\s\S]*?)<\/p>/)?.[1]?.replace(/<[^>]+>/g, "") ?? "",
    );

    const image =
      block.match(/"contentUrl":"([^"]+)"/)?.[1] ??
      block.match(/<img[^>]+src="(https:\/\/img\.kleinanzeigen\.de[^"]+)"/)?.[1] ??
      null;

    const locationRaw = decodeEntities(
      block.match(/icon-pin-gray"[^>]*><\/i>([\s\S]*?)<\//)?.[1]?.replace(/<[^>]+>/g, "") ?? "",
    );
    const postal = locationRaw.match(/\b(\d{5})\b/)?.[1] ?? null;
    const cityName = locationRaw.replace(/\b\d{5}\b/, "").replace(/\s+-\s+/, " ").trim() || null;

    const tags = [...block.matchAll(/class="simpletag"[^>]*>([\s\S]*?)<\/span>/g)]
      .map((m) => decodeEntities(m[1]!.replace(/<[^>]+>/g, "")))
      .filter(Boolean);

    // Kanonische Attributschlüssel (siehe src/lib/format.ts) für die Anzeige.
    const attributes: Record<string, unknown> = {};
    for (const tag of tags) {
      const km = tag.match(/^([\d.]+)\s*km$/);
      if (km) attributes["km"] = Number(km[1]!.replace(/\./g, ""));
      const year = tag.match(/EZ\s*(?:\d{1,2}\/)?(\d{4})/);
      if (year) attributes["year"] = Number(year[1]);
      const sqm = tag.match(/^([\d.,]+)\s*m²$/);
      if (sqm) attributes["sqm"] = Number(sqm[1]!.replace(/\./g, "").replace(",", "."));
      const rooms = tag.match(/^([\d,.]+)\s*Zimmer$/);
      if (rooms) attributes["rooms"] = Number(rooms[1]!.replace(",", "."));
      const ccm = tag.match(/^([\d.]+)\s*(?:ccm|cm³)$/);
      if (ccm) attributes["ccm"] = Number(ccm[1]!.replace(/\./g, ""));
    }
    if (cityName) attributes["city_label"] = cityName;


    out.push({
      external_id: id,
      url: href.startsWith("http") ? href : `${BASE}${href}`,
      category,
      title,
      description: description || null,
      price_eur: price,
      currency: "EUR",
      country_code: "DE",
      city_name: cityName,
      postal_code: postal,
      images: image ? [image.replace(/rule=\$_\d+\.AUTO/, "rule=$_59.AUTO")] : [],
      attributes,
      source_lang: CATEGORY_PATHS[category].lang,
    });
  }

  return out;
}

export async function fetchKleinanzeigen(params: {
  category: Category;
  q?: string;
  cityName?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
}): Promise<{ listings: NormalizedListing[]; status: "ok" | "blocked" | "down"; error?: string }> {
  const url = buildSearchUrl(params);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 403 || response.status === 429) {
      return { listings: [], status: "blocked", error: `HTTP ${response.status}` };
    }
    if (!response.ok) {
      return { listings: [], status: "down", error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    let listings = parseListings(html, params.category);

    if (params.priceMin != null) listings = listings.filter((l) => l.price_eur >= params.priceMin!);
    if (params.priceMax != null) listings = listings.filter((l) => l.price_eur <= params.priceMax!);

    if (listings.length === 0) {
      return { listings, status: html.includes("captcha") ? "blocked" : "ok" };
    }
    return { listings, status: "ok" };
  } catch (err) {
    return {
      listings: [],
      status: "down",
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }
}
