"use client";

import { Plus, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useSiteData } from "@/hooks/use-site-data";
import { emptyFilters, matchesFilters, type MenuFilters } from "@/lib/domain/menu";
import { cartTotals } from "@/lib/domain/orders";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { Container, SectionHeading } from "@/components/site/section";
import { CartPanel } from "./cart-panel";
import { AllergenList, DietBadges } from "./dish-badges";
import { MenuFiltersBar } from "./menu-filters";

const o = copy.order;

export function OrderView() {
  const { categories, dishes, settings } = useSiteData();
  const [filters, setFilters] = useState<MenuFilters>(emptyFilters);
  const [cartOpen, setCartOpen] = useState(false);
  const add = useCartStore((state) => state.add);
  const lines = useCartStore((state) => state.lines);
  const type = useCartStore((state) => state.type);
  const hydrated = useCartStore((state) => state.hydrated);
  const totals = cartTotals(lines, dishes, type, settings);

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
    <Container className="animate-page-in py-12 pb-28 sm:py-16 lg:pb-16">
      <SectionHeading as="h1" title={o.title} description={o.description} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <MenuFiltersBar filters={filters} onChange={setFilters} resultCount={count} />
          {sections.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={copy.menu.noResults}
              description={copy.menu.noResultsHint}
            />
          ) : (
            <div className="mt-8 flex flex-col gap-10">
              {sections.map(({ category, dishes: list }) => (
                <section key={category.id} aria-labelledby={`order-${category.id}`}>
                  <h2
                    id={`order-${category.id}`}
                    className="font-display text-2xl font-semibold text-fg"
                  >
                    {category.name}
                  </h2>
                  <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
                    {list.map((dish) => {
                      const orderable = dish.orderable && dish.available;
                      return (
                        <li key={dish.id} className="flex items-start gap-4 p-4 sm:p-5">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-fg">{dish.name}</p>
                            <p className="mt-0.5 text-sm text-fg-muted">{dish.description}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <DietBadges dish={dish} />
                              {!dish.available ? (
                                <Badge tone="warning">{copy.menu.soldOut}</Badge>
                              ) : null}
                              {dish.available && !dish.orderable ? (
                                <Badge>{o.notOrderable}</Badge>
                              ) : null}
                            </div>
                            <div className="mt-2">
                              <AllergenList dish={dish} />
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="font-medium text-fg tabular-nums">
                              {formatCurrency(dish.price)}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={!orderable}
                              onClick={() => {
                                add(dish.id);
                                toast.success(o.added(dish.name), { duration: 2000 });
                              }}
                              aria-label={`${o.add}: ${dish.name}`}
                            >
                              <Plus aria-hidden />
                              {o.add}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-line bg-surface p-6 shadow-sm">
            {hydrated ? <CartPanel /> : null}
          </div>
        </aside>
      </div>

      {/* Mobile: barra del carrello */}
      {hydrated && totals.items > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <Button size="lg" className="w-full" onClick={() => setCartOpen(true)}>
            {o.viewCart(totals.items, formatCurrency(totals.total))}
          </Button>
        </div>
      ) : null}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent title={o.cart} hideHeader>
          <DialogBody className="pt-5">
            <CartPanel onNavigate={() => setCartOpen(false)} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
