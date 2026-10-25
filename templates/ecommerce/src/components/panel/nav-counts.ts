"use client";

import { routes } from "@/config/navigation";
import { needsFulfilment } from "@/lib/domain/orders";
import { useDataStore } from "@/store/data-store";

/** Contatori accanto alle voci del pannello: ordini da preparare o spedire. */
export function useNavCounts(): Record<string, number> {
  const toShip = useDataStore(
    (state) => state.orders.filter((o) => needsFulfilment(o.status)).length,
  );
  return { [routes.orders]: toShip };
}
