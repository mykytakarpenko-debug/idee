"use client";

import { PackageSearch, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useCatalog, useToday } from "@/hooks/use-catalog";
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  filterProducts,
  filtersToQuery,
  parseFilters,
  SORT_KEYS,
  type CatalogFilters,
  type SortKey,
} from "@/lib/domain/catalog";
import type { Category, Seller } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { ProductCard } from "@/components/product/product-card";
import { Container, SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Select } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";

const t = copy.catalog;
const PRICE_STEPS = [20, 30, 50, 80];

/** Catalogo con i filtri letti dall'URL (va dentro <Suspense>). */
export function CatalogWithParams() {
  const params = useSearchParams();
  return <CatalogView search={params.toString()} />;
}

/**
 * Catalogo filtrabile. Con `search` vuoto mostra tutti i prodotti: è anche
 * il contenuto statico della pagina (HTML indicizzabile) prima dei filtri.
 */
export function CatalogView({ search }: { search: string }) {
  const router = useRouter();
  const pathname = routes.shop;
  const filters = useMemo(() => parseFilters(new URLSearchParams(search)), [search]);
  const { products, categories, sellers, reviews } = useCatalog();
  const today = useToday();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState(filters.q);
  const [lastQ, setLastQ] = useState(filters.q);
  if (filters.q !== lastQ) {
    // Ricerca dall'intestazione mentre il catalogo è già aperto.
    setLastQ(filters.q);
    setQuery(filters.q);
  }

  const results = useMemo(
    () => filterProducts(products, filters, { today, reviews, categories, sellers }),
    [products, filters, today, reviews, categories, sellers],
  );
  const sellerById = new Map(sellers.map((s) => [s.id, s]));
  const update = (patch: Partial<CatalogFilters>) =>
    router.replace(`${pathname}${filtersToQuery({ ...filters, ...patch })}`, { scroll: false });
  const activeCount = activeFilterCount(filters);
  const category = categories.find((c) => c.id === filters.category);
  const title = category?.name ?? (filters.onSale ? t.offersTitle : t.title);

  return (
    <Container className="animate-page-in py-10 sm:py-14">
      <SectionHeading as="h1" title={title} description={category?.description ?? t.description} />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          label={copy.site.searchLabel}
          placeholder={copy.site.searchPlaceholder}
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setLastQ(value);
            update({ q: value });
          }}
          className="sm:max-w-sm"
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant="secondary"
            className="lg:hidden"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal aria-hidden />
            {t.filters}
            {activeCount > 0 ? <span className="text-fg-muted">({activeCount})</span> : null}
          </Button>
          <SortSelect value={filters.sort} onChange={(sort) => update({ sort })} />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside aria-label={t.filters} className="hidden lg:block">
          <Filters
            filters={filters}
            categories={categories}
            sellers={sellers}
            onChange={update}
            onReset={() => update({ ...DEFAULT_FILTERS, q: filters.q, sort: filters.sort })}
          />
        </aside>

        <section aria-labelledby="risultati">
          <h2 id="risultati" className="sr-only">
            {t.results(results.length)}
          </h2>
          <p className="text-sm text-fg-muted" aria-live="polite">
            {t.results(results.length)}
            {activeCount > 0 ? ` · ${t.activeFilters(activeCount)}` : ""}
          </p>
          {results.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={PackageSearch}
              title={t.empty}
              description={t.emptyHint}
              action={
                <Button
                  variant="secondary"
                  onClick={() => router.replace(pathname, { scroll: false })}
                >
                  {copy.common.resetFilters}
                </Button>
              }
            />
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  seller={sellerById.get(product.sellerId)}
                  reviews={reviews}
                  today={today}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent title={t.filters} side="left" className="w-[min(22rem,100%)]">
          <div className="flex-1 overflow-y-auto p-5">
            <h2 className="font-display text-xl font-medium text-fg">{t.filters}</h2>
            <Filters
              className="mt-5"
              filters={filters}
              categories={categories}
              sellers={sellers}
              onChange={update}
              onReset={() => update({ ...DEFAULT_FILTERS, q: filters.q, sort: filters.sort })}
            />
          </div>
          <div className="border-t border-line p-4">
            <Button size="lg" className="w-full" onClick={() => setSheetOpen(false)}>
              {t.applyFilters(results.length)}
            </Button>
          </div>
        </SheetContent>
      </Dialog>
    </Container>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (sort: SortKey) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm whitespace-nowrap text-fg-muted">
        {t.sort}
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as SortKey)}>
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {t.sorts[key]}
          </option>
        ))}
      </Select>
    </div>
  );
}

function Filters({
  filters,
  categories,
  sellers,
  onChange,
  onReset,
  className,
}: {
  filters: CatalogFilters;
  categories: Category[];
  sellers: Seller[];
  onChange: (patch: Partial<CatalogFilters>) => void;
  onReset: () => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <div className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-cat`} className="text-[13px] font-medium text-fg">
            {t.category}
          </label>
          <Select
            id={`${id}-cat`}
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            <option value="">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-seller`} className="text-[13px] font-medium text-fg">
            {t.seller}
          </label>
          <Select
            id={`${id}-seller`}
            value={filters.seller}
            onChange={(e) => onChange({ seller: e.target.value })}
          >
            <option value="">{t.allSellers}</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-price`} className="text-[13px] font-medium text-fg">
            {t.maxPrice}
          </label>
          <Select
            id={`${id}-price`}
            value={filters.maxPrice === null ? "" : String(filters.maxPrice / 100)}
            onChange={(e) =>
              onChange({ maxPrice: e.target.value ? Number(e.target.value) * 100 : null })
            }
          >
            <option value="">{t.anyPrice}</option>
            {PRICE_STEPS.map((euros) => (
              <option key={euros} value={euros}>
                {t.upTo(formatCurrency(euros * 100, { round: true }))}
              </option>
            ))}
          </Select>
        </div>
        <fieldset className="space-y-3">
          <legend className="sr-only">{t.filters}</legend>
          <label className="flex items-center gap-2.5 text-sm text-fg">
            <Checkbox
              checked={filters.inStock}
              onChange={(e) => onChange({ inStock: e.target.checked })}
            />
            {t.inStock}
          </label>
          <label className="flex items-center gap-2.5 text-sm text-fg">
            <Checkbox
              checked={filters.onSale}
              onChange={(e) => onChange({ onSale: e.target.checked })}
            />
            {t.onSale}
          </label>
        </fieldset>
      </div>
      {activeFilterCount(filters) > 0 ? (
        <Button variant="ghost" className="mt-5 -ml-3" onClick={onReset}>
          {copy.common.resetFilters}
        </Button>
      ) : null}
    </div>
  );
}
