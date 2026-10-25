"use client";

import { Store } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useCatalog, useToday } from "@/hooks/use-catalog";
import { ProductArt } from "@/components/product/product-art";
import { ProductCard } from "@/components/product/product-card";
import { Container, SectionHeading } from "@/components/site/section";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const s = copy.sellers;

export function SellersView() {
  const { sellers, products } = useCatalog();
  return (
    <Container className="animate-page-in py-10 sm:py-14">
      <SectionHeading as="h1" title={s.title} description={s.description} />
      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        {sellers
          .filter((seller) => seller.active)
          .map((seller) => {
            const own = products.filter((p) => p.sellerId === seller.id && p.active);
            return (
              <li key={seller.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface sm:flex-row">
                  <div className="grid aspect-[2/1] grid-cols-2 bg-surface-2 sm:aspect-auto sm:w-48 sm:grid-cols-1">
                    {own.slice(0, 2).map((product) => (
                      <ProductArt
                        key={product.id}
                        kind={product.art}
                        color={product.variants[0]?.color ?? "#ccc"}
                      />
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-2xl font-medium text-fg">{seller.name}</h2>
                    <p className="text-sm text-fg-muted">
                      {seller.craft} · {seller.city} · {s.since(seller.since)}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fg">
                      {seller.bio}
                    </p>
                    <Link
                      href={routes.seller(seller.slug)}
                      className={buttonClasses({
                        variant: "secondary",
                        className: "mt-auto self-start",
                      })}
                    >
                      {copy.product.sellerPage}
                      <span className="sr-only">: {seller.name}</span>
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
      </ul>
    </Container>
  );
}

export function SellerView({ slug }: { slug: string }) {
  const { sellers, products, reviews, ready } = useCatalog();
  const today = useToday();
  const seller = sellers.find((item) => item.slug === slug);
  if (!seller) {
    return (
      <Container className="py-20">
        {ready ? (
          <EmptyState
            icon={Store}
            title={copy.errors.notFoundTitle}
            action={
              <Link href={routes.sellers} className={buttonClasses({})}>
                {s.title}
              </Link>
            }
          />
        ) : (
          <div className="min-h-[50vh]" aria-busy="true" />
        )}
      </Container>
    );
  }
  const own = products.filter((p) => p.sellerId === seller.id && p.active);
  return (
    <Container className="animate-page-in py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="text-sm font-medium text-accent-text">
            {seller.craft} · {seller.city}
          </p>
          <h1 className="mt-2 font-display text-5xl font-medium tracking-tight text-fg">
            {seller.name}
          </h1>
          <p className="mt-2 text-sm text-fg-muted">{s.since(seller.since)}</p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg">{seller.bio}</p>
        </div>
        <section
          aria-labelledby="dati-venditore"
          className="h-fit rounded-2xl border border-line bg-surface p-6 text-sm"
        >
          <h2 id="dati-venditore" className="font-semibold text-fg">
            {s.legalTitle}
          </h2>
          <dl className="mt-3 space-y-2">
            <div>
              <dt className="sr-only">{s.legalTitle}</dt>
              <dd className="text-fg">{seller.legal.company}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-fg-muted">{s.vat}</dt>
              <dd className="text-fg tabular-nums">{seller.legal.vatNumber}</dd>
            </div>
            <div>
              <dt className="sr-only">{copy.checkout.address}</dt>
              <dd className="text-fg">{seller.legal.address}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-fg-muted">{s.contact}</dt>
              <dd>
                <a
                  href={`mailto:${seller.legal.email}`}
                  className="text-accent-text hover:underline"
                >
                  {seller.legal.email}
                </a>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-fg-muted">{s.trader}</p>
          <p className="mt-2 text-xs leading-relaxed text-fg-muted">{s.commissionNote}</p>
        </section>
      </div>

      <section aria-labelledby="prodotti-venditore" className="mt-14 border-t border-line pt-10">
        <h2 id="prodotti-venditore" className="font-display text-2xl font-medium text-fg">
          {s.products} <span className="text-lg text-fg-muted">({own.length})</span>
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {own.map((product) => (
            <ProductCard key={product.id} product={product} reviews={reviews} today={today} />
          ))}
        </div>
      </section>
    </Container>
  );
}
