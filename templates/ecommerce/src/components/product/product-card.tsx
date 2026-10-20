import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { ratingSummary } from "@/lib/domain/catalog";
import { daysBetween } from "@/lib/domain/dates";
import { productStock } from "@/lib/domain/inventory";
import { priceInfo } from "@/lib/domain/pricing";
import type { Product, Review, Seller } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Price } from "./price";
import { ProductArt } from "./product-art";
import { RatingInline } from "./rating";

/** Scheda prodotto per griglie e caroselli. Tutta la scheda è un unico link. */
export function ProductCard({
  product,
  seller,
  reviews,
  today,
  headingLevel = "h3",
  className,
}: {
  product: Product;
  seller?: Seller;
  reviews: readonly Review[];
  today: string;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  const stock = productStock(product);
  const variant = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const rating = ratingSummary(reviews, product.id);
  const isNew = daysBetween(product.createdAt, today) <= 30;
  const onSale = priceInfo(product, today).onSale;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
        {variant ? (
          <ProductArt
            kind={product.art}
            color={variant.color}
            className={cn(
              "transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none",
              stock === 0 && "opacity-60",
            )}
          />
        ) : null}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {stock === 0 ? (
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-fg shadow-xs">
              {copy.product.out}
            </span>
          ) : onSale ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-fg">
              {copy.product.sale}
            </span>
          ) : isNew ? (
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-fg shadow-xs">
              {copy.product.new}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        {seller ? <p className="text-xs text-fg-muted">{seller.name}</p> : null}
        <Heading className="text-[15px] leading-snug font-medium text-fg">
          <Link
            href={routes.product(product.slug)}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-focus"
          >
            {product.name}
          </Link>
        </Heading>
        <RatingInline average={rating.average} count={rating.count} />
        <Price product={product} today={today} size="sm" className="mt-auto pt-1" />
      </div>
    </article>
  );
}
