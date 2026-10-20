import type { CSSProperties } from "react";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Slot della palette categoriale (--series-1 … --series-8 in globals.css). */
export type ColorSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const sizes = { sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-14 text-base" };

/**
 * Avatar con iniziali. Neutro per i clienti; per lo staff un anello nel colore
 * identità (il colore non porta mai significato da solo: c'è sempre il nome).
 */
export function Avatar({
  name,
  size = "md",
  color,
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  color?: ColorSlot;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-semibold text-fg-muted select-none",
        color && "ring-2 ring-offset-2 ring-offset-surface",
        sizes[size],
        className,
      )}
      style={color ? ({ "--tw-ring-color": `var(--series-${color})` } as CSSProperties) : undefined}
    >
      {initials(name)}
    </span>
  );
}

/** Pallino del colore identità (staff in calendario e legende). */
export function ColorDot({ color, className }: { color: ColorSlot; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: `var(--series-${color})` }}
    />
  );
}
