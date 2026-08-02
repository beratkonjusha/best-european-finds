import type { FeedListing } from "@/components/ListingCard";

const SNAP_KEY = "eurodeal.snapshots";

export type Snapshot = FeedListing & Record<string, unknown>;

function readAll(): Record<string, Snapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SNAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Snapshot>) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, Snapshot>) {
  try {
    window.localStorage.setItem(SNAP_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function getSnapshot(id: string): Snapshot | null {
  return readAll()[id] ?? null;
}

export function getSnapshots(ids: string[]): Snapshot[] {
  const all = readAll();
  return ids.map((id) => all[id]).filter(Boolean) as Snapshot[];
}

export function saveSnapshot(listing: Snapshot) {
  const all = readAll();
  all[listing.id] = listing;
  writeAll(all);
  void precacheImages(listing);
}

export function removeSnapshot(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
}

/** Store listing images in the SW cache so saved ads work fully offline. */
export async function precacheImages(listing: Snapshot) {
  if (typeof caches === "undefined") return;
  const images = Array.isArray(listing.images) ? (listing.images as string[]) : [];
  if (images.length === 0) return;
  try {
    const cache = await caches.open("listing-images");
    await Promise.allSettled(
      images.slice(0, 12).map(async (src) => {
        if (typeof src !== "string" || !src.startsWith("http")) return;
        const hit = await cache.match(src);
        if (hit) return;
        const res = await fetch(src, { mode: "no-cors" });
        await cache.put(src, res);
      }),
    );
  } catch {
    /* offline or blocked */
  }
}
