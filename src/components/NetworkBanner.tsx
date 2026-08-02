import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, WifiOff, Signal, X } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & { prompt: () => Promise<void> };

export function NetworkBanner() {
  const { t } = useI18n();
  const { online, metered } = useNetworkStatus();
  const [meteredDismissed, setMeteredDismissed] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!online) {
    return (
      <div className="sticky top-14 z-30 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive">
        <span className="inline-flex items-center gap-2">
          <WifiOff className="size-3.5 shrink-0" />
          <span>{t("network.offlineDesc")}</span>
          <Link to="/saved" className="font-semibold underline underline-offset-2">
            {t("offline.saved")}
          </Link>
        </span>
      </div>
    );
  }

  if (metered && !meteredDismissed) {
    return (
      <div className="sticky top-14 z-30 border-b bg-surface px-4 py-2 text-xs">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2">
          <Signal className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">{t("network.meteredDesc")}</span>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs"
            onClick={() => setMeteredDismissed(true)}
          >
            {t("network.continue")}
          </Button>
          <button
            aria-label="close"
            onClick={() => setMeteredDismissed(true)}
            className="rounded p-1 hover:bg-black/5"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (installEvent) {
    return (
      <div className="sticky top-14 z-30 border-b bg-surface px-4 py-2 text-xs">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2">
          <Download className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">{t("pwa.install")}</span>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={async () => {
              await installEvent.prompt();
              setInstallEvent(null);
            }}
          >
            {t("pwa.install")}
          </Button>
          <button
            aria-label="close"
            onClick={() => setInstallEvent(null)}
            className="rounded p-1 hover:bg-black/5"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
