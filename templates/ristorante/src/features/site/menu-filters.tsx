"use client";

import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { copy } from "@/content/it";
import { activeFilterCount, emptyFilters, type MenuFilters } from "@/lib/domain/menu";
import { ALLERGENS, type Allergen } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchInput } from "@/components/ui/search-input";

/** Filtri del menu: ricerca, diete e allergeni da escludere. */
export function MenuFiltersBar({
  filters,
  onChange,
  resultCount,
}: {
  filters: MenuFilters;
  onChange: (filters: MenuFilters) => void;
  resultCount: number;
}) {
  const active = activeFilterCount(filters);
  const toggle = (key: "vegetarian" | "vegan" | "glutenFree") =>
    onChange({ ...filters, [key]: !filters[key] });
  const toggleAllergen = (allergen: Allergen) =>
    onChange({
      ...filters,
      excludeAllergens: filters.excludeAllergens.includes(allergen)
        ? filters.excludeAllergens.filter((a) => a !== allergen)
        : [...filters.excludeAllergens, allergen],
    });

  return (
    // Container query: si adatta sia alla pagina Menu (larga) sia alla colonna di Ordina.
    <div className="@container">
      <div className="flex flex-col gap-3 @4xl:flex-row @4xl:items-center">
        <SearchInput
          value={filters.query}
          onValueChange={(query) => onChange({ ...filters, query })}
          label={copy.common.search}
          placeholder={copy.menu.searchPlaceholder}
          className="@4xl:w-72"
        />
        <div
          className="flex flex-1 flex-wrap items-center gap-2"
          role="group"
          aria-label={copy.menu.filters}
        >
          {(
            [
              ["vegetarian", copy.diet.vegetarian],
              ["vegan", copy.diet.vegan],
              ["glutenFree", copy.diet.glutenFree],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filters[key]}
              onClick={() => toggle(key)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                filters[key]
                  ? "border-accent bg-accent-soft text-accent-soft-fg"
                  : "border-line bg-surface text-fg hover:bg-surface-2",
              )}
            >
              {filters[key] ? <Check aria-hidden className="size-3.5" /> : null}
              {label}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                  filters.excludeAllergens.length
                    ? "border-accent bg-accent-soft text-accent-soft-fg"
                    : "border-line bg-surface text-fg hover:bg-surface-2",
                )}
              >
                <SlidersHorizontal aria-hidden className="size-3.5" />
                {copy.menu.excludeAllergens}
                {filters.excludeAllergens.length ? ` (${filters.excludeAllergens.length})` : ""}
                <ChevronDown aria-hidden className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4">
              <fieldset>
                <legend className="mb-3 text-[13px] font-medium text-fg">
                  {copy.menu.excludeAllergensHint}
                </legend>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {ALLERGENS.map((allergen) => (
                    <label key={allergen} className="flex items-center gap-2 text-sm text-fg">
                      <Checkbox
                        checked={filters.excludeAllergens.includes(allergen)}
                        onChange={() => toggleAllergen(allergen)}
                      />
                      {copy.allergens[allergen]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </PopoverContent>
          </Popover>
          {active > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => onChange(emptyFilters)}>
              {copy.common.resetFilters}
            </Button>
          ) : null}
          <p className="ml-auto text-[13px] whitespace-nowrap text-fg-muted" aria-live="polite">
            {copy.menu.shown(resultCount)}
          </p>
        </div>
      </div>
    </div>
  );
}
