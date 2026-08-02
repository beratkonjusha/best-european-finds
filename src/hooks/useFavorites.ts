import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useI18n } from "@/lib/i18n";
import { getSnapshots, removeSnapshot, saveSnapshot, type Snapshot } from "@/lib/offline";

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

function writeLocal(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* quota */
  }
}

export function useFavorites() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [ids, setIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const local = readLocal();
    setIds(local);
    if (!user || typeof navigator !== "undefined" && !navigator.onLine) return;
    const { data, error } = await supabase
      .from("favorites")
      .select("listing_id, snapshot")
      .eq("user_id", user.id);
    if (error || !data) return;
    const remote = data.map((r) => r.listing_id);
    // Merge local anonymous favourites into the account once signed in.
    const missing = local.filter((id) => !remote.includes(id));
    if (missing.length > 0) {
      await supabase
        .from("favorites")
        .upsert(
          missing.map((id) => ({ user_id: user.id, listing_id: id })),
          { onConflict: "user_id,listing_id" },
        );
    }
    for (const row of data) {
      const snap = row.snapshot as unknown as Snapshot | null;
      if (snap && typeof snap === "object" && "id" in snap) saveSnapshot(snap);
    }
    const merged = Array.from(new Set([...remote, ...local]));
    setIds(merged);
    writeLocal(merged);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (listingId: string, snapshot?: Snapshot) => {
      const active = ids.includes(listingId);
      const next = active ? ids.filter((i) => i !== listingId) : [...ids, listingId];
      setIds(next);
      writeLocal(next);

      if (active) {
        removeSnapshot(listingId);
      } else if (snapshot) {
        saveSnapshot(snapshot);
      }

      if (user) {
        if (active) {
          await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("listing_id", listingId);
        } else {
          await supabase.from("favorites").upsert(
            {
              user_id: user.id,
              listing_id: listingId,
              snapshot: (snapshot ?? {}) as never,
            },
            { onConflict: "user_id,listing_id" },
          );
        }
      }
      toast.success(t(active ? "saved.removed" : "saved.added"));
    },
    [ids, user, t],
  );

  return {
    ids,
    toggle,
    refresh,
    isFavorite: (id: string) => ids.includes(id),
    offlineSnapshots: () => getSnapshots(ids),
  };
}
