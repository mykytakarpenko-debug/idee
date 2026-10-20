import { CircleCheck, CircleSlash, TriangleAlert } from "lucide-react";
import { copy } from "@/content/it";
import { stockLevel } from "@/lib/domain/inventory";
import { cn } from "@/lib/utils";

/** Disponibilità: icona + testo, aggiornata quando cambia la variante. */
export function StockNote({
  stock,
  threshold,
  className,
}: {
  stock: number;
  threshold: number;
  className?: string;
}) {
  const level = stockLevel(stock, threshold);
  const Icon = level === "out" ? CircleSlash : level === "low" ? TriangleAlert : CircleCheck;
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium",
        level === "out" ? "text-fg-muted" : level === "low" ? "text-warning" : "text-success",
        className,
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {level === "out"
        ? copy.product.out
        : level === "low"
          ? copy.product.low(stock)
          : copy.product.inStock}
    </p>
  );
}
