import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const LIST_SELECT =
  "id,title,price_eur,category,country_code,city_id,lat,lng,images,attributes,price_band,price_score,posted_at,source_id,source_lang,cities(name),countries(name_de,name_en,name_sq),sources(name)";

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("code,name_de,name_en,name_sq,region")
        .order("name_en");
      if (error) throw error;
      return data;
    },
  });
}

/** Bundesländer / Regionen / Republiken eines Landes. */
export function useRegions(countryCode: string) {
  return useQuery({
    queryKey: ["regions", countryCode],
    enabled: Boolean(countryCode),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("id,code,name")
        .eq("country_code", countryCode)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export type CityRow = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  postal_code: string | null;
  region_id: string | null;
};

/**
 * Städte-Suche nach Name ODER Postleitzahl.
 * Ohne Suchbegriff werden die größten Städte des Landes/der Region geliefert.
 */
export function useCitySearch(countryCode: string, regionId: string, term: string) {
  const q = term.trim();
  return useQuery({
    queryKey: ["city-search", countryCode, regionId, q],
    enabled: Boolean(countryCode),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from("cities")
        .select("id,name,lat,lng,postal_code,region_id")
        .eq("country_code", countryCode);

      if (regionId) query = query.eq("region_id", regionId);
      if (q) {
        const safe = q.replace(/[%,()]/g, " ");
        query = query.or(`name.ilike.%${safe}%,postal_code.ilike.${safe}%`);
      }

      const { data, error } = await query
        .order("population", { ascending: false, nullsFirst: false })
        .order("name")
        .limit(60);
      if (error) throw error;
      return (data ?? []) as CityRow[];
    },
  });
}

export function useCity(cityId: string) {
  return useQuery({
    queryKey: ["city", cityId],
    enabled: Boolean(cityId),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id,name,lat,lng,postal_code,region_id")
        .eq("id", cityId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as CityRow | null;
    },
  });
}

export function useCities(countryCode: string) {
  return useCitySearch(countryCode, "", "");
}

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources")
        .select("id,name,slug,categories,country_codes,health,enabled")
        .eq("enabled", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}
