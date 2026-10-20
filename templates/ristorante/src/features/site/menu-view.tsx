"use client";

import { Info, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useSiteData } from "@/hooks/use-site-data";
import { emptyFilters, matchesFilters, type MenuFilters } from "@/lib/domain/menu";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Container, SectionHeading } from "@/components/site/section";
import { AllergenList, DietBadges } from "./dish-badges";
import { MenuFiltersBar } from "./menu-filters";

export function MenuView() {
  const { categories, dishes } = useSiteData();
  const [filters, setFilters] = useState<MenuFilters>(emptyFilters);

  const sections = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.position - b.position)
        .map((category) => ({
          category,
          dishes: dishes.filter((d) => d.categoryId === category.id && matchesFilters(d, filters)),
        }))
        .filter((section) => section.dishes.length > 0),
    [categories, dishes, filters],
  );
  const count = sections.reduce((acc, s) => acc + s.dishes.length, 0);

  return (
    <div className="animate-page-in">
      <Container className="pt-12 pb-6 sm:pt-16">
        <SectionHeading as="h1" title={copy.menu.title} description={copy.menu.description} />
      </Container>

      <div className="sticky top-16 z-20 border-y border-line bg-canvas/95 backdrop-blur">
        <Container className="flex flex-col gap-3 py-3">
          <nav aria-label={copy.menu.categories} className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {sections.map(({ category }) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {category.name}
              </a>
            ))}
          </nav>
          <MenuFiltersBar filters={filters} onChange={setFilters} resultCount={count} />
        </Container>
      </div>

      <Container className="py-10">
        {sections.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={copy.menu.noResults}
            description={copy.menu.noResultsHint}
          />
        ) : (
          <div className="flex flex-col gap-14">
            {sections.map(({ category, dishes: list }) => (
              <section
                key={category.id}
                id={category.id}
                aria-labelledby={`${category.id}-title`}
                className="scroll-mt-48"
              >
                <h2
                  id={`${category.id}-title`}
                  className="font-display text-3xl font-semibold text-fg"
                >
                  {category.name}
                </h2>
                <ul className="mt-6 grid gap-x-12 gap-y-8 md:grid-cols-2">
                  {list.map((dish) => (
                    <li key={dish.id}>
                      <div className="flex items-baseline gap-3">
                        <h3
                          className={cn(
                            "font-display text-lg font-semibold",
                            dish.available ? "text-fg" : "text-fg-muted",
                          )}
                        >
                          {dish.name}
                        </h3>
                        <span
                          aria-hidden
                          className="mb-1 flex-1 border-b border-dotted border-line-strong/40"
                        />
                        <span className="font-medium text-fg tabular-nums">
                          {formatCurrency(dish.price)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-fg-muted">{dish.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {!dish.available ? <Badge tone="warning">{copy.menu.soldOut}</Badge> : null}
                        <DietBadges dish={dish} />
                      </div>
                      <div className="mt-2">
                        <AllergenList dish={dish} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        <p className="mt-14 flex gap-3 rounded-xl border border-line bg-surface p-4 text-[13px] text-fg-muted">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
          {copy.menu.allergenNotice}
        </p>
      </Container>
    </div>
  );
}
