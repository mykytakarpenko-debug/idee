"use client";

import { Package, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { normalize } from "@/lib/domain/catalog";
import { toISODate } from "@/lib/domain/dates";
import { productStock, stockLevel } from "@/lib/domain/inventory";
import { isSaleActive, priceInfo } from "@/lib/domain/pricing";
import type { Product, Seller } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { openDialog } from "@/store/ui-store";
import { ProductArt } from "@/components/product/product-art";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const t = copy.productsPanel;

export function ProductsView() {
  const ready = useDataReady();
  const now = useNow();
  const { products, sellers, settings } = useData((state) => ({
    products: state.products,
    sellers: state.sellers,
    settings: state.settings,
  }));
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = normalize(query);
    return products
      .filter(
        (p) => !q || normalize(`${p.name} ${p.variants.map((v) => v.sku).join(" ")}`).includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "it"));
  }, [products, query]);
  const today = now ? toISODate(now) : null;

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button onClick={() => openDialog({ type: "product" })}>
            <Plus aria-hidden />
            {t.newProduct}
          </Button>
        }
      />
      <Toolbar>
        <SearchInput
          label={t.search}
          placeholder={t.search}
          value={query}
          onValueChange={setQuery}
          className="sm:max-w-xs"
        />
      </Toolbar>
      <Card>
        {!ready || !today ? (
          <div className="space-y-2 p-5" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title={t.empty} />
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {filtered.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => openDialog({ type: "product", id: product.id })}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-2"
                  >
                    <Thumb product={product} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">
                        {product.name}
                      </span>
                      <span className="block text-[13px] text-fg-muted">
                        {formatCurrency(priceInfo(product, today).price)} ·{" "}
                        <StockText product={product} threshold={settings.lowStockThreshold} />
                      </span>
                    </span>
                    <StatusBadges product={product} today={today} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <ProductsTable
                products={filtered}
                sellers={sellers}
                today={today}
                threshold={settings.lowStockThreshold}
              />
            </div>
          </>
        )}
      </Card>
    </Page>
  );
}

function Thumb({ product }: { product: Product }) {
  return (
    <span className="size-11 shrink-0 overflow-hidden rounded-md bg-surface-2">
      <ProductArt kind={product.art} color={product.variants[0]?.color ?? "#cccccc"} />
    </span>
  );
}

function StockText({ product, threshold }: { product: Product; threshold: number }) {
  const stock = productStock(product);
  const outVariants = product.variants.filter((v) => v.stock === 0).length;
  const level = stockLevel(stock, threshold);
  return (
    <span
      className={level === "out" ? "text-danger" : level === "low" ? "text-warning" : undefined}
    >
      {stock === 0 ? copy.product.out : copy.common.items(stock)}
      {stock > 0 && outVariants > 0 ? ` · ${outVariants} ${copy.product.outVariant}` : ""}
    </span>
  );
}

function StatusBadges({
  product,
  today,
  className = "justify-end",
}: {
  product: Product;
  today: string;
  className?: string;
}) {
  const info = priceInfo(product, today);
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      {product.active ? <Badge tone="success">{t.active}</Badge> : <Badge>{t.inactive}</Badge>}
      {info.onSale ? (
        <Badge tone="accent">{t.onSale(info.percent)}</Badge>
      ) : isSaleActive(product, today) ? (
        <Badge tone="warning">{t.saleNotAnnounced}</Badge>
      ) : null}
    </span>
  );
}

function ProductsTable({
  products,
  sellers,
  today,
  threshold,
}: {
  products: Product[];
  sellers: Seller[];
  today: string;
  threshold: number;
}) {
  const c = t.columns;
  return (
    <Table>
      <THead>
        <TR>
          <TH>{c.product}</TH>
          <TH>{c.seller}</TH>
          <TH align="right">{c.price}</TH>
          <TH align="right">{c.stock}</TH>
          <TH>{c.status}</TH>
        </TR>
      </THead>
      <TBody>
        {products.map((product) => (
          <TR key={product.id}>
            <TD>
              <span className="flex items-center gap-3">
                <Thumb product={product} />
                <button
                  type="button"
                  onClick={() => openDialog({ type: "product", id: product.id })}
                  className="text-left font-medium text-fg hover:underline"
                >
                  {product.name}
                </button>
              </span>
            </TD>
            <TD className="text-fg-muted">
              {sellers.find((s) => s.id === product.sellerId)?.name}
            </TD>
            <TD align="right">{formatCurrency(priceInfo(product, today).price)}</TD>
            <TD align="right">
              <StockText product={product} threshold={threshold} />
            </TD>
            <TD>
              <StatusBadges product={product} today={today} className="justify-start" />
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
