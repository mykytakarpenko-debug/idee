"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { SeriesPoint } from "@/lib/domain/analytics";
import { cn } from "@/lib/utils";
import { niceScale } from "./scale";

/**
 * Istogramma a serie singola (HTML/CSS, nessuna libreria).
 *
 * - Barre ≤ 24 px con estremità arrotondata di 4 px, griglia sottile.
 * - Tooltip al passaggio del mouse e al focus; frecce ← → per spostarsi
 *   tra le barre (un solo elemento nel tab order).
 * - Ogni barra annuncia etichetta e valore agli screen reader.
 */
export function ColumnChart({
  data,
  formatValue,
  formatTick,
  height = 220,
  label,
}: {
  data: SeriesPoint[];
  formatValue: (value: number) => string;
  formatTick: (value: number) => string;
  height?: number;
  /** Descrizione accessibile del grafico. */
  label: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(data.length - 1);
  const barsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const tooltipId = useId();

  const { max, ticks } = niceScale(Math.max(0, ...data.map((d) => d.value)));
  const n = data.length;
  const everyMobile = Math.max(1, Math.ceil(n / 6));
  const everyDesktop = Math.max(1, Math.ceil(n / 12));

  const moveFocus = (index: number) => {
    const next = Math.min(n - 1, Math.max(0, index));
    setFocusIndex(next);
    setActive(next);
    barsRef.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = active ?? focusIndex;
    if (event.key === "ArrowRight") moveFocus(current + 1);
    else if (event.key === "ArrowLeft") moveFocus(current - 1);
    else if (event.key === "Home") moveFocus(0);
    else if (event.key === "End") moveFocus(n - 1);
    else return;
    event.preventDefault();
  };

  const activePoint = active === null ? null : (data[active] ?? null);
  const activeIndex = active ?? 0;
  const align =
    active === null ? "center" : active < n * 0.2 ? "left" : active > n * 0.8 ? "right" : "center";

  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="flex gap-3" style={{ height }}>
        {/* Asse Y */}
        <div
          aria-hidden
          className="relative w-12 shrink-0 text-right text-[11px] text-fg-muted tabular-nums"
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2 leading-none"
              style={{ bottom: `${(tick / max) * 100}%` }}
            >
              {formatTick(tick)}
            </span>
          ))}
        </div>

        {/* Area del grafico */}
        <div className="relative min-w-0 flex-1">
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden
              className={cn(
                "absolute inset-x-0 h-px",
                tick === 0 ? "bg-line-strong/50" : "bg-grid",
              )}
              style={{ bottom: `${(tick / max) * 100}%` }}
            />
          ))}

          <div
            role="group"
            aria-label={label}
            onMouseLeave={() => setActive(null)}
            className="absolute inset-0 flex items-end"
          >
            {data.map((point, index) => {
              const heightPct = max === 0 ? 0 : (point.value / max) * 100;
              return (
                <button
                  key={point.key}
                  ref={(node) => {
                    barsRef.current[index] = node;
                  }}
                  type="button"
                  tabIndex={index === focusIndex ? 0 : -1}
                  aria-label={`${point.longLabel}: ${formatValue(point.value)}`}
                  aria-describedby={active === index ? tooltipId : undefined}
                  onMouseEnter={() => setActive(index)}
                  onKeyDown={onKeyDown}
                  onFocus={() => {
                    setActive(index);
                    setFocusIndex(index);
                  }}
                  onBlur={() => setActive(null)}
                  className="group relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center outline-none"
                >
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-x-[1px] inset-y-0 rounded-md transition-colors",
                      active === index && "bg-surface-2",
                      "group-focus-visible:ring-2 group-focus-visible:ring-focus",
                    )}
                  />
                  <span
                    className="relative w-[min(24px,62%)] rounded-t-[4px] bg-accent transition-[height,filter] duration-300 ease-out group-hover:brightness-110"
                    style={{ height: `${heightPct}%`, minHeight: point.value > 0 ? 2 : 0 }}
                  />
                </button>
              );
            })}
          </div>

          {activePoint ? (
            <div
              id={tooltipId}
              role="tooltip"
              className={cn(
                "pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-lg border border-line bg-surface px-3 py-2 shadow-md",
                align === "center" && "-translate-x-1/2",
                align === "right" && "-translate-x-full",
              )}
              style={{
                left: `${((activeIndex + (align === "left" ? 0 : align === "right" ? 1 : 0.5)) / n) * 100}%`,
              }}
            >
              <p className="text-sm font-semibold whitespace-nowrap text-fg tabular-nums">
                {formatValue(activePoint.value)}
              </p>
              <p className="text-xs whitespace-nowrap text-fg-muted">{activePoint.longLabel}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Asse X */}
      <div aria-hidden className="flex gap-3">
        <div className="w-12 shrink-0" />
        <div className="flex min-w-0 flex-1">
          {data.map((point, index) => (
            <span
              key={point.key}
              className={cn(
                "flex min-w-0 flex-1 justify-center overflow-visible text-[11px] whitespace-nowrap text-fg-muted",
                index % everyMobile === 0 ? "" : "invisible",
                index % everyDesktop === 0 ? "sm:visible" : "sm:invisible",
              )}
            >
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
