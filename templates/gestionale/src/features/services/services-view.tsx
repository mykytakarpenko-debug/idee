"use client";

import { addDays, startOfDay, subDays } from "date-fns";
import { Clock, Copy, Ellipsis, Layers, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { appointmentsInRange } from "@/lib/domain/analytics";
import type { Service } from "@/lib/domain/types";
import { formatCurrency, formatDuration } from "@/lib/format";
import { cn, groupBy, matchesQuery } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.services;

export function ServicesView() {
  const ready = useDataReady();
  const now = useNow();
  const { services, appointments } = useData((state) => ({
    services: state.services,
    appointments: state.appointments,
  }));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => [...new Set(services.map((s) => s.category))].sort((a, b) => a.localeCompare(b, "it")),
    [services],
  );
  const bookings = useMemo(() => {
    const counts = new Map<string, number>();
    if (!now) return counts;
    const today = startOfDay(now);
    const range = { start: subDays(today, 29), end: addDays(today, 1) };
    for (const appointment of appointmentsInRange(appointments, range)) {
      if (appointment.status === "cancelled") continue;
      counts.set(appointment.serviceId, (counts.get(appointment.serviceId) ?? 0) + 1);
    }
    return counts;
  }, [appointments, now]);

  const filtered = services
    .filter(
      (s) =>
        (category === "all" || s.category === category) &&
        matchesQuery(`${s.name} ${s.category}`, query),
    )
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "it"));
  const grouped = groupBy(filtered, (s) => s.category);
  const activeCategory = category === "all" || categories.includes(category) ? category : "all";

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={ready ? `${t.count(services.length)} · ${t.description}` : t.description}
        actions={
          <Button onClick={() => openDialog({ type: "service" })}>
            <Plus aria-hidden />
            {t.new}
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          value={query}
          onValueChange={setQuery}
          label={copy.common.search}
          placeholder={t.searchPlaceholder}
          className="lg:w-72"
        />
        {categories.length > 1 ? (
          <SegmentedControl
            ariaLabel={t.form.category}
            value={activeCategory}
            onChange={setCategory}
            options={[
              { value: "all", label: t.allCategories },
              ...categories.map((value) => ({ value, label: value })),
            ]}
          />
        ) : null}
      </Toolbar>

      {!ready ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t.empty}
          description={t.emptyHint}
          action={
            <Button onClick={() => openDialog({ type: "service" })}>
              <Plus aria-hidden />
              {t.new}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={SearchX} title={t.noResults} />
      ) : (
        <div className="flex flex-col gap-8">
          {[...grouped.entries()].map(([group, items]) => (
            <section key={group} aria-label={group}>
              <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-fg">
                {group}
                <span className="text-[13px] font-normal text-fg-muted">{items.length}</span>
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((service) => (
                  <li key={service.id}>
                    <ServiceCard service={service} bookings={bookings.get(service.id) ?? 0} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

function ServiceCard({ service, bookings }: { service: Service; bookings: number }) {
  const updateService = useDataStore((state) => state.updateService);
  const duplicateService = useDataStore((state) => state.duplicateService);
  const deleteService = useDataStore((state) => state.deleteService);
  const inUse = useDataStore((state) => state.appointments.some((a) => a.serviceId === service.id));
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-xs transition-[box-shadow,border-color] duration-200 hover:border-line-strong/40 hover:shadow-sm",
        !service.active && "bg-surface-2/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={cn(
              "truncate text-[15px] font-semibold",
              service.active ? "text-fg" : "text-fg-muted",
            )}
          >
            {service.name}
          </h3>
          {!service.active ? <Badge className="mt-1.5">{t.inactive}</Badge> : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mt-1 -mr-2"
              aria-label={`${copy.common.moreActions}: ${service.name}`}
            >
              <Ellipsis aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52">
            <DropdownMenuItem onSelect={() => openDialog({ type: "service", id: service.id })}>
              <Pencil aria-hidden />
              {copy.common.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                duplicateService(service.id, t.copySuffix);
                toast.success(t.duplicated);
              }}
            >
              <Copy aria-hidden />
              {t.duplicate}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem tone="danger" onSelect={() => setConfirmOpen(true)}>
              <Trash2 aria-hidden />
              {copy.common.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {service.description ? (
        <p className="mt-2 line-clamp-2 text-[13px] text-fg-muted">{service.description}</p>
      ) : null}

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div>
          <p className="text-xl font-semibold tracking-tight text-fg">
            {formatCurrency(service.price)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-fg-muted">
            <Clock aria-hidden className="size-3.5" />
            {formatDuration(service.durationMin)}
            <span aria-hidden>·</span>
            {t.bookings30(bookings)}
          </p>
        </div>
        <Switch
          checked={service.active}
          onCheckedChange={(checked) => {
            updateService(service.id, { active: checked });
            toast.success(checked ? t.restore : t.archive, { description: service.name });
          }}
          aria-label={t.toggleLabel(service.name)}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t.delete.title}
        description={inUse ? t.delete.inUse : t.delete.description}
        confirmLabel={t.delete.confirm}
        onConfirm={() => {
          const result = deleteService(service.id);
          toast.success(result === "archived" ? t.delete.archived : t.delete.done);
        }}
      />
    </article>
  );
}
