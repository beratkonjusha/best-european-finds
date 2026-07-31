import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Bewertungen von Nutzerinnen und Nutzern | EuroDeal" },
      {
        name: "description",
        content:
          "Lies öffentliche Bewertungen zu EuroDeal und teile deine eigene Erfahrung mit dem Anzeigen-Aggregator.",
      },
      { property: "og:title", content: "Bewertungen | EuroDeal" },
      { property: "og:description", content: "Öffentliche Nutzerbewertungen zu EuroDeal." },
    ],
  }),
  component: ReviewsPage,
});

function Stars({
  value,
  onChange,
  size = "size-5",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn("text-accent", onChange && "cursor-pointer")}
          aria-label={`${n}`}
        >
          <Star className={cn(size, n <= value ? "fill-accent" : "opacity-30")} />
        </button>
      ))}
    </div>
  );
}

function ReviewsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const reviews = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,author_name,body,rating,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const list = reviews.data ?? [];
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      author_name: name.trim().slice(0, 60) || (user.email ?? "Anonym").split("@")[0],
      body: body.trim().slice(0, 1000) || null,
      rating,
    });
    setBusy(false);
    if (error) {
      toast.error(t("common.error"));
      return;
    }
    toast.success(t("reviews.thanks"));
    setBody("");
    void qc.invalidateQueries({ queryKey: ["reviews"] });
  };

  return (
    <AppShell showBack>
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">{t("reviews.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("reviews.intro")}</p>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-card">
          <p className="font-display text-4xl font-bold">{avg ? avg.toFixed(1) : "–"}</p>
          <div>
            <Stars value={Math.round(avg)} />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("reviews.count", { n: list.length })}
            </p>
          </div>
        </div>

        {user ? (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border bg-card p-6 shadow-card">
            <div className="space-y-2">
              <Label>{t("reviews.yourRating")}</Label>
              <Stars value={rating} onChange={setRating} size="size-7" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rname">{t("reviews.yourName")}</Label>
              <Input
                id="rname"
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rbody">{t("reviews.yourText")}</Label>
              <Textarea
                id="rbody"
                rows={4}
                maxLength={1000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy}>
              {t("reviews.submit")}
            </Button>
          </form>
        ) : (
          <div className="mt-8 rounded-2xl border bg-card p-6 text-sm shadow-card">
            <p className="text-muted-foreground">{t("reviews.needAuth")}</p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/auth">{t("nav.signin")}</Link>
            </Button>
          </div>
        )}

        <ul className="mt-10 space-y-4">
          {list.length === 0 && (
            <li className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("reviews.empty")}
            </li>
          )}
          {list.map((r) => (
            <li key={r.id} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{r.author_name}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDate(r.created_at, lang)}
                </span>
              </div>
              <div className="mt-1">
                <Stars value={r.rating} size="size-4" />
              </div>
              {r.body && <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
