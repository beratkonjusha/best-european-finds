import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/imprint")({
  head: () => ({
    meta: [
      { title: "Impressum & Datenschutz | EuroDeal" },
      {
        name: "description",
        content:
          "Impressum, Haftungsausschluss für Inhalte Dritter und Datenschutzhinweise des EuroDeal-Aggregators.",
      },
      { property: "og:title", content: "Impressum & Datenschutz | EuroDeal" },
      {
        property: "og:description",
        content: "Rechtliche Hinweise, Verantwortlichkeit und Datenschutz bei EuroDeal.",
      },
    ],
  }),
  component: ImprintPage,
});

function ImprintPage() {
  const { t } = useI18n();
  return (
    <AppShell showBack>
      <article className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12">
        <h1 className="font-display text-3xl font-bold">{t("imprint.title")}</h1>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("imprint.responsible")}</h2>
          <p className="text-sm text-muted-foreground">Berat Konjusha</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("imprint.contact")}</h2>
          <p className="text-sm text-muted-foreground">support@eurodeal.app</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("imprint.disclaimerTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("imprint.disclaimer")}</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("imprint.privacyTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("imprint.privacy")}</p>
        </section>
      </article>
    </AppShell>
  );
}
