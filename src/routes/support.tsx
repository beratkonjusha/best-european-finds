import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support kontaktieren | EuroDeal" },
      {
        name: "description",
        content:
          "Fragen, Fehler oder Feedback zu EuroDeal? Schreib dem Support – wir antworten per E-Mail.",
      },
      { property: "og:title", content: "Support kontaktieren | EuroDeal" },
      { property: "og:description", content: "Kontaktformular für Fragen und Feedback." },
    ],
  }),
  component: SupportPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(5).max(2000),
});

function SupportPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("support.error"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("support_messages").insert(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(t("support.error"));
      return;
    }
    toast.success(t("support.sent"));
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <AppShell showBack>
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">{t("support.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("support.intro")}</p>
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="name">{t("support.name")}</Label>
            <Input
              id="name"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("support.email")}</Label>
            <Input
              id="email"
              type="email"
              required
              maxLength={255}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t("support.message")}</Label>
            <Textarea
              id="message"
              required
              rows={6}
              maxLength={2000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {t("support.send")}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
