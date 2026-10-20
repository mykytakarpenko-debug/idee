"use client";

import { useDataStore } from "@/store/data-store";
import { useSessionStore } from "@/store/session-store";

/** Cliente con accesso nella demo (null se ospite o non ancora caricato). */
export function useCustomer() {
  const customerId = useSessionStore((state) => state.customerId);
  const hydrated = useSessionStore((state) => state.hydrated);
  const customer = useDataStore((state) =>
    customerId ? (state.customers.find((c) => c.id === customerId) ?? null) : null,
  );
  return { customer, customerId, hydrated };
}
