import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const LIST_SELECT =
  "id,title,price_eur,category,country_code,city_id,lat,lng,images,attributes,price_band,price_score,posted_at,source_id,cities(name),countries(name_de,name_en,name_sq),sources(name)";

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

export function useCities(countryCode: string) {
  return useQuery({
    queryKey: ["cities", countryCode],
    enabled: Boolean(countryCode),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id,name,lat,lng")
        .eq("country_code", countryCode)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources")
        .select("id,name,slug,categories,country_codes")
        .eq("enabled", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}
