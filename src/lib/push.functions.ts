import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(10).max(255),
  auth: z.string().min(5).max(255),
  userAgent: z.string().max(400).optional(),
});

/** Öffentlicher VAPID-Schlüssel für die Browser-Subscription. */
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => ({
  key: process.env["VAPID_PUBLIC_KEY"] ?? "",
}));

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => subscriptionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        keys: { p256dh: data.p256dh, auth: data.auth },
        user_agent: data.userAgent ?? null,
      },
      { onConflict: "user_id,endpoint" },
    );
    if (error) throw new Error(error.message);
    await context.supabase
      .from("user_settings")
      .upsert({ user_id: context.userId, push_enabled: true }, { onConflict: "user_id" });
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ endpoint: z.string().max(2000) }).parse(data))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", context.userId)
      .eq("endpoint", data.endpoint);
    const { count } = await context.supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId);
    if (!count) {
      await context.supabase
        .from("user_settings")
        .upsert({ user_id: context.userId, push_enabled: false }, { onConflict: "user_id" });
    }
    return { ok: true };
  });

/** Sendet eine Testbenachrichtigung an alle Geräte des angemeldeten Nutzers. */
export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: subs } = await context.supabase
      .from("push_subscriptions")
      .select("endpoint,keys")
      .eq("user_id", context.userId);
    if (!subs?.length) return { sent: 0 };

    const { sendWebPush } = await import("./webpush.server");
    let sent = 0;
    for (const sub of subs) {
      const res = await sendWebPush(sub as never, {
        title: "EuroDeal",
        body: "Push funktioniert – du bekommst jetzt neue Schnäppchen sofort.",
        url: "/",
      });
      if (res.ok) sent += 1;
    }
    return { sent };
  });

export const updateSearchNotify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        notify: z.boolean().optional(),
        throttleMinutes: z.number().int().min(5).max(1440).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.notify !== undefined) patch["notify"] = data.notify;
    if (data.throttleMinutes !== undefined) patch["throttle_minutes"] = data.throttleMinutes;
    const { error } = await context.supabase
      .from("saved_searches")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
