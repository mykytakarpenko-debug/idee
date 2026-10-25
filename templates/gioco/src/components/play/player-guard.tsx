"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useNow } from "@/hooks/use-now";
import { usePlayer } from "@/hooks/use-player";
import {
  effectiveLimits,
  realityCheckDue,
  sessionExpired,
  sessionMinutes,
  sessionSummary,
} from "@/lib/domain/responsible";
import { formatCurrency } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";

/**
 * Controlli di sessione per chi ha effettuato l'accesso:
 * - chiude la sessione al limite di durata scelto dal giocatore (con pausa di 30 minuti);
 * - mostra il promemoria del tempo di gioco all'intervallo scelto, con il saldo della sessione.
 */
export function PlayerGuard() {
  // Lo stato del promemoria riparte a ogni nuova sessione.
  const sessionId = useSessionStore((state) => state.sessionId);
  return <Guard key={sessionId ?? "nessuna"} />;
}

function Guard() {
  const router = useRouter();
  const now = useNow();
  const { player } = usePlayer();
  const sessionId = useSessionStore((state) => state.sessionId);
  const lastCheck = useSessionStore((state) => state.lastRealityCheck);
  const hydrated = useSessionStore((state) => state.hydrated);
  const playerId = useSessionStore((state) => state.playerId);
  const ready = useDataStore((state) => state.ready);
  const session = useDataStore((state) => state.sessions.find((s) => s.id === sessionId));
  const transactions = useDataStore((state) => state.transactions);
  const [open, setOpen] = useState(false);

  // Sessione non più valida (dati demo ripristinati o sessione chiusa altrove).
  useEffect(() => {
    if (!hydrated || !ready || !playerId) return;
    if (!player || !session || session.endedAt) useSessionStore.getState().signOut(null);
  }, [hydrated, ready, playerId, player, session]);

  useEffect(() => {
    if (!player || !session || session.endedAt || !now) return;
    const limits = effectiveLimits(player, now);
    if (sessionExpired(session, limits.sessionMinutes, now)) {
      useDataStore.getState().endSession(session.id, "session_limit");
      useSessionStore.getState().signOut("session_limit");
      router.push(routes.login);
      return;
    }
    if (!open && realityCheckDue(session, lastCheck, player.realityCheckMinutes, now)) {
      useSessionStore.getState().markRealityCheck(now.getTime());
      useDataStore
        .getState()
        .logRg(player.id, "reality_check", `Dopo ${sessionMinutes(session, now)} minuti`);
      // Non annullabile dal cleanup: l'aggiornamento di lastCheck fa ripartire l'effetto.
      queueMicrotask(() => setOpen(true));
    }
  }, [player, session, now, lastCheck, open, router]);

  if (!player || !session || !now) return null;
  const summary = sessionSummary(transactions, player.id, session.startedAt);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {open ? (
        <DialogContent
          title={copy.realityCheck.title}
          description={copy.realityCheck.text(sessionMinutes(session, now))}
        >
          <DialogBody>
            <dl className="grid grid-cols-3 gap-3 rounded-lg bg-surface-2 p-4 text-center">
              {[
                [copy.realityCheck.staked, summary.staked],
                [copy.realityCheck.returned, summary.returned],
                [copy.realityCheck.net, summary.net],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-[12px] text-fg-muted">{label}</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-fg tabular-nums">
                    {formatCurrency(value as number)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-start gap-2 text-[13px] text-fg-muted">
              <Clock aria-hidden className="mt-0.5 size-4 shrink-0" />
              <Link
                href={routes.account}
                onClick={() => setOpen(false)}
                className="text-accent-text underline underline-offset-2"
              >
                {copy.realityCheck.history}
              </Link>
            </p>
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              className={buttonClasses({ variant: "secondary" })}
              onClick={() => {
                useDataStore.getState().endSession(session.id);
                useSessionStore.getState().signOut();
                setOpen(false);
                router.push(routes.home);
              }}
            >
              {copy.realityCheck.stop}
            </button>
            <Button onClick={() => setOpen(false)}>{copy.realityCheck.continue}</Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
