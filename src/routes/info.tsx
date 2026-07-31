import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/info")({
  head: () => ({
    meta: [
      { title: "Über EuroDeal – Zweck, Preislogik & Datenquellen" },
      {
        name: "description",
        content:
          "Wie EuroDeal Anzeigen aus ganz Europa bündelt und mit Median-Vergleich bewertet. Entwickler: Berat Konjusha.",
      },
      { property: "og:title", content: "Über EuroDeal" },
      {
        property: "og:description",
        content: "Zweck, Preisbewertung und Datenquellen des europäischen Anzeigen-Aggregators.",
      },
    ],
  }),
  component: InfoPage,
});

function InfoPage() {
  const { t } = useI18n();
  return (
    <AppShell showBack>
      <article className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12">
        <h1 className="font-display text-3xl font-bold">{t("info.title")}</h1>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("info.purposeTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("info.purpose")}</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("info.dataTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("info.data")}</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("info.devTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("info.dev")}</p>
        </section>
      </article>
    </AppShell>
  );
}
