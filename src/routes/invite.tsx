import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [
      { title: "Freunde zu EuroDeal einladen" },
      {
        name: "description",
        content:
          "Teile EuroDeal per Link, WhatsApp oder E-Mail und hilf Freunden, günstige Immobilien und Fahrzeuge in Europa zu finden.",
      },
      { property: "og:title", content: "Freunde zu EuroDeal einladen" },
      {
        property: "og:description",
        content: "Teile den Anzeigen-Aggregator mit Preis-Check mit deinen Freunden.",
      },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { t } = useI18n();
  const [url, setUrl] = useState("");

  useEffect(() => setUrl(window.location.origin), []);

  const text = `${t("invite.message")} ${url}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success(t("invite.copied"));
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "EuroDeal", text: t("invite.message"), url });
      } catch {
        /* cancelled */
      }
    } else {
      void copy();
    }
  };

  return (
    <AppShell showBack>
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">{t("invite.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("invite.text")}</p>

        <div className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex gap-2">
            <Input readOnly value={url} />
            <Button variant="outline" size="icon" onClick={copy} aria-label={t("invite.copy")}>
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button onClick={nativeShare} className="gap-2">
              <Share2 className="size-4" />
              {t("detail.share")}
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(text)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href={`mailto:?subject=EuroDeal&body=${encodeURIComponent(text)}`}>
                <Mail className="size-4" />
                E-Mail
              </a>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
