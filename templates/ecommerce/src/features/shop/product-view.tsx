"use client";

import { BadgeCheck, ChevronRight, PackageX, RotateCcw, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useCatalog, useToday } from "@/hooks/use-catalog";
import { ratingSummary, relatedProducts } from "@/lib/domain/catalog";
import { parseISODate } from "@/lib/domain/dates";
import { priceInfo } from "@/lib/domain/pricing";
import type { Product, Review, Variant } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useUiStore } from "@/store/ui-store";
import { Price } from "@/components/product/price";
import { ART_VIEWS, ProductArt } from "@/components/product/product-art";
import { ProductCard } from "@/components/product/product-card";
import { RatingInline, Stars } from "@/components/product/rating";
import { StockNote } from "@/components/product/stock-badge";
import { QuantityInput } from "@/components/shop/quantity-input";
import { Container } from "@/components/site/section";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";

const p = copy.product;
const VIEW_NAMES = ["vista intera", "dettaglio", "ambientato"];

export function ProductView({ slug }: { slug: string }) {
  const { products, sellers, categories, reviews, settings, ready } = useCatalog();
  const today = useToday();
  const product = products.find((item) => item.slug === slug && item.active);

  if (!product) {
    return (
      <Container className="py-20">
        {ready ? (
          <EmptyState
            icon={PackageX}
            title={p.unavailable}
            action={
              <Link href={routes.shop} className={buttonClasses({})}>
                {copy.site.cta}
              </Link>
            }
          />
        ) : (
          <div className="min-h-[50vh]" aria-busy="true" />
        )}
      </Container>
    );
  }

  const seller = sellers.find((s) => s.id === product.sellerId);
  const category = categories.find((c) => c.id === product.categoryId);
  const own = reviews.filter((r) => r.productId === product.id);
  const related = relatedProducts(product, products);

  return (
    <Container className="animate-page-in py-6 sm:py-10">
      <nav aria-label={copy.a11y.breadcrumb}>
        <ol className="flex flex-wrap items-center gap-1 text-[13px] text-fg-muted">
          <li>
            <Link href={routes.shop} className="hover:text-fg hover:underline">
              {copy.catalog.title}
            </Link>
          </li>
          {category ? (
            <li className="flex items-center gap-1">
              <ChevronRight aria-hidden className="size-3.5" />
              <Link href={routes.category(category.id)} className="hover:text-fg hover:underline">
                {category.name}
              </Link>
            </li>
          ) : null}
          <li className="flex items-center gap-1">
            <ChevronRight aria-hidden className="size-3.5" />
            <span aria-current="page" className="text-fg">
              {product.name}
            </span>
          </li>
        </ol>
      </nav>

      {/* key: cambiando prodotto (correlati) si azzerano variante, quantità e immagine */}
      <ProductMain key={product.id} product={product} reviews={own} today={today} />

      <div className="mt-16 grid gap-12 border-t border-line pt-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="dettagli">
          <h2 id="dettagli" className="font-display text-2xl font-medium text-fg">
            {p.details}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-fg">{product.description}</p>
          <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-fg-muted marker:text-fg-subtle">
            {product.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <h3 className="mt-8 text-sm font-semibold text-fg">{p.shippingTitle}</h3>
          <ul className="mt-3 space-y-2 text-sm text-fg-muted">
            <li className="flex gap-2">
              <Truck aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
              {p.shipping(
                formatCurrency(settings.shipping.standard),
                formatCurrency(settings.shipping.freeThreshold, { round: true }),
              )}
            </li>
            <li className="flex gap-2">
              <RotateCcw aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
              <span>
                {p.returns(settings.returnDays)}{" "}
                <Link
                  href={routes.withdrawal}
                  className="text-accent-text underline underline-offset-2"
                >
                  {copy.site.footer.withdrawal}
                </Link>
              </span>
            </li>
          </ul>
        </section>

        {seller ? (
          <section
            aria-labelledby="venditore"
            className="h-fit rounded-2xl border border-line bg-surface p-6"
          >
            <p className="text-[13px] text-fg-muted">{p.soldBy}</p>
            <h2 id="venditore" className="mt-1 font-display text-2xl font-medium text-fg">
              {seller.name}
            </h2>
            <p className="text-sm text-fg-muted">
              {seller.craft} · {seller.city} · {copy.sellers.since(seller.since)}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-fg">{seller.bio}</p>
            <p className="mt-3 text-xs text-fg-muted">{copy.sellers.trader}</p>
            <Link
              href={routes.seller(seller.slug)}
              className={buttonClasses({ variant: "secondary", className: "mt-4" })}
            >
              {p.sellerPage}
            </Link>
          </section>
        ) : null}
      </div>

      <Reviews reviews={own} />

      {related.length > 0 ? (
        <section aria-labelledby="correlati" className="mt-16 border-t border-line pt-12">
          <h2 id="correlati" className="font-display text-2xl font-medium text-fg">
            {p.related}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                seller={sellers.find((s) => s.id === item.sellerId)}
                reviews={reviews}
                today={today}
              />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}

function ProductMain({
  product,
  reviews,
  today,
}: {
  product: Product;
  reviews: Review[];
  today: string;
}) {
  const { sellers, settings } = useCatalog();
  const seller = sellers.find((s) => s.id === product.sellerId);
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [view, setView] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const variant = product.variants.find((v) => v.id === variantId) ?? firstAvailable;
  const inCart = useCartStore(
    (state) =>
      state.lines.find((l) => l.productId === product.id && l.variantId === variant?.id)
        ?.quantity ?? 0,
  );
  const add = useCartStore((state) => state.add);
  const openCart = useUiStore((state) => state.setCartOpen);
  const rating = ratingSummary(reviews, product.id);
  const info = priceInfo(product, today);
  if (!variant) return null;
  const available = Math.max(0, variant.stock - inCart);
  const alt = (i: number) => `${product.name}, ${variant.name}, ${VIEW_NAMES[i]}`;

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-surface-2">
          <ProductArt kind={product.art} color={variant.color} view={view} label={alt(view)} />
        </div>
        <div role="group" aria-label={copy.a11y.gallery} className="mt-3 grid grid-cols-3 gap-3">
          {Array.from({ length: ART_VIEWS }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={copy.a11y.showImage(i + 1, ART_VIEWS)}
              aria-pressed={view === i}
              onClick={() => setView(i)}
              className={cn(
                "aspect-square overflow-hidden rounded-xl border-2 bg-surface-2 transition-colors",
                view === i ? "border-accent" : "border-transparent hover:border-line-strong/50",
              )}
            >
              <ProductArt kind={product.art} color={variant.color} view={i} />
            </button>
          ))}
        </div>
      </div>

      <div className="lg:pt-2">
        {seller ? (
          <Link
            href={routes.seller(seller.slug)}
            className="text-sm text-fg-muted hover:text-fg hover:underline"
          >
            {seller.name}
          </Link>
        ) : null}
        <h1 className="mt-1 font-display text-4xl font-medium tracking-tight text-balance text-fg sm:text-5xl">
          {product.name}
        </h1>
        {rating.count > 0 ? (
          <a href="#recensioni" className="mt-3 inline-block rounded-sm hover:underline">
            <RatingInline average={rating.average} count={rating.count} className="text-sm" />
          </a>
        ) : null}
        <Price product={product} today={today} size="lg" className="mt-5" />
        <p className="mt-1 text-xs text-fg-muted">
          {p.vatIncluded}
          {info.onSale && product.sale
            ? ` · ${p.saleUntil(formatDate(parseISODate(product.sale.to), "dayMonthLong"))}`
            : ""}
        </p>
        <p className="mt-5 text-[15px] leading-relaxed text-fg">{product.shortDescription}</p>

        <VariantPicker
          variants={product.variants}
          value={variant.id}
          onChange={(id) => {
            setVariantId(id);
            setQuantity(1);
          }}
        />

        <StockNote stock={variant.stock} threshold={settings.lowStockThreshold} className="mt-5" />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <QuantityInput
            value={Math.min(quantity, Math.max(1, available))}
            max={Math.max(1, available)}
            onChange={setQuantity}
          />
          <Button
            size="lg"
            className="flex-1 sm:flex-none"
            disabled={variant.stock === 0}
            onClick={() => {
              const added = add(
                { productId: product.id, variantId: variant.id, quantity },
                variant.stock,
              );
              if (added === 0) {
                toast.info(p.maxReached);
                return;
              }
              setQuantity(1);
              openCart(true);
            }}
          >
            {variant.stock === 0 ? p.out : p.addToCart}
          </Button>
        </div>
        {inCart > 0 && variant.stock > 0 && available === 0 ? (
          <p className="mt-2 text-[13px] text-fg-muted">{p.maxReached}</p>
        ) : null}
        <p className="mt-5 text-[13px] text-fg-muted">{p.handmade}</p>
      </div>
    </div>
  );
}

function VariantPicker({
  variants,
  value,
  onChange,
}: {
  variants: Variant[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = variants.find((v) => v.id === value);
  if (variants.length <= 1) {
    return selected ? (
      <p className="mt-6 text-sm text-fg">
        <span className="text-fg-muted">{p.variant}: </span>
        {selected.name}
      </p>
    ) : null;
  }
  return (
    <fieldset className="mt-6">
      <legend className="text-sm text-fg">
        <span className="text-fg-muted">{p.variant}: </span>
        <span className="font-medium">{selected?.name}</span>
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {variants.map((variant) => (
          <label
            key={variant.id}
            className={cn(
              "relative flex cursor-pointer items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
              variant.id === value
                ? "border-fg bg-surface text-fg"
                : "border-line bg-surface text-fg-muted hover:border-line-strong",
            )}
          >
            <input
              type="radio"
              name="variante"
              value={variant.id}
              checked={variant.id === value}
              onChange={() => onChange(variant.id)}
              className="sr-only"
            />
            <span
              aria-hidden
              className="size-6 rounded-full border border-black/10"
              style={{ backgroundColor: variant.color }}
            />
            {variant.name}
            {variant.stock === 0 ? <span className="text-xs">({p.outVariant})</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Reviews({ reviews }: { reviews: Review[] }) {
  const summary = ratingSummary(reviews, reviews[0]?.productId ?? "");
  return (
    <section aria-labelledby="recensioni" className="mt-16 border-t border-line pt-12">
      <h2 id="recensioni" className="scroll-mt-24 font-display text-2xl font-medium text-fg">
        {p.reviews}
      </h2>
      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-fg-muted">{p.noReviews}</p>
      ) : (
        <div className="mt-6 grid gap-10 lg:grid-cols-[260px_1fr]">
          <div>
            <p className="font-display text-5xl font-medium text-fg tabular-nums">
              {String(summary.average).replace(".", ",")}
            </p>
            <Stars value={summary.average} size="md" className="mt-2" />
            <p className="mt-1 text-sm text-fg-muted">
              <span className="sr-only">{copy.a11y.rating(summary.average, summary.count)}</span>
              <span aria-hidden>{copy.common.reviews(summary.count)}</span>
            </p>
            <dl className="mt-5 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const n = summary.distribution[stars - 1] ?? 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-[13px]">
                    <dt className="w-14 text-fg-muted">{copy.a11y.stars(stars)}</dt>
                    <dd className="flex flex-1 items-center gap-2">
                      <span
                        aria-hidden
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3"
                      >
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${(n / summary.count) * 100}%` }}
                        />
                      </span>
                      <span className="w-5 text-right text-fg-muted tabular-nums">{n}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-5 text-xs leading-relaxed text-fg-muted">{p.reviewsNote}</p>
          </div>
          <ul className="divide-y divide-line">
            {reviews.map((review) => (
              <li key={review.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={review.rating} />
                  <span className="sr-only">{copy.a11y.stars(review.rating)}</span>
                  <h3 className="text-sm font-semibold text-fg">{review.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fg">{review.body}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
                  <span>
                    {review.author} · {formatDate(parseISODate(review.date), "short")}
                  </span>
                  {review.verified ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <BadgeCheck aria-hidden className="size-3.5" />
                      {p.verified}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
