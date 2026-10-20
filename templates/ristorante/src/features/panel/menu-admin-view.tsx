"use client";

import { Ellipsis, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import type { Dish } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { matchesQuery } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { DietBadges } from "@/features/site/dish-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const m = copy.menuAdmin;

export function MenuAdminView() {
  const ready = useDataReady();
  const { dishes, categories } = useData((state) => ({
    dishes: state.dishes,
    categories: state.categories,
  }));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [toDelete, setToDelete] = useState<Dish | null>(null);
  const deleteDish = useDataStore((state) => state.deleteDish);

  const sections = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.position - b.position)
        .filter((c) => !category || c.id === category)
        .map((c) => ({
          category: c,
          dishes: dishes.filter(
            (d) => d.categoryId === c.id && matchesQuery(`${d.name} ${d.description}`, query),
          ),
        }))
        .filter((section) => section.dishes.length > 0),
    [categories, dishes, category, query],
  );
  const soldOut = dishes.filter((d) => !d.available).length;

  return (
    <Page>
      <PageHeader
        title={m.title}
        description={m.description}
        actions={
          <Button onClick={() => openDialog({ type: "dish" })}>
            <Plus aria-hidden />
            {m.newDish}
          </Button>
        }
      />
      <Toolbar>
        <SearchInput
          value={query}
          onValueChange={setQuery}
          label={copy.common.search}
          placeholder={copy.menu.searchPlaceholder}
          className="sm:w-72"
        />
        <div className="sm:w-56">
          <Select
            aria-label={m.form.category}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{m.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </Toolbar>
      {ready ? (
        <p className="-mt-2 text-sm text-fg-muted" aria-live="polite">
          {copy.common.results(sections.reduce((acc, s) => acc + s.dishes.length, 0))}
          {soldOut > 0 ? ` · ${soldOut} ${m.soldOut.toLowerCase()}` : ""}
        </p>
      ) : null}

      {!ready ? (
        <Card className="space-y-3 p-6" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </Card>
      ) : sections.length === 0 ? (
        <Card>
          <EmptyState
            icon={UtensilsCrossed}
            title={copy.menu.noResults}
            description={copy.menu.noResultsHint}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {sections.map(({ category: c, dishes: items }) => (
            <section key={c.id} aria-labelledby={`cat-${c.id}`}>
              <h2 id={`cat-${c.id}`} className="mb-2 px-1 text-sm font-semibold text-fg">
                {c.name}
              </h2>
              <Card>
                <ul className="divide-y divide-line">
                  {items.map((dish) => (
                    <DishRow key={dish.id} dish={dish} onDelete={() => setToDelete(dish)} />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={m.delete.title}
        description={toDelete ? `${toDelete.name}. ${m.delete.text}` : m.delete.text}
        confirmLabel={copy.common.delete}
        onConfirm={() => {
          if (!toDelete) return;
          deleteDish(toDelete.id);
          toast.success(m.delete.done, { description: toDelete.name });
          setToDelete(null);
        }}
      />
    </Page>
  );
}

function DishRow({ dish, onDelete }: { dish: Dish; onDelete: () => void }) {
  const updateDish = useDataStore((state) => state.updateDish);
  return (
    <li className="flex items-center gap-4 px-4 py-3 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
          <span
            className={
              dish.available ? undefined : "text-fg-muted line-through decoration-fg-subtle"
            }
          >
            {dish.name}
          </span>
          {!dish.available ? <Badge tone="warning">{m.soldOut}</Badge> : null}
          {!dish.orderable ? <Badge>{m.notOrderable}</Badge> : null}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">{dish.description}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 empty:hidden">
          <DietBadges dish={dish} />
        </div>
      </div>
      <span className="text-sm font-medium text-fg tabular-nums">{formatCurrency(dish.price)}</span>
      <Switch
        checked={dish.available}
        aria-label={m.toggleLabel(dish.name)}
        onCheckedChange={(available) => {
          updateDish(dish.id, { available });
          toast.success(available ? m.markedAvailable(dish.name) : m.markedSoldOut(dish.name));
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${copy.common.moreActions}: ${dish.name}`}
          >
            <Ellipsis aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44">
          <DropdownMenuItem onSelect={() => openDialog({ type: "dish", id: dish.id })}>
            <Pencil aria-hidden />
            {copy.common.edit}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={onDelete}>
            <Trash2 aria-hidden />
            {copy.common.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
