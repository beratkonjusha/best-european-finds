import { useI18n } from "@/lib/i18n";
import { CATEGORIES, RADIUS_OPTIONS, countryName, type Category } from "@/lib/format";
import { useCities, useCountries, useSources } from "@/lib/reference-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Filters = {
  q: string;
  category: Category | "all";
  country: string;
  cityId: string;
  radius: number;
  sourceIds: string[];
  priceMin: string;
  priceMax: string;
};

export const DEFAULT_FILTERS: Filters = {
  q: "",
  category: "all",
  country: "",
  cityId: "",
  radius: 0,
  sourceIds: [],
  priceMin: "",
  priceMax: "",
};

export function FiltersPanel({
  value,
  onChange,
  onReset,
}: {
  value: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
}) {
  const { t, lang } = useI18n();
  const countries = useCountries();
  const cities = useCities(value.country);
  const sources = useSources();

  const set = <K extends keyof Filters>(key: K, v: Filters[K]) =>
    onChange({ ...value, [key]: v });

  const visibleSources = (sources.data ?? []).filter((s) => {
    const catOk =
      value.category === "all" || (s.categories as string[]).includes(value.category);
    const countryOk = !value.country || (s.country_codes as string[]).includes(value.country);
    return catOk && countryOk;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{t("filters.category")}</Label>
        <div className="flex flex-wrap gap-2">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={value.category === c ? "default" : "outline"}
              onClick={() => onChange({ ...value, category: c, sourceIds: [] })}
            >
              {t(`cat.${c}`)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("filters.country")}</Label>
          <Select
            value={value.country || "any"}
            onValueChange={(v) =>
              onChange({ ...value, country: v === "any" ? "" : v, cityId: "", sourceIds: [] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="any">{t("filters.anyCountry")}</SelectItem>
              {(countries.data ?? []).map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {countryName(c, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("filters.city")}</Label>
          <Select
            value={value.cityId || "any"}
            onValueChange={(v) => set("cityId", v === "any" ? "" : v)}
            disabled={!value.country}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="any">{t("filters.anyCity")}</SelectItem>
              {(cities.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("filters.radius")}</Label>
          <Select
            value={String(value.radius)}
            onValueChange={(v) => set("radius", Number(v))}
            disabled={!value.cityId}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r === 0 ? t("filters.noRadius") : `${r} km`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="pmin">{t("filters.priceMin")}</Label>
            <Input
              id="pmin"
              inputMode="numeric"
              value={value.priceMin}
              onChange={(e) => set("priceMin", e.target.value.replace(/\D/g, ""))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pmax">{t("filters.priceMax")}</Label>
            <Input
              id="pmax"
              inputMode="numeric"
              value={value.priceMax}
              onChange={(e) => set("priceMax", e.target.value.replace(/\D/g, ""))}
              placeholder="∞"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("filters.sources")}</Label>
        <p className="text-xs text-muted-foreground">
          {value.sourceIds.length === 0
            ? t("filters.allSources")
            : t("filters.sourcesSelected", { n: value.sourceIds.length })}
        </p>
        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border bg-surface p-3 sm:grid-cols-2">
          {visibleSources.map((s) => {
            const checked = value.sourceIds.includes(s.id);
            return (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() =>
                    set(
                      "sourceIds",
                      checked
                        ? value.sourceIds.filter((i) => i !== s.id)
                        : [...value.sourceIds, s.id],
                    )
                  }
                />
                <span className="truncate">{s.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        {t("filters.reset")}
      </Button>
    </div>
  );
}
