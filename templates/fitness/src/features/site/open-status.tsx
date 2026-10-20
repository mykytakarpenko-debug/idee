"use client";

import { addDays, isSameDay } from "date-fns";
import { copy } from "@/content/it";
import { useNow } from "@/hooks/use-now";
import { useSiteData } from "@/hooks/use-site-data";
import { isOpenAt, nextOpening, openingFor } from "@/lib/domain/dates";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Indicatore "Aperto ora / Chiuso" calcolato sull'ora del visitatore. */
export function OpenStatus({ className }: { className?: string }) {
  const now = useNow();
  const { settings } = useSiteData();
  if (!now) return <span className={cn("inline-block h-7 w-40", className)} aria-hidden />;

  const open = isOpenAt(settings.hours, now);
  let label: string;
  if (open) {
    label = copy.site.openNow(openingFor(settings.hours, now)?.to ?? "");
  } else {
    const next = nextOpening(settings.hours, now);
    let when = "";
    if (next) {
      const time = formatDate(next, "time");
      if (isSameDay(next, now)) when = `alle ${time}`;
      else if (isSameDay(next, addDays(now, 1))) when = `domani alle ${time}`;
      else when = `${formatDate(next, "weekdayNarrow")} alle ${time}`;
    }
    label = next ? `${copy.site.closedNow} · ${copy.site.opensAt(when)}` : copy.site.closedNow;
  }

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-fg",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-2 rounded-full", open ? "bg-success" : "bg-fg-subtle")}
      />
      {label}
    </span>
  );
}
