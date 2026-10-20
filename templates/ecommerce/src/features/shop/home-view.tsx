"use client";

import { ArrowRight, HandHeart, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useCatalog, useToday } from "@/hooks/use-catalog";
import { productStock } from "@/lib/domain/inventory";
import { priceInfo } from "@/lib/domain/pricing";
import { formatCurrency } from "@/lib/format";
import { ProductArt } from "@/components/product/product-art";
import { ProductCard } from "@/components/product/product-card";
import { Container, SectionHeading } from "@/components/site/section";
import { buttonClasses } from "@/components/ui/button";

const h = copy.home;

export function HomeView() {
  const { products, categories, sellers, reviews, settings } = useCatalog();
  const today = useToday();
  const sellerById = new Map(sellers.map((s) => [s.id, s]));
  const active = products.filter((p) => p.active);
  const featured = active.filter((p) => p.featured && productStock(p) > 0).slice(0, 8);
  const offers = active.filter((p) => priceInfo(p, today).onSale).slice(0, 4);
  const showcase = (id: string) => products.find((p) => p.id === id);
  const hero = [showcase("vaso-colle"), showcase("tazza-alba"), showcase("canovaccio-righe")];
  const values = [
    {
      icon: Truck,
      title: h.values.shipping,
      text: h.values.shippingText(formatCurrency(settings.shipping.freeThreshold, { round: true })),
    },
    { icon: RotateCcw, title: h.values.returns, text: h.values.returnsText(settings.returnDays) },
    { icon: ShieldCheck, title: h.values.payments, text: h.values.paymentsText },
    { icon: HandHeart, title: h.values.handmade, text: h.values.handmadeText },
  ];

  return (
    <>
      <section className="border-b border-line">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-sm font-medium text-accent-text">{h.eyebrow}</p>
            <h1 className="mt-3 font-display text-5xl leading-[1.05] font-medium tracking-tight text-balance text-fg sm:text-6xl">
              {h.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-fg-muted">{h.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={routes.shop} className={buttonClasses({ size: "lg" })}>
                {h.primary}
              </Link>
              <Link href={routes.sellers} className={buttonClasses({ variant: "secondary", size: "lg" })}>
                {h.secondary}
              </Link>
            </div>
          </div>
          <div aria-hidden className="grid grid-cols-2 gap-3 sm:gap-4">
            {hero.map((product, i) =>
              product ? (
                <div
                  key={product.id}
                  className={
                    i === 0
                      ? "row-span-2 overflow-hidden rounded-2xl bg-surface-2"
                      : "aspect-square overflow-hidden rounded-2xl bg-surface-2"
                  }
                >
                  <ProductArt
                    kind={product.art}
                    color={product.variants[0]?.color ?? "#cccccc"}
                    view={i === 0 ? 2 : 0}
                  />
                </div>
              ) : null,
            )}
          </div>
        </Container>
      </section>

      <section aria-label={h.values.label} className="border-b border-line bg-surface">
        <Container className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-text" />
              <div>
                <h2 className="text-sm font-semibold text-fg">{title}</h2>
                <p className="mt-0.5 text-sm text-fg-muted">{text}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <section aria-labelledby="categorie" className="py-16 sm:py-20">
        <Container>
          <SectionHeading id="categorie" title={h.categories} />
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
            {categories.map((category) => {
              const sample = active.find((p) => p.categoryId === category.id);
              return (
                <li key={category.id}>
                  <Link
                    href={routes.category(category.id)}
                    className="group block rounded-xl focus-visible:outline-offset-4"
                  >
                    <div className="aspect-[4/5] overflow-hidden rounded-xl bg-surface-2">
                      {sample ? (
                        <ProductArt
                          kind={sample.art}
                          color={sample.variants[0]?.color ?? "#cccccc"}
                          view={1}
                          className="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                        />
                      ) : null}
                    </div>
                    <p className="mt-3 text-[15px] font-medium text-fg group-hover:underline">
                      {category.name}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="scelti" className="border-t border-line py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="scelti"
            title={h.featured}
            description={h.featuredText}
            action={
              <Link href={routes.shop} className={buttonClasses({ variant: "ghost" })}>
                {h.viewAll}
                <ArrowRight aria-hidden />
              </Link>
            }
          />
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                seller={sellerById.get(product.sellerId)}
                reviews={reviews}
                today={today}
              />
            ))}
          </div>
        </Container>
      </section>

      {offers.length > 0 ? (
        <section aria-labelledby="offerte" className="border-t border-line bg-surface py-16 sm:py-20">
          <Container>
            <SectionHeading
              id="offerte"
              title={h.offers}
              description={h.offersText}
              action={
                <Link href={routes.offers} className={buttonClasses({ variant: "ghost" })}>
                  {h.viewAll}
                  <ArrowRight aria-hidden />
                </Link>
              }
            />
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {offers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  seller={sellerById.get(product.sellerId)}
                  reviews={reviews}
                  today={today}
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section aria-labelledby="laboratori" className="border-t border-line py-16 sm:py-20">
        <Container>
          <SectionHeading id="laboratori" title={h.sellers} description={h.sellersText} />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {sellers
              .filter((s) => s.active)
              .map((seller) => {
                const sample = active.find((p) => p.sellerId === seller.id);
                return (
                  <li key={seller.id}>
                    <Link
                      href={routes.seller(seller.slug)}
                      className="flex h-full items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong/50 lg:flex-col lg:items-start"
                    >
                      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        {sample ? (
                          <ProductArt kind={sample.art} color={sample.variants[0]?.color ?? "#ccc"} />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-[15px] font-medium text-fg">{seller.name}</p>
                        <p className="text-[13px] text-fg-muted">
                          {seller.craft} · {seller.city}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </Container>
      </section>
    </>
  );
}
