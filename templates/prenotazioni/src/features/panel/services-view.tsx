"use client";

import { Clock, Hourglass, Pencil, Plus } from "lucide-react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { modeIcon, priceLabel } from "@/features/site/booking-wizard";

const t = copy.services;

export function ServicesView() {
  const ready = useDataReady();
  const { services, categories, staff } = useData((state) => ({
    services: state.services,
    categories: state.categories,
    staff: state.staff,
  }));
  const updateService = useDataStore((state) => state.updateService);

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button onClick={() => openDialog({ type: "service" })}>
            <Plus aria-hidden />
            {t.newService}
          </Button>
        }
      />
      {!ready ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((category) => {
            const list = services.filter((s) => s.categoryId === category.id);
            if (list.length === 0) return null;
            return (
              <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                <h2 id={`cat-${category.id}`} className="mb-2 px-1 text-sm font-semibold text-fg">
                  {category.name}
                </h2>
                <Card>
                  <ul className="divide-y divide-line">
                    {list.map((service) => (
                      <li
                        key={service.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              service.active ? "text-fg" : "text-fg-muted",
                            )}
                          >
                            {service.name}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
                            <span className="inline-flex items-center gap-1">
                              <Clock aria-hidden className="size-3.5" />
                              {copy.common.minutes(service.durationMin)} +{" "}
                              {copy.common.minutes(service.bufferMin)}
                            </span>
                            {service.modes.map((m) => {
                              const Icon = modeIcon[m];
                              return (
                                <span key={m} className="inline-flex items-center gap-1">
                                  <Icon aria-hidden className="size-3.5" />
                                  {copy.modes[m]}
                                </span>
                              );
                            })}
                            {service.requiresApproval ? (
                              <span className="inline-flex items-center gap-1 text-warning">
                                <Hourglass aria-hidden className="size-3.5" />
                                {copy.booking.service.approval}
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-fg-muted">
                            {service.staffIds
                              .map((id) => staff.find((p) => p.id === id)?.name)
                              .join(", ")}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-fg tabular-nums">
                          {priceLabel(service)}
                        </span>
                        <Switch
                          checked={service.active}
                          aria-label={t.toggle(service.name)}
                          onCheckedChange={(active) => {
                            updateService(service.id, { active });
                            toast.success(active ? t.active : t.inactive, {
                              description: service.name,
                            });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${copy.common.edit}: ${service.name}`}
                          onClick={() => openDialog({ type: "service", id: service.id })}
                        >
                          <Pencil aria-hidden />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            );
          })}
        </div>
      )}
    </Page>
  );
}
