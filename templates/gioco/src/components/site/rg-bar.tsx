"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import { copy, HELPLINE } from "@/content/it";
import { routes } from "@/config/navigation";
import { useNow } from "@/hooks/use-now";
import { usePlayer } from "@/hooks/use-player";
import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";
import { sessionMinutes } from "@/lib/domain/responsible";

/**
 * Avvertenze sempre visibili (18+, rischio di dipendenza, numero di aiuto) e,
 * per chi ha effettuato l'accesso, durata della sessione e link ai limiti.
 */
export function RgBar() {
  const now = useNow();
  const { player } = usePlayer();
  const sessionId = useSessionStore((state) => state.sessionId);
  const session = useDataStore((state) => state.sessions.find((s) => s.id === sessionId));

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs text-fg-muted sm:px-6">
        <span className="flex min-w-[16rem] flex-1 items-center gap-2">
          <span className="rounded border border-fg px-1 font-bold text-fg">{copy.site.adult}</span>
          <span>{copy.site.warning}</span>
        </span>
        <a
          href={`tel:${HELPLINE.number}`}
          className="inline-flex min-h-6 items-center gap-1.5 font-medium text-fg hover:underline"
        >
          <Phone aria-hidden className="size-3.5" />
          {HELPLINE.short}
        </a>
        {player && session && now ? (
          <Link
            href={routes.responsible}
            className="inline-flex min-h-6 items-center font-medium text-accent-text tabular-nums hover:underline"
          >
            {copy.session.timer(sessionMinutes(session, now))}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
