import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Read-only publishable client for SSR/public data (no session). */
export function createPublicSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const LISTING_SELECT =
  "id,title,description,price_eur,currency,category,country_code,city_id,lat,lng,images,attributes,url,posted_at,price_band,price_score,segment_key,source_lang,source_id,sources(name,base_url),cities(name),countries(name_de,name_en,name_sq)";

export async function fetchListingDetail(id: string) {
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  let stats: {
    median_eur: number;
    n: number;
    p25: number;
    p75: number;
  } | null = null;

  if (data.segment_key) {
    const { data: s } = await supabase
      .from("price_stats")
      .select("median_eur,n,p25,p75")
      .eq("segment_key", data.segment_key)
      .eq("category", data.category)
      .maybeSingle();
    stats = s ?? null;
  }

  return { listing: data, stats };
}
