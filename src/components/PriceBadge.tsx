import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { PriceBand } from "@/lib/format";

const BAND_CLASS: Record<PriceBand, string> = {
  great: "bg-deal-great text-deal-great-foreground",
  good: "bg-deal-good text-deal-good-foreground",
  fair: "bg-deal-fair text-deal-fair-foreground",
  high: "bg-deal-high text-deal-high-foreground",
  check: "bg-deal-check text-deal-check-foreground",
};

export function PriceBadge({
  band,
  score,
  className,
  showDelta = false,
}: {
  band: PriceBand | null | undefined;
  score?: number | null;
  className?: string;
  showDelta?: boolean;
}) {
  const { t } = useI18n();
  if (!band) return null;
  const delta = typeof score === "number" ? Math.round((score - 1) * 100) : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        BAND_CLASS[band],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {t(`band.${band}`)}
      {showDelta && delta !== null && delta !== 0 ? (
        <span className="font-normal opacity-80">
          {delta > 0 ? "+" : ""}
          {delta}%
        </span>
      ) : null}
    </span>
  );
}
