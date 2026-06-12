"use client";

import Input from "@/components/form/input/InputField";
import MultiSelect from "@/components/form/MultiSelect";
import DatePicker from "@/components/form/date-picker";
import Label from "@/components/form/Label";
import { useI18n } from "@/lib/i18n";
import type { FilterDef, TableState } from "./types";

// Mirrors the project's <Select> styling so a clearable native select fits in.
const SELECT_CLASS =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function FilterPanel({
  filters,
  state,
  onChange,
  onClear,
}: {
  filters: FilterDef[];
  state: TableState;
  onChange: (patch: Record<string, string | string[] | null>) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filters.map((f) => {
          if (f.type === "text") {
            return (
              <div key={f.key}>
                <Label htmlFor={`filter-${f.key}`}>{f.label}</Label>
                <Input
                  id={`filter-${f.key}`}
                  placeholder={f.placeholder}
                  defaultValue={(state.filters[f.key] as string) ?? ""}
                  onChange={(e) => onChange({ [f.key]: e.target.value || null })}
                />
              </div>
            );
          }

          if (f.type === "multiselect") {
            const selected = (state.filters[f.key] as string[]) ?? [];
            return (
              <MultiSelect
                key={f.key}
                label={f.label}
                defaultSelected={selected}
                options={(f.options ?? []).map((o) => ({
                  value: o.value,
                  text: o.label,
                  selected: selected.includes(o.value),
                }))}
                onChange={(vals) => onChange({ [f.key]: vals.length ? vals : null })}
              />
            );
          }

          if (f.type === "daterange") {
            const fromKey = f.fromKey ?? `${f.key}From`;
            const toKey = f.toKey ?? `${f.key}To`;
            return (
              <div key={f.key}>
                <DatePicker
                  id={`filter-${f.key}`}
                  label={f.label}
                  mode="range"
                  placeholder={f.placeholder}
                  onChange={(dates) =>
                    onChange({
                      [fromKey]: dates[0] ? fmt(dates[0]) : null,
                      [toKey]: dates[1] ? fmt(dates[1]) : null,
                    })
                  }
                />
              </div>
            );
          }

          // select | boolean → clearable native select
          const options =
            f.type === "boolean"
              ? [
                  { value: "true", label: f.trueLabel ?? t("common.yes") },
                  { value: "false", label: f.falseLabel ?? t("common.no") },
                ]
              : (f.options ?? []);
          return (
            <div key={f.key}>
              <Label htmlFor={`filter-${f.key}`}>{f.label}</Label>
              <select
                id={`filter-${f.key}`}
                className={SELECT_CLASS}
                value={(state.filters[f.key] as string) ?? ""}
                onChange={(e) => onChange({ [f.key]: e.target.value || null })}
              >
                <option value="">{t("table.all")}</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          {t("table.clearFilters")}
        </button>
      </div>
    </div>
  );
}
