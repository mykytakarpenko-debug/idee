"use client";

import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";

/** Utente con accesso, sua organizzazione e stato di caricamento. */
export function useAuth() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const userId = useSessionStore((state) => state.userId);
  const ready = useDataStore((state) => state.ready);
  const user = useDataStore((state) =>
    userId ? (state.users.find((u) => u.id === userId) ?? null) : null,
  );
  const org = useDataStore((state) =>
    user?.orgId ? (state.organizations.find((o) => o.id === user.orgId) ?? null) : null,
  );
  return { user, org, loading: !hydrated || !ready };
}
