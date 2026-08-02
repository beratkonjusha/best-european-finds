import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Quellen-Monitoring | EuroDeal" },
      {
        name: "description",
        content:
          "Statusübersicht aller Datenquellen: Fehlläufe, Ausfälle und Blockade-Signale der Anzeigen-Ingestion.",
      },
      { property: "og:title", content: "Quellen-Monitoring | EuroDeal" },
      {
        property: "og:description",
        content: "Health-Dashboard der angebundenen Marktplatz-Quellen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MonitoringPage,
});

const HEALTH_ICON = {
  ok: CheckCircle2,
  degraded: AlertTriangle,
  blocked: ShieldAlert,
  down: XCircle,
} as const;

function MonitoringPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const isAdmin = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
  });

  const sources = useQuery({
    queryKey: ["monitor-sources"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources")
        .select(
          "id,slug,name,health,enabled,fail_count,last_run_at,last_success_at,last_error,country_codes",
        )
        .order("health")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const events = useQuery({
    queryKey: ["monitor-events", isAdmin.data],
    enabled: isAdmin.data === true,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_events")
        .select("id,level,kind,message,created_at,source_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = sources.data ?? [];
  const alerts = rows.filter((s) => s.health !== "ok" || s.fail_count > 0);

  return (
    <AppShell showBack>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold">{t("monitor.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("monitor.desc")}</p>

        {alerts.length > 0 && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-destructive">
              {t("monitor.alerts")} · {alerts.length}
            </p>
            <ul className="mt-2 grid gap-1 text-xs text-muted-foreground">
              {alerts.slice(0, 6).map((a) => (
                <li key={a.id} className="truncate">
                  {a.name} — {t(`monitor.${a.health}`)}
                  {a.last_error ? ` · ${a.last_error}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl border bg-card shadow-card">
          {sources.isPending ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="bg-surface text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("monitor.source")}</th>
                  <th className="px-4 py-3">{t("monitor.status")}</th>
                  <th className="px-4 py-3">{t("monitor.fails")}</th>
                  <th className="px-4 py-3">{t("monitor.lastRun")}</th>
                  <th className="px-4 py-3">{t("monitor.lastSuccess")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const health = (s.health as keyof typeof HEALTH_ICON) ?? "ok";
                  const Icon = HEALTH_ICON[health] ?? CheckCircle2;
                  return (
                    <tr key={s.id} className="border-t">
                      <td className="px-4 py-3">
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {(s.country_codes ?? []).slice(0, 4).join(", ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
                            health === "ok"
                              ? "bg-deal-great/15 text-deal-great"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          <Icon className="size-3.5" />
                          {t(`monitor.${health}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{s.fail_count}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.last_run_at ? new Date(s.last_run_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.last_success_at ? new Date(s.last_success_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <h2 className="mt-10 font-display text-lg font-bold">{t("monitor.events")}</h2>
        {isAdmin.data !== true ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("monitor.adminOnly")}</p>
        ) : (events.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("monitor.none")}</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {(events.data ?? []).map((e) => (
              <li key={e.id} className="rounded-xl border bg-card px-4 py-2 text-sm shadow-card">
                <span className="text-xs uppercase text-muted-foreground">{e.level}</span> ·{" "}
                {e.kind} — {e.message ?? ""}
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
