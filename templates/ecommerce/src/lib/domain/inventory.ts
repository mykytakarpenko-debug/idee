import type { CartLine } from "./cart";
import type { Product, Variant } from "./types";

/** Disponibilità e scorte. Funzioni pure, testate. */

export type StockLevel = "in_stock" | "low" | "out";

export function stockLevel(stock: number, lowThreshold: number): StockLevel {
  if (stock <= 0) return "out";
  if (stock <= lowThreshold) return "low";
  return "in_stock";
}

export function productStock(product: Pick<Product, "variants">): number {
  return product.variants.reduce((acc, v) => acc + Math.max(0, v.stock), 0);
}

export function findVariant(
  products: readonly Product[],
  productId: string,
  variantId: string,
): { product: Product; variant: Variant } | null {
  const product = products.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.id === variantId);
  return product && variant ? { product, variant } : null;
}

export interface StockIssue {
  productId: string;
  variantId: string;
  requested: number;
  available: number;
}

/** Righe che superano la disponibilità attuale (da ricontrollare alla conferma). */
export function stockIssues(lines: readonly CartLine[], products: readonly Product[]): StockIssue[] {
  const issues: StockIssue[] = [];
  for (const line of lines) {
    const found = findVariant(products, line.productId, line.variantId);
    const available = found && found.product.active ? Math.max(0, found.variant.stock) : 0;
    if (line.quantity > available) {
      issues.push({ ...line, requested: line.quantity, available });
    }
  }
  return issues;
}

/** Scala (o ripristina, con sign = 1) le scorte per le righe indicate. */
export function adjustStock(
  products: readonly Product[],
  lines: readonly Pick<CartLine, "productId" | "variantId" | "quantity">[],
  sign: -1 | 1 = -1,
): Product[] {
  return products.map((product) => {
    const own = lines.filter((l) => l.productId === product.id);
    if (own.length === 0) return product;
    return {
      ...product,
      variants: product.variants.map((variant) => {
        const qty = own
          .filter((l) => l.variantId === variant.id)
          .reduce((acc, l) => acc + l.quantity, 0);
        return qty === 0 ? variant : { ...variant, stock: Math.max(0, variant.stock + sign * qty) };
      }),
    };
  });
}

/** Varianti sotto la soglia di scorta (esaurite comprese), per il pannello. */
export function lowStockVariants(
  products: readonly Product[],
  threshold: number,
): { product: Product; variant: Variant }[] {
  return products
    .filter((p) => p.active)
    .flatMap((product) =>
      product.variants
        .filter((variant) => variant.stock <= threshold)
        .map((variant) => ({ product, variant })),
    )
    .sort((a, b) => a.variant.stock - b.variant.stock);
}
