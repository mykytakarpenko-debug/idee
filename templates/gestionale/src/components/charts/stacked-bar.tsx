import { formatNumber, formatPercent } from "@/lib/format";

export interface StackedSegment {
  id: string;
  label: string;
  value: number;
  /** Colore CSS (token), es. "var(--success)". */
  color: string;
}

/**
 * Barra a segmenti con legenda testuale (etichetta, valore, percentuale):
 * l'identità non dipende mai dal solo colore. Spazio di 2 px tra i segmenti.
 */
export function StackedBar({ segments, label }: { segments: StackedSegment[]; label: string }) {
  const total = segments.reduce((acc, segment) => acc + segment.value, 0);
  const visible = segments.filter((segment) => segment.value > 0);
  return (
    <div className="flex flex-col gap-4">
      <div
        aria-hidden
        className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-surface-2"
      >
        {visible.map((segment) => (
          <div
            key={segment.id}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
          />
        ))}
      </div>
      <dl aria-label={label} className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {segments.map((segment) => (
          <div key={segment.id} className="flex items-center justify-between gap-3 text-sm">
            <dt className="flex min-w-0 items-center gap-2 text-fg">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate">{segment.label}</span>
            </dt>
            <dd className="shrink-0 text-fg tabular-nums">
              <span className="font-medium">{formatNumber(segment.value)}</span>
              <span className="ml-1.5 text-xs text-fg-muted">
                {total === 0 ? "—" : formatPercent(segment.value / total, 0)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
