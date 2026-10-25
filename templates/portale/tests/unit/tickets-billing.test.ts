import { describe, expect, it } from "vitest";
import { filterAudit, expiredAudit, ticketsByWeek } from "@/lib/domain/analytics";
import {
  invoiceStatus,
  invoiceTotals,
  lateMilestones,
  nextMilestone,
  outstanding,
  projectProgress,
  fileSize,
} from "@/lib/domain/billing";
import {
  averageFirstResponse,
  nextStatuses,
  queueOrder,
  slaCompliance,
  slaDeadline,
  slaState,
  ticketNumber,
  visibleMessages,
} from "@/lib/domain/tickets";
import type { AuditEvent, Invoice, Ticket } from "@/lib/domain/types";

const SLA = { urgent: 4, high: 8, normal: 24, low: 48 };
const NOW = new Date("2026-10-21T10:00:00+02:00");

const ticket = (patch: Partial<Ticket>): Ticket => ({
  id: "t",
  number: "T-1001",
  orgId: "o_1",
  subject: "Prova",
  category: "bug",
  priority: "high",
  status: "open",
  createdBy: "u",
  assigneeId: null,
  createdAt: "2026-10-21T06:00:00+02:00",
  updatedAt: "2026-10-21T06:00:00+02:00",
  firstResponseAt: null,
  resolvedAt: null,
  messages: [],
  ...patch,
});

describe("SLA", () => {
  it("calcola la scadenza dalla priorità", () => {
    expect(slaDeadline(ticket({}), SLA).toISOString()).toBe("2026-10-21T12:00:00.000Z");
  });

  it("distingue nei tempi, a rischio e superato", () => {
    expect(slaState(ticket({}), SLA, NOW)).toBe("on_time");
    expect(slaState(ticket({}), SLA, new Date("2026-10-21T13:00:00+02:00"))).toBe("at_risk");
    expect(slaState(ticket({}), SLA, new Date("2026-10-21T14:30:00+02:00"))).toBe("breached");
    expect(slaState(ticket({ firstResponseAt: "2026-10-21T07:00:00+02:00" }), SLA, NOW)).toBe(
      "met",
    );
    expect(slaState(ticket({ firstResponseAt: "2026-10-21T15:00:00+02:00" }), SLA, NOW)).toBe(
      "breached",
    );
  });

  it("misura conformità e tempo medio di prima risposta", () => {
    const list = [
      ticket({ id: "a", firstResponseAt: "2026-10-21T07:00:00+02:00" }),
      ticket({ id: "b", firstResponseAt: "2026-10-21T16:00:00+02:00" }),
      ticket({ id: "c" }),
    ];
    expect(slaCompliance(list, SLA)).toBe(0.5);
    expect(averageFirstResponse(list)).toBe(330);
    expect(slaCompliance([ticket({})], SLA)).toBeNull();
  });

  it("ordina la coda per SLA, priorità e anzianità", () => {
    const list = [
      ticket({ id: "closed", status: "closed", priority: "urgent" }),
      ticket({ id: "low", priority: "low" }),
      ticket({ id: "late", createdAt: "2026-10-20T06:00:00+02:00" }),
      ticket({ id: "urgent", priority: "urgent", createdAt: "2026-10-21T09:30:00+02:00" }),
    ];
    expect(queueOrder(list, SLA, NOW).map((t) => t.id)).toEqual([
      "late",
      "urgent",
      "low",
      "closed",
    ]);
  });
});

describe("ticket", () => {
  it("limita le transizioni del cliente", () => {
    expect(nextStatuses("open", "client_admin")).toEqual([]);
    expect(nextStatuses("resolved", "client_member")).toEqual(["closed", "in_progress"]);
    expect(nextStatuses("open", "support")).toContain("resolved");
    expect(nextStatuses("closed", "admin")).toEqual([]);
  });

  it("nasconde le note interne a chi non ha il permesso", () => {
    const messages = [
      { id: "1", authorId: "u", body: "Ciao", at: "", internal: false },
      { id: "2", authorId: "s", body: "Nota", at: "", internal: true },
    ];
    expect(visibleMessages(messages, "client_admin")).toHaveLength(1);
    expect(visibleMessages(messages, "support")).toHaveLength(2);
  });

  it("numera i ticket", () => {
    expect(ticketNumber(1)).toBe("T-1001");
  });

  it("conta aperti e risolti per settimana", () => {
    const weeks = ticketsByWeek(
      [
        ticket({ createdAt: "2026-10-19T09:00:00+02:00", resolvedAt: "2026-10-20T09:00:00+02:00" }),
        ticket({ createdAt: "2026-10-14T09:00:00+02:00" }),
        ticket({ createdAt: "2026-01-01T09:00:00+01:00" }),
      ],
      NOW,
      2,
    );
    expect(weeks).toEqual([
      { week: "2026-10-12", opened: 1, resolved: 0 },
      { week: "2026-10-19", opened: 1, resolved: 1 },
    ]);
  });
});

