"use client";

import { startOfDay } from "date-fns";
import { useMemo } from "react";
import { routes } from "@/config/navigation";
import { useNow } from "@/hooks/use-now";
import { useDataStore } from "@/store/data-store";

/** Contatori mostrati accanto alle voci del pannello (nuovi ordini, prenotazioni da confermare). */
export function useNavCounts(): Record<string, number> {
  const now = useNow();
  const newOrders = useDataStore((state) => state.orders.filter((o) => o.status === "new").length);
  const reservations = useDataStore((state) => state.reservations);
  const toConfirm = useMemo(() => {
    if (!now) return 0;
    const today = startOfDay(now).getTime();
    return reservations.filter(
      (r) => r.status === "requested" && new Date(r.start).getTime() >= today,
    ).length;
  }, [now, reservations]);
  return { [routes.orders]: newOrders, [routes.reservations]: toConfirm };
}
