"use client";

import { Search, X } from "lucide-react";
import type { ComponentProps } from "react";
import { copy } from "@/content/it";
import { cn } from "@/lib/utils";
import { controlClasses } from "./input";

/** Campo di ricerca con icona e pulsante per svuotarlo. */
export function SearchInput({
  value,
  onValueChange,
  className,
  label,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Etichetta accessibile (il placeholder non basta). */
  label: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
      />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          controlClasses,
          "h-10 pr-9 pl-9 text-sm sm:h-9 [&::-webkit-search-cancel-button]:hidden",
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label={copy.common.resetFilters}
          className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
