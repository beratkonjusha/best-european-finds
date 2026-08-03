import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Anmelden | EuroDeal" },
      {
        name: "description",
        content:
          "Melde dich bei EuroDeal an, um Anzeigen zu speichern, Suchen zu sichern und Benachrichtigungen zu erhalten.",
      },
      { property: "og:title", content: "Anmelden | EuroDeal" },
      {
        property: "og:description",
        content: "Konto erstellen oder anmelden, um Favoriten und Suchen zu speichern.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function friendly(message: string) {
    const m = message.toLowerCase();
    if (m.includes("weak") || m.includes("pwned")) return t("auth.weakPassword");
    if (m.includes("invalid login")) return t("auth.invalid");
    return message;
  }

  const google = async () => {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if ("error" in res && res.error) throw res.error;
      if (!("redirected" in res && res.redirected)) {
        toast.success(t("auth.welcome"));
        router.navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? friendly(err.message) : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email) {
      toast.error(t("auth.needEmail"));
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(friendly(error.message));
    else toast.success(t("auth.resetSent"));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcome"));
        router.navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          toast.success(t("auth.created"));
          router.navigate({ to: "/" });
        } else {
          toast.success(t("auth.checkEmail"));
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? friendly(err.message) : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell showBack>
      <div className="mx-auto w-full max-w-md px-4 py-14">
        <h1 className="font-display text-2xl font-bold">{t("auth.title")}</h1>
        <div className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-float">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => void google()}
          >
            {t("auth.google")}
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("auth.or")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {t(mode === "signin" ? "auth.signin" : "auth.signup")}
            </Button>
          </form>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {t(mode === "signin" ? "auth.switchToSignup" : "auth.switchToSignin")}
          </Button>
          <button
            type="button"
            onClick={() => void forgot()}
            className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("auth.forgot")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
