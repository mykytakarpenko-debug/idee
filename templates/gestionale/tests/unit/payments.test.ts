import { describe, expect, it } from "vitest";
import { nextPaymentNumber, paymentDisplayStatus, paymentTotals } from "@/lib/domain/payments";
import type { Payment } from "@/lib/domain/types";

const now = new Date("2026-10-20T10:00:00");

function payment(patch: Partial<Payment>): Payment {
  return {
    id: "pa_1",
    number: "2026/0001",
    clientId: "cl_1",
    appointmentId: null,
    description: "Servizio",
    amount: 5000,
    method: "card",
    status: "pending",
    issuedAt: "2026-10-01T10:00:00.000Z",
    dueAt: "2026-10-30T10:00:00.000Z",
    paidAt: null,
    ...patch,
  };
}

describe("paymentDisplayStatus", () => {
  it("deriva lo stato scaduto dalla data di scadenza", () => {
    expect(paymentDisplayStatus(payment({ dueAt: "2026-10-10T10:00:00.000Z" }), now)).toBe(
      "overdue",
    );
    expect(paymentDisplayStatus(payment({}), now)).toBe("pending");
  });

  it("un pagamento in scadenza oggi non è ancora scaduto", () => {
    expect(
      paymentDisplayStatus(payment({ dueAt: new Date("2026-10-20T08:00:00").toISOString() }), now),
    ).toBe("pending");
  });

  it("lascia invariati pagati e rimborsati", () => {
    expect(
      paymentDisplayStatus(payment({ status: "paid", dueAt: "2020-01-01T00:00:00.000Z" }), now),
    ).toBe("paid");
    expect(paymentDisplayStatus(payment({ status: "refunded" }), now)).toBe("refunded");
  });
});

describe("nextPaymentNumber", () => {
  it("prosegue la numerazione dell'anno", () => {
    const list = [{ number: "2026/0009" }, { number: "2026/0010" }, { number: "2025/0420" }];
    expect(nextPaymentNumber(list, 2026)).toBe("2026/0011");
    expect(nextPaymentNumber(list, 2027)).toBe("2027/0001");
  });
});

describe("paymentTotals", () => {
  it("somma per stato mostrato", () => {
    const totals = paymentTotals(
      [
        payment({ id: "1", status: "paid", amount: 1000 }),
        payment({ id: "2", amount: 2000 }),
        payment({ id: "3", amount: 3000, dueAt: "2026-10-01T00:00:00.000Z" }),
      ],
      now,
    );
    expect(totals).toMatchObject({
      paid: 1000,
      pending: 2000,
      overdue: 3000,
      overdueCount: 1,
      pendingCount: 1,
    });
  });
});
