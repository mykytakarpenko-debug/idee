"use client";

import { routes } from "@/config/navigation";
import { useDataStore } from "@/store/data-store";

/** Contatori accanto alle voci del pannello: richieste da confermare. */
export function useNavCounts(): Record<string, number> {
  const pending = useDataStore(
    (state) => state.appointments.filter((a) => a.status === "pending").length,
  );
  return { [routes.panel]: pending };
}
