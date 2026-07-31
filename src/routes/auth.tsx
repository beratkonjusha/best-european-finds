import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success(t("auth.checkEmail"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell showBack>
      <div className="mx-auto w-full max-w-md px-4 py-14">
        <h1 className="font-display text-2xl font-bold">{t("auth.title")}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
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
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {t(mode === "signin" ? "auth.switchToSignup" : "auth.switchToSignin")}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
