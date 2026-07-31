import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useI18n } from "@/lib/i18n";

const KEY = "eurodeal.favorites";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [ids, setIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(readLocal());
      return;
    }
    const { data } = await supabase.from("favorites").select("listing_id").eq("user_id", user.id);
    setIds((data ?? []).map((r) => r.listing_id));
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (listingId: string) => {
      const active = ids.includes(listingId);
      const next = active ? ids.filter((i) => i !== listingId) : [...ids, listingId];
      setIds(next);

      if (user) {
        if (active) {
          await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("listing_id", listingId);
        } else {
          await supabase.from("favorites").insert({ user_id: user.id, listing_id: listingId });
        }
      } else {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      }
      toast.success(t(active ? "saved.removed" : "saved.added"));
    },
    [ids, user, t],
  );

  return { ids, toggle, refresh, isFavorite: (id: string) => ids.includes(id) };
}
