"use client";

import { Minus, Plus } from "lucide-react";
import { copy } from "@/content/it";
import { cn } from "@/lib/utils";

/** Selettore di quantità: pulsanti − / + e campo numerico modificabile. */
export function QuantityInput({
  value,
  max,
  onChange,
  label = copy.common.quantity,
  size = "md",
  className,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const clamp = (n: number) => Math.max(1, Math.min(Math.max(1, max), n));
  const button = cn(
    "inline-flex items-center justify-center text-fg-muted transition-colors hover:text-fg disabled:opacity-40 disabled:hover:text-fg-muted",
    size === "sm" ? "size-8" : "size-10",
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-lg border border-line-strong bg-surface",
        className,
      )}
    >
      <button
        type="button"
        className={button}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
        aria-label={copy.common.decrease}
      >
        <Minus aria-hidden className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={Math.max(1, max)}
        value={value}
        aria-label={label}
        onChange={(event) => {
          const n = Number.parseInt(event.target.value, 10);
          if (Number.isFinite(n)) onChange(clamp(n));
        }}
        className={cn(
          "w-10 [appearance:textfield] bg-transparent text-center text-sm font-medium text-fg tabular-nums outline-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          size === "sm" ? "h-8" : "h-10",
        )}
      />
      <button
        type="button"
        className={button}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={copy.common.increase}
      >
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}
