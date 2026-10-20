import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Misuratore 0–100%: la traccia è un tono più chiaro dello stesso colore.
 * Il colore della barra passa ad avviso oltre la soglia indicata.
 */
export function Meter({
  value,
  label,
  valueText,
  warnAbove = 0.9,
  className,
}: {
  value: number;
  label: string;
  valueText?: string;
  warnAbove?: number;
  className?: string;
}) {
  const clamped = Math.min(1, Math.max(0, value));
  const warn = clamped >= warnAbove;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuetext={valueText ?? formatPercent(clamped, 0)}
      className={cn(
        "h-2 overflow-hidden rounded-full",
        warn ? "bg-warning-soft" : "bg-accent-soft",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          warn ? "bg-warning" : "bg-accent",
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
