import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import {
  currentSubscription,
  pushEnabledForUser,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import {
  removePushSubscription,
  savePushSubscription,
  sendTestPush,
} from "@/lib/push.functions";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Mein Profil | EuroDeal" },
      {
        name: "description",
        content:
          "Profil, Sprache, Benachrichtigungen und gespeicherte Suchen für deine EuroDeal-Schnäppchenjagd verwalten.",
      },
      { property: "og:title", content: "Mein Profil | EuroDeal" },
      {
        property: "og:description",
        content: "Persönliche Einstellungen, Push-Benachrichtigungen und gespeicherte Suchen.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

type ProfileForm = {
  display_name: string;
  avatar_url: string;
  bio: string;
  phone: string;
  city: string;
  country_code: string;
  language: string;
};

const EMPTY: ProfileForm = {
  display_name: "",
  avatar_url: "",
  bio: "",
  phone: "",
  city: "",
  country_code: "",
  language: "de",
};

function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { ids } = useFavorites();
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const saveSub = useServerFn(savePushSubscription);
  const removeSub = useServerFn(removePushSubscription);
  const testPush = useServerFn(sendTestPush);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const searches = useQuery({
    queryKey: ["saved-searches", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("id,label,notify,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (profile.data) {
      setForm({
        display_name: profile.data.display_name ?? "",
        avatar_url: profile.data.avatar_url ?? "",
        bio: profile.data.bio ?? "",
        phone: profile.data.phone ?? "",
        city: profile.data.city ?? "",
        country_code: profile.data.country_code ?? "",
        language: profile.data.language ?? lang,
      });
    }
  }, [profile.data, lang]);

  useEffect(() => {
    void (async () => {
      if (!user) return;
      const sub = await currentSubscription();
      setPushOn(Boolean(sub) && (await pushEnabledForUser(user.id)));
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, ...form }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLang(form.language as Lang);
    toast.success(t("profile.saved"));
    void qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function togglePush(next: boolean) {
    if (!user) return;
    if (!next) {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) await removeSub({ data: { endpoint } });
      setPushOn(false);
      return;
    }
    if (!pushSupported()) {
      toast.error(t("push.unsupported"));
      return;
    }
    const res = await subscribeToPush();
    if (res.status === "denied") {
      toast.error(t("push.blocked"));
      return;
    }
    if (res.status !== "ok") {
      toast.error(t("push.unsupported"));
      return;
    }
    try {
      await saveSub({
        data: {
          endpoint: res.endpoint,
          p256dh: res.p256dh,
          auth: res.auth,
          userAgent: navigator.userAgent.slice(0, 400),
        },
      });
      setPushOn(true);
      toast.success(t("profile.pushEnabled"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  }

  if (loading || !user) {
    return (
      <AppShell showBack>
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const initials = (form.display_name || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <AppShell showBack>
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <header className="flex flex-wrap items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-float">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold">{t("profile.title")}</h1>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </header>

        <section className="mt-8 grid gap-4 rounded-2xl border bg-card p-6 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="display_name">{t("profile.name")}</Label>
              <Input
                id="display_name"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">{t("profile.phone")}</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="city">{t("profile.city")}</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="country">{t("profile.country")}</Label>
              <Input
                id="country"
                value={form.country_code}
                onChange={(e) => setForm({ ...form, country_code: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="avatar">{t("profile.avatar")}</Label>
              <Input
                id="avatar"
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="bio">{t("profile.bio")}</Label>
              <Textarea
                id="bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("profile.language")}</Label>
              <Select
                value={form.language}
                onValueChange={(v) => setForm({ ...form, language: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Button onClick={save} disabled={saving}>
              {t("profile.save")}
            </Button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">{t("profile.notifications")}</h2>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("profile.pushOn")}</p>
              <p className="text-xs text-muted-foreground">{t("profile.pushHint")}</p>
            </div>
            <Switch
              checked={pushOn}
              onCheckedChange={(v) => {
                void togglePush(v);
              }}
            />
          </div>

          <div className="mt-2">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Bell className="size-4" /> {t("profile.searches")}
            </p>
            {(searches.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">—</p>
            ) : (
              <ul className="grid gap-2">
                {(searches.data ?? []).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-surface px-3 py-2 text-sm"
                  >
                    <span className="truncate">{s.label}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Switch
                        checked={s.notify}
                        onCheckedChange={async (v) => {
                          await supabase
                            .from("saved_searches")
                            .update({ notify: v })
                            .eq("id", s.id);
                          void searches.refetch();
                        }}
                      />
                      <button
                        aria-label="delete"
                        onClick={async () => {
                          await supabase.from("saved_searches").delete().eq("id", s.id);
                          void searches.refetch();
                        }}
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-3 rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">{t("profile.stats")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/saved"
              className="rounded-xl bg-surface p-4 transition-shadow hover:shadow-card"
            >
              <p className="font-display text-2xl font-bold">{ids.length}</p>
              <p className="text-xs text-muted-foreground">{t("profile.favorites")}</p>
            </Link>
            <div className="rounded-xl bg-surface p-4">
              <p className="font-display text-2xl font-bold">{searches.data?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">{t("profile.searches")}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-2 w-fit"
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate({ to: "/" });
            }}
          >
            {t("profile.signout")}
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
