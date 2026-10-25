"use client";

import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";

/** Giocatore con accesso e stato di caricamento. */
export function usePlayer() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const playerId = useSessionStore((state) => state.playerId);
  const ready = useDataStore((state) => state.ready);
  const player = useDataStore((state) =>
    playerId ? (state.players.find((p) => p.id === playerId) ?? null) : null,
  );
  return { player, loading: !hydrated || !ready };
}
