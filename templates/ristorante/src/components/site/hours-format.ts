import { copy } from "@/content/it";
import type { OpeningDay } from "@/lib/domain/types";

/** "Pranzo 12:30–14:30 · Cena 19:00–23:00", oppure null se chiuso. */
export function formatHours(day: OpeningDay): string | null {
  const parts: string[] = [];
  if (day.lunch.open) parts.push(`${copy.service.lunch} ${day.lunch.from}–${day.lunch.to}`);
  if (day.dinner.open) parts.push(`${copy.service.dinner} ${day.dinner.from}–${day.dinner.to}`);
  return parts.length ? parts.join(" · ") : null;
}
