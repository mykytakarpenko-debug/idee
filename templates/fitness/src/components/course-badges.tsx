import type { CSSProperties } from "react";
import { copy } from "@/content/it";
import { COURSE_CATEGORIES, type CourseCategory, type Intensity } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/** Colore identità della categoria (--series-1…4, ordine fisso). */
export function categoryColor(category: CourseCategory): string {
  return `var(--series-${COURSE_CATEGORIES.indexOf(category) + 1})`;
}

/** Categoria: pallino colorato + testo (il colore non è mai l'unica informazione). */
export function CategoryLabel({
  category,
  className,
}: {
  category: CourseCategory;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: categoryColor(category) } as CSSProperties}
      />
      {copy.categories[category]}
    </span>
  );
}

/** Intensità: tre barre + testo. */
export function IntensityMeter({ value, className }: { value: Intensity; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-fg-muted", className)}>
      <span aria-hidden className="flex items-end gap-0.5">
        {[1, 2, 3].map((level) => (
          <span
            key={level}
            className={cn("w-1 rounded-sm", level <= value ? "bg-fg" : "bg-line-strong/40")}
            style={{ height: `${4 + level * 3}px` }}
          />
        ))}
      </span>
      {copy.intensity[value]}
    </span>
  );
}
