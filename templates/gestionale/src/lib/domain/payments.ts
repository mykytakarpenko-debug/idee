import type { Payment, PaymentDisplayStatus } from "./types";

/**
 * Stato mostrato all'utente. Un pagamento "in attesa" con scadenza passata
 * diventa "scaduto": lo stato è derivato, così non serve un job che lo aggiorni.
 */
export function paymentDisplayStatus(payment: Payment, now: Date): PaymentDisplayStatus {
  if (payment.status === "pending" && new Date(payment.dueAt).getTime() < startOfDayMs(now)) {
    return "overdue";
  }
  return payment.status;
}

function startOfDayMs(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

/**
 * Prossimo numero progressivo annuale nel formato "AAAA/NNNN".
 * In produzione il numero va assegnato dal server in modo atomico.
 */
export function nextPaymentNumber(
  payments: readonly Pick<Payment, "number">[],
  year: number,
): string {
  const prefix = `${year}/`;
  let max = 0;
  for (const { number } of payments) {
    if (!number.startsWith(prefix)) continue;
    const n = Number.parseInt(number.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export interface PaymentTotals {
  paid: number;
  pending: number;
  overdue: number;
  refunded: number;
  overdueCount: number;
  pendingCount: number;
}

export function paymentTotals(payments: readonly Payment[], now: Date): PaymentTotals {
  const totals: PaymentTotals = {
    paid: 0,
    pending: 0,
    overdue: 0,
    refunded: 0,
    overdueCount: 0,
    pendingCount: 0,
  };
  for (const payment of payments) {
    const status = paymentDisplayStatus(payment, now);
    totals[status] += payment.amount;
    if (status === "overdue") totals.overdueCount += 1;
    if (status === "pending") totals.pendingCount += 1;
  }
  return totals;
}
