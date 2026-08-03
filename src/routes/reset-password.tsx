import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Passwort zurücksetzen | EuroDeal" },
      {
        name: "description",
        content: "Setze ein neues Passwort für dein EuroDeal-Konto und melde dich wieder an.",
      },
      { property: "og:title", content: "Passwort zurücksetzen | EuroDeal" },
      {
        property: "og:description",
        content: "Neues Passwort für dein EuroDeal-Konto festlegen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      toast.error(m.includes("weak") || m.includes("pwned") ? t("auth.weakPassword") : error.message);
      return;
    }
    toast.success(t("auth.resetDone"));
    router.navigate({ to: "/profile" });
  };

  return (
    <AppShell showBack>
      <div className="mx-auto w-full max-w-md px-4 py-14">
        <h1 className="font-display text-2xl font-bold">{t("auth.resetTitle")}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-float">
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {t("auth.resetTitle")}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
