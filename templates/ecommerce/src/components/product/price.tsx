import { copy } from "@/content/it";
import { priceInfo } from "@/lib/domain/pricing";
import type { Product } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const p = copy.product;

/**
 * Prezzo con eventuale promozione. Lo sconto è calcolato sul prezzo più basso
 * dei 30 giorni precedenti (regola Omnibus), che è sempre indicato in chiaro.
 */
export function Price({
  product,
  today,
  size = "md",
  className,
}: {
  product: Pick<Product, "price" | "sale" | "priceHistory">;
  today: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const info = priceInfo(product, today);
  return (
    <div className={className}>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={cn(
            "font-semibold tabular-nums",
            info.onSale ? "text-accent-text" : "text-fg",
            size === "lg" ? "text-3xl" : size === "md" ? "text-lg" : "text-[15px]",
          )}
        >
          {formatCurrency(info.price)}
        </span>
        {info.onSale && info.reference !== null ? (
          <>
            <s className="text-sm text-fg-muted tabular-nums">
              <span className="sr-only">{p.omnibus(formatCurrency(info.reference))}</span>
              <span aria-hidden>{formatCurrency(info.reference)}</span>
            </s>
            <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent-soft-fg">
              {p.percent(info.percent)}
            </span>
          </>
        ) : null}
      </p>
      {info.onSale && info.reference !== null && size !== "sm" ? (
        <p className="mt-1 text-xs text-fg-muted" aria-hidden>
          {p.omnibus(formatCurrency(info.reference))}
        </p>
      ) : null}
    </div>
  );
}
