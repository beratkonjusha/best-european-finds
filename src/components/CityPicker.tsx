import { useState } from "react";
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCitySearch, useCity } from "@/lib/reference-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Städtesuche per Name oder Postleitzahl. */
export function CityPicker({
  countryCode,
  regionId,
  value,
  onChange,
}: {
  countryCode: string;
  regionId: string;
  value: string;
  onChange: (cityId: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const results = useCitySearch(countryCode, regionId, term);
  const selected = useCity(value);

  const label = value ? (selected.data?.name ?? "…") : t("filters.anyCity");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={!countryCode}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="relative border-b p-2">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t("filters.citySearch")}
            className="h-9 pl-8"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto py-1">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <Check className={cn("size-4", value ? "opacity-0" : "opacity-100")} />
              {t("filters.anyCity")}
            </button>
          </li>
          {results.isPending ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t("results.loading")}</li>
          ) : (results.data ?? []).length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t("filters.noCity")}</li>
          ) : (
            (results.data ?? []).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4 shrink-0", value === c.id ? "opacity-100" : "opacity-0")}
                  />
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.postal_code ? (
                    <span className="shrink-0 text-xs text-muted-foreground">{c.postal_code}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
