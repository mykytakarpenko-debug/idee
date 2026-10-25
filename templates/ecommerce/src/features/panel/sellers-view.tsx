"use client";

import { addDays, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { sellerBreakdown } from "@/lib/domain/orders";
import type { Seller } from "@/lib/domain/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";

const t = copy.sellersPanel;

export function SellersPanelView() {
  const ready = useDataReady();
  const now = useNow();
  const { orders, sellers } = useData((state) => ({
    orders: state.orders,
    sellers: state.sellers,
  }));
  const rows = useMemo(() => {
    if (!now) return [];
    const to = addDays(startOfDay(now), 1);
    return sellerBreakdown(orders, sellers, addDays(to, -30), to);
  }, [orders, sellers, now]);
  const total = rows.reduce(
    (acc, r) => ({
      orders: acc.orders + r.orders,
      units: acc.units + r.units,
      gross: acc.gross + r.gross,
      commission: acc.commission + r.commission,
      net: acc.net + r.net,
    }),
    { orders: 0, units: 0, gross: 0, commission: 0, net: 0 },
  );
  const c = t.columns;

  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      {!ready || !now ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : (
        <>
          <p className="-mt-2 text-sm font-medium text-fg">{t.period}</p>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const seller = sellers.find((s) => s.id === row.sellerId)!;
              return (
                <li key={row.sellerId}>
                  <Card className="h-full">
                    <CardContent className="space-y-4 pt-5">
                      <div>
                        <h2 className="text-[15px] font-semibold text-fg">{seller.name}</h2>
                        <p className="text-[13px] text-fg-muted">
                          {seller.craft} · {seller.legal.vatNumber}
                        </p>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-fg-muted">{c.orders}</dt>
                        <dd className="text-right tabular-nums">{formatNumber(row.orders)}</dd>
                        <dt className="text-fg-muted">{c.units}</dt>
                        <dd className="text-right tabular-nums">{formatNumber(row.units)}</dd>
                        <dt className="text-fg-muted">{c.gross}</dt>
                        <dd className="text-right tabular-nums">{formatCurrency(row.gross)}</dd>
                        <dt className="text-fg-muted">
                          {c.commission} ({Math.round(seller.commissionRate * 100)}%)
                        </dt>
                        <dd className="text-right tabular-nums">
                          −{formatCurrency(row.commission)}
                        </dd>
                        <dt className="font-medium text-fg">{c.net}</dt>
                        <dd className="text-right font-semibold tabular-nums">
                          {formatCurrency(row.net)}
                        </dd>
                      </dl>
                      <CommissionForm key={seller.commissionRate} seller={seller} />
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm">
              <p className="font-medium text-fg">
                {t.total}: {formatCurrency(total.gross)} · {c.commission}{" "}
                {formatCurrency(total.commission)} · {c.net} {formatCurrency(total.net)}
              </p>
              <p className="text-[13px] text-fg-muted">{t.note}</p>
            </CardContent>
          </Card>
        </>
      )}
    </Page>
  );
}

function CommissionForm({ seller }: { seller: Seller }) {
  const update = useDataStore((state) => state.updateSellerCommission);
  const [value, setValue] = useState(String(Math.round(seller.commissionRate * 100)));
  const [error, setError] = useState(false);
  const id = `commissione-${seller.id}`;
  return (
    <form
      noValidate
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const n = Number.parseInt(value, 10);
        if (!/^\d+$/.test(value) || n > 50) {
          setError(true);
          return;
        }
        update(seller.id, n / 100);
        toast.success(t.commissionSaved, { description: seller.name });
      }}
    >
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {t.commissionLabel(seller.name)}
        </label>
        <Input
          id={id}
          value={value}
          inputMode="numeric"
          aria-invalid={error || undefined}
          aria-describedby={error ? `${id}-errore` : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
        />
        {error ? (
          <p id={`${id}-errore`} className="text-[13px] text-danger">
            {copy.validation.number(0, 50)}
          </p>
        ) : null}
      </div>
      <Button type="submit" variant="secondary">
        {copy.common.save}
      </Button>
    </form>
  );
}
