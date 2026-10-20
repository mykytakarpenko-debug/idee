import { Star } from "lucide-react";
import { copy } from "@/content/it";
import { cn } from "@/lib/utils";

/** Stelle di valutazione: il valore è nel testo accessibile, le icone sono decorative. */
export function Stars({
  value,
  className,
  size = "sm",
}: {
  value: number;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-block">
            <Star className={cn("text-line-strong", size === "md" ? "size-[18px]" : "size-3.5")} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star
                className={cn(
                  "fill-accent text-accent",
                  size === "md" ? "size-[18px]" : "size-3.5",
                )}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingInline({
  average,
  count,
  className,
}: {
  average: number;
  count: number;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-fg-muted", className)}>
      <Stars value={average} />
      <span className="sr-only">{copy.a11y.rating(average, count)}</span>
      <span aria-hidden className="tabular-nums">
        {String(average).replace(".", ",")} ({count})
      </span>
    </p>
  );
}
