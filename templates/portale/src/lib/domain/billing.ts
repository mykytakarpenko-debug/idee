import type { Cents, ISODate, Invoice, Milestone } from "./types";

/** Fatture e avanzamento dei progetti. Funzioni pure, testate. */

export type InvoiceStatus = "paid" | "due" | "overdue";

export function invoiceStatus(
  invoice: Pick<Invoice, "paidAt" | "dueDate">,
  today: ISODate,
): InvoiceStatus {
  if (invoice.paidAt) return "paid";
  return invoice.dueDate < today ? "overdue" : "due";
}

export interface InvoiceTotals {
  net: Cents;
  vat: Cents;
  gross: Cents;
}

export function invoiceTotals(invoice: Pick<Invoice, "lines" | "vatRate">): InvoiceTotals {
  const net = invoice.lines.reduce((acc, line) => acc + line.amount, 0);
  const vat = Math.round(net * invoice.vatRate);
  return { net, vat, gross: net + vat };
}

/** Da incassare (non pagate), con la parte scaduta. */
export function outstanding(
  invoices: readonly Invoice[],
  today: ISODate,
): { due: Cents; overdue: Cents } {
  let due = 0;
  let overdue = 0;
  for (const invoice of invoices) {
    const status = invoiceStatus(invoice, today);
    const { gross } = invoiceTotals(invoice);
    if (status === "due") due += gross;
    if (status === "overdue") overdue += gross;
  }
  return { due, overdue };
}

/** Avanzamento di un progetto: quota di milestone completate (0–1). */
export function projectProgress(milestones: readonly Pick<Milestone, "done">[]): number {
  if (milestones.length === 0) return 0;
  return milestones.filter((m) => m.done).length / milestones.length;
}

/** Prossima milestone da completare (la più vicina). */
export function nextMilestone<M extends Pick<Milestone, "done" | "due">>(
  milestones: readonly M[],
): M | null {
  return (
    [...milestones].filter((m) => !m.done).sort((a, b) => a.due.localeCompare(b.due))[0] ?? null
  );
}

/** Milestone non completate e già scadute. */
export function lateMilestones<M extends Pick<Milestone, "done" | "due">>(
  milestones: readonly M[],
  today: ISODate,
): M[] {
  return milestones.filter((m) => !m.done && m.due < today);
}

/** Dimensione leggibile: 2048 → "2 MB". */
export function fileSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1).replace(".", ",") : Math.round(mb)} MB`;
}
