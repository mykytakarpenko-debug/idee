import { cn } from "@/lib/utils";

export interface BarListItem {
  id: string;
  label: string;
  value: number;
  /** Testo secondario (es. numero di prenotazioni). */
  meta?: string;
}

/**
 * Classifica a barre orizzontali: etichetta, barra e valore sempre visibili
 * (accessibile senza tooltip). Serie singola, colore d'accento.
 */
export function BarList({
  items,
  formatValue,
  className,
  label,
}: {
  items: BarListItem[];
  formatValue: (value: number) => string;
  className?: string;
  label: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul aria-label={label} className={cn("flex flex-col gap-3.5", className)}>
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-fg">{item.label}</span>
            <span className="shrink-0 font-medium text-fg tabular-nums">
              {formatValue(item.value)}
              {item.meta ? (
                <span className="ml-1.5 text-xs font-normal text-fg-muted">{item.meta}</span>
              ) : null}
            </span>
          </div>
          <div aria-hidden className="h-2 overflow-hidden rounded-full bg-accent-soft">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
