import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { formatDelta } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * KPI: etichetta, valore, variazione opzionale rispetto a un periodo indicato.
 * Il colore della variazione dipende da direzione × "in su è positivo".
 */
export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  hint,
  upIsGood = true,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: number | null;
  deltaLabel?: string;
  hint?: ReactNode;
  upIsGood?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const direction = !hasDelta || Math.abs(delta) < 0.0005 ? 0 : delta > 0 ? 1 : -1;
  const good = direction === 0 ? null : direction > 0 === upIsGood;
  const DeltaIcon = direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;

  return (
    <div
      className={cn(
        "forced-border flex flex-col gap-2 rounded-xl border border-line bg-surface p-4 shadow-xs sm:gap-3 sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-fg-muted">{label}</p>
        {icon ? (
          <span className="hidden text-fg-subtle sm:block [&_svg]:size-4">{icon}</span>
        ) : null}
      </div>
      <p className="text-[22px] leading-none font-semibold tracking-tight text-fg sm:text-[26px]">
        {value}
      </p>
      <div className="flex min-h-5 flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px]">
        {hasDelta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular-nums",
              good === null ? "text-fg-muted" : good ? "text-success" : "text-danger",
            )}
          >
            <DeltaIcon aria-hidden className="size-3.5" />
            {formatDelta(delta)}
          </span>
        ) : null}
        {hasDelta && deltaLabel ? <span className="text-fg-muted">{deltaLabel}</span> : null}
        {!hasDelta && hint ? <span className="text-fg-muted">{hint}</span> : null}
      </div>
    </div>
  );
}
