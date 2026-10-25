import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { copy } from "@/content/it";
import { cn } from "@/lib/utils";

/** Primitive per tabelle dati: intestazioni ordinabili accessibili (aria-sort). */
export function Table({
  className,
  scrollLabel,
  ...props
}: ComponentProps<"table"> & {
  /** Per tabelle larghe che scorrono senza elementi interattivi: rende l'area raggiungibile da tastiera. */
  scrollLabel?: string;
}) {
  return (
    <div
      className="relative w-full overflow-x-auto"
      {...(scrollLabel ? { tabIndex: 0, role: "region", "aria-label": scrollLabel } : {})}
    >
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-b border-line", className)} {...props} />;
}

export function TBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TR({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors", className)} {...props} />;
}

export function TH({
  className,
  align = "left",
  ...props
}: ComponentProps<"th"> & { align?: "left" | "right" }) {
  return (
    <th
      scope="col"
      className={cn(
        "h-10 px-3 text-xs font-medium whitespace-nowrap text-fg-muted first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  align = "left",
  ...props
}: ComponentProps<"td"> & { align?: "left" | "right" }) {
  return (
    <td
      className={cn(
        "h-14 px-3 align-middle first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6",
        align === "right" && "text-right tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

export type SortDirection = "asc" | "desc";

/** Intestazione ordinabile: pulsante + aria-sort sulla cella. */
export function SortableTH<K extends string>({
  label,
  sortKey,
  current,
  direction,
  onSort,
  align = "left",
  className,
}: {
  label: ReactNode;
  sortKey: K;
  current: K;
  direction: SortDirection;
  onSort: (key: K) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = current === sortKey;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <TH
      align={align}
      className={className}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "-mx-1.5 inline-flex h-7 items-center gap-1 rounded px-1.5 hover:bg-surface-2 hover:text-fg",
          active && "text-fg",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon aria-hidden className={cn("size-3.5", !active && "opacity-50")} />
        <span className="sr-only">
          {typeof label === "string" ? copy.a11y.sortBy(label) : null}
        </span>
      </button>
    </TH>
  );
}
