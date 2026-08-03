import { supabase } from "@/integrations/supabase/client";

/** Öffentlicher VAPID-Schlüssel (bewusst öffentlich, gehört zum Push-Protokoll). */
export const VAPID_PUBLIC_KEY =
  "BJImeWduh6Nr3nbTSqSheCpH-6LrZabBgOmzTrDIGEHB6-MkeS1eEiEzVSdPJvGGn8vPQ0A9hMTYtDJWxbdd9qM";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufferToBase64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export type SubscribeResult =
  | { status: "ok"; endpoint: string; p256dh: string; auth: string }
  | { status: "denied" | "unsupported" | "error" };

/** Opt-in: fragt Erlaubnis an und erzeugt eine Browser-Subscription. */
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!pushSupported()) return { status: "unsupported" };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  try {
    const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.ready);
    if (!reg) return { status: "unsupported" };
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      }));
    return {
      status: "ok",
      endpoint: sub.endpoint,
      p256dh: bufferToBase64Url(sub.getKey("p256dh")),
      auth: bufferToBase64Url(sub.getKey("auth")),
    };
  } catch {
    return { status: "error" };
  }
}

/** Opt-out: hebt die Browser-Subscription auf. */
export async function unsubscribeFromPush(): Promise<string | null> {
  const sub = await currentSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}

/** Merkt lokal, ob der Nutzer Push in dieser App eingeschaltet hat. */
export async function pushEnabledForUser(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_settings")
    .select("push_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data?.push_enabled);
}