describe("fatture e progetti", () => {
  const invoice = (patch: Partial<Invoice>): Invoice => ({
    id: "i",
    number: "2026/001",
    orgId: "o_1",
    issueDate: "2026-09-01",
    dueDate: "2026-10-01",
    vatRate: 0.22,
    lines: [
      { description: "Canone", amount: 100_00 },
      { description: "Extra", amount: 50_00 },
    ],
    paidAt: null,
    ...patch,
  });

  it("calcola IVA e totali", () => {
    expect(invoiceTotals(invoice({}))).toEqual({ net: 150_00, vat: 33_00, gross: 183_00 });
  });

  it("classifica pagate, da pagare e scadute", () => {
    expect(invoiceStatus(invoice({ paidAt: "2026-09-20" }), "2026-10-21")).toBe("paid");
    expect(invoiceStatus(invoice({}), "2026-10-21")).toBe("overdue");
    expect(invoiceStatus(invoice({}), "2026-10-01")).toBe("due");
    expect(
      outstanding(
        [invoice({}), invoice({ dueDate: "2026-11-01" }), invoice({ paidAt: "2026-09-02" })],
        "2026-10-21",
      ),
    ).toEqual({
      due: 183_00,
      overdue: 183_00,
    });
  });

  it("misura l'avanzamento e le milestone in ritardo", () => {
    const milestones = [
      { id: "1", title: "A", due: "2026-10-01", done: true },
      { id: "2", title: "B", due: "2026-10-15", done: false },
      { id: "3", title: "C", due: "2026-11-01", done: false },
    ];
    expect(projectProgress(milestones)).toBeCloseTo(1 / 3);
    expect(projectProgress([])).toBe(0);
    expect(nextMilestone(milestones)?.id).toBe("2");
    expect(lateMilestones(milestones, "2026-10-21").map((m) => m.id)).toEqual(["2"]);
  });

  it("formatta le dimensioni dei file", () => {
    expect(fileSize(512)).toMatch(/512\s?KB/);
    expect(fileSize(2048)).toMatch(/2(,0)?\s?MB/);
  });
});

describe("registro attività", () => {
  const event = (patch: Partial<AuditEvent>): AuditEvent => ({
    id: "e",
    at: "2026-10-20T10:00:00Z",
    actorId: "u_1",
    action: "auth.login",
    target: "giulia@example.com",
    orgId: "o_1",
    ip: "93.41.12.x",
    ...patch,
  });

  it("filtra per azione, azienda e testo (più recenti prima)", () => {
    const events = [
      event({ id: "1" }),
      event({ id: "2", action: "ticket.create", target: "T-1001", at: "2026-10-21T08:00:00Z" }),
      event({ id: "3", orgId: "o_2", actorId: "u_2" }),
    ];
    const names = new Map([
      ["u_1", "Giulia Ferri"],
      ["u_2", "Paolo Neri"],
    ]);
    const base = { q: "", action: "" as const, orgId: "", actorId: "" };
    expect(filterAudit(events, base, names).map((e) => e.id)).toEqual(["2", "1", "3"]);
    expect(filterAudit(events, { ...base, action: "auth.login" }, names)).toHaveLength(2);
    expect(filterAudit(events, { ...base, orgId: "o_2" }, names).map((e) => e.id)).toEqual(["3"]);
    expect(filterAudit(events, { ...base, q: "paolo" }, names).map((e) => e.id)).toEqual(["3"]);
  });

  it("individua gli eventi oltre la conservazione", () => {
    const events = [event({ id: "old", at: "2025-01-01T00:00:00Z" }), event({ id: "new" })];
    expect(expiredAudit(events, NOW, 365).map((e) => e.id)).toEqual(["old"]);
  });
});
