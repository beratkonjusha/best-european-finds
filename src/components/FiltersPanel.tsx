import { useI18n } from "@/lib/i18n";
import { CATEGORIES, RADIUS_OPTIONS, countryName, type Category } from "@/lib/format";
import { useCountries, useRegions, useSources } from "@/lib/reference-queries";
import { CityPicker } from "@/components/CityPicker";
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
  regionId: string;
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
  regionId: "",
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
  const regions = useRegions(value.country);
  const sources = useSources();

  const set = <K extends keyof Filters>(key: K, v: Filters[K]) => onChange({ ...value, [key]: v });

  const visibleSources = (sources.data ?? []).filter((s) => {
    const catOk =
      value.category === "all" || (s.categories as string[]).includes(value.category);
    const countryOk = !value.country || (s.country_codes as string[]).includes(value.country);
    return catOk && countryOk;
  });

  return (
    <div className="min-w-0 space-y-6">
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

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label>{t("filters.country")}</Label>
          <Select
            value={value.country || "any"}
            onValueChange={(v) =>
              onChange({
                ...value,
                country: v === "any" ? "" : v,
                regionId: "",
                cityId: "",
                sourceIds: [],
              })
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

        <div className="min-w-0 space-y-2">
          <Label>{t("filters.region")}</Label>
          <Select
            value={value.regionId || "any"}
            onValueChange={(v) =>
              onChange({ ...value, regionId: v === "any" ? "" : v, cityId: "" })
            }
            disabled={!value.country || (regions.data ?? []).length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filters.anyRegion")} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="any">{t("filters.anyRegion")}</SelectItem>
              {(regions.data ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-2">
          <Label>{t("filters.city")}</Label>
          <CityPicker
            countryCode={value.country}
            regionId={value.regionId}
            value={value.cityId}
            onChange={(id) => set("cityId", id)}
          />
          <p className="text-xs text-muted-foreground">{t("filters.cityHint")}</p>
        </div>

        <div className="min-w-0 space-y-2">
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

        <div className="col-span-full grid grid-cols-2 gap-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="pmin">{t("filters.priceMin")}</Label>
            <Input
              id="pmin"
              inputMode="numeric"
              value={value.priceMin}
              onChange={(e) => set("priceMin", e.target.value.replace(/\D/g, ""))}
              placeholder="0"
            />
          </div>
          <div className="min-w-0 space-y-2">
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
              <label key={s.id} className="flex min-w-0 items-center gap-2 text-sm">
                <Checkbox
                  className="shrink-0"
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
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                {s.health && s.health !== "ok" ? (
                  <span className="shrink-0 rounded-full bg-price-high/15 px-1.5 py-0.5 text-[10px] text-price-high">
                    !
                  </span>
                ) : null}
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
