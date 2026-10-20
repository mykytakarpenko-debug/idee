"use client";

import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";

/** Socio collegato all'area socio (null se non ha effettuato l'accesso). */
export function useCurrentMember() {
  const memberId = useSessionStore((state) => state.memberId);
  return (
    useDataStore((state) =>
      memberId ? state.members.find((m) => m.id === memberId) : undefined,
    ) ?? null
  );
}
