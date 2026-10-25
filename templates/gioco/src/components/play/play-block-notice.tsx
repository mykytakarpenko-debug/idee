"use client";

import { ShieldAlert } from "lucide-react";
import { copy } from "@/content/it";
import { playBlock } from "@/lib/domain/responsible";
import type { Player } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";

/** Avviso quando gioco e ricariche sono sospesi (pausa, autoesclusione, limite di sessione). */
export function PlayBlockNotice({ player, now }: { player: Player; now: Date }) {
  const block = playBlock(player, now);
  if (!block) return null;
  const text =
    block.reason === "self_exclusion"
      ? copy.block.self_exclusion(block.until ? formatDate(block.until, "long") : null)
      : block.reason === "pause"
        ? copy.block.pause(formatDate(block.until, "dateTime"))
        : copy.block.cooldown(formatDate(block.until, "time"));
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-[13px] text-fg"
    >
      <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
      {text}
    </p>
  );
}
