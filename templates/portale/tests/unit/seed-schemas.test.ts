import { describe, expect, it } from "vitest";
import { adminKpis } from "@/lib/domain/analytics";
import { can } from "@/lib/domain/rbac";
import { inviteSchema, settingsSchema, ticketSchema, uploadSchema } from "@/lib/domain/schemas";
import { isOpenStatus } from "@/lib/domain/tickets";
import { createDemoData, DEMO_ACCOUNTS } from "@/lib/demo/seed";

const NOW = new Date("2026-10-21T10:00:00+02:00");

describe("dati demo", () => {
  const data = createDemoData(NOW);

  it("sono deterministici", () => {
    expect(createDemoData(NOW)).toEqual(data);
  });

  it("hanno un account attivo per ogni ruolo", () => {
    for (const account of DEMO_ACCOUNTS) {
      const user = data.users.find((u) => u.email === account.email);
      expect(user?.role).toBe(account.role);
      expect(user?.status).toBe("active");
    }
  });

  it("collegano ogni elemento a entità esistenti", () => {
    const orgs = new Set(data.organizations.map((o) => o.id));
    const users = new Set(data.users.map((u) => u.id));
    for (const p of data.projects) expect(orgs.has(p.orgId) && users.has(p.managerId)).toBe(true);
    for (const d of data.documents) expect(orgs.has(d.orgId) && users.has(d.uploadedBy)).toBe(true);
    for (const i of data.invoices) expect(orgs.has(i.orgId)).toBe(true);
    for (const t of data.tickets) {
      expect(orgs.has(t.orgId)).toBe(true);
      expect(users.has(t.createdBy)).toBe(true);
      for (const m of t.messages) expect(users.has(m.authorId)).toBe(true);
    }
    for (const e of data.audit) expect(users.has(e.actorId)).toBe(true);
  });

  it("scrivono note interne solo dallo staff", () => {
    for (const t of data.tickets) {
      for (const m of t.messages.filter((m) => m.internal)) {
        const author = data.users.find((u) => u.id === m.authorId)!;
        expect(can(author.role, "tickets.internal")).toBe(true);
      }
    }
  });

  it("non hanno date nel futuro e IP in chiaro", () => {
    const limit = NOW.getTime();
    for (const t of data.tickets) {
      expect(new Date(t.createdAt).getTime()).toBeLessThanOrEqual(limit);
      expect(new Date(t.updatedAt).getTime()).toBeLessThanOrEqual(limit);
    }
    for (const e of data.audit) {
      expect(new Date(e.at).getTime()).toBeLessThanOrEqual(limit);
      expect(e.ip).toMatch(/\.x$/);
    }
  });

  it("hanno una coda di assistenza realistica", () => {
    const kpis = adminKpis(data, NOW);
    const open = data.tickets.filter((t) => isOpenStatus(t.status));
    expect(open.length).toBeGreaterThan(3);
    expect(kpis.breached).toBeLessThanOrEqual(Math.ceil(open.length / 2));
    expect(kpis.slaCompliance).toBeGreaterThan(0.75);
  });
});

describe("schemi", () => {
  it("validano il ticket", () => {
    expect(
      ticketSchema.safeParse({ subject: " ", category: "bug", priority: "high", body: "x" })
        .success,
    ).toBe(false);
    expect(
      ticketSchema.safeParse({
        subject: "Errore",
        category: "bug",
        priority: "high",
        body: "Dettagli",
      }).success,
    ).toBe(true);
  });

  it("rifiutano nomi di file pericolosi", () => {
    expect(
      uploadSchema.safeParse({ name: "../segreti.pdf", folder: "report", projectId: "" }).success,
    ).toBe(false);
    expect(
      uploadSchema.safeParse({ name: "Report ottobre.pdf", folder: "report", projectId: "" })
        .success,
    ).toBe(true);
  });

  it("validano invito e impostazioni", () => {
    expect(
      inviteSchema.safeParse({ name: "Ada", email: "ada@", title: "", role: "client_member" })
        .success,
    ).toBe(false);
    const settings = {
      providerName: "Orbita",
      supportEmail: "supporto@orbita.example",
      urgent: "4",
      high: "8",
      normal: "24",
      low: "48",
      sessionTimeoutMinutes: "30",
      auditRetentionDays: "365",
      mfaRequired: true,
    };
    expect(settingsSchema.parse(settings).urgent).toBe(4);
    expect(settingsSchema.safeParse({ ...settings, sessionTimeoutMinutes: "2" }).success).toBe(
      false,
    );
    expect(settingsSchema.safeParse({ ...settings, urgent: "4h" }).success).toBe(false);
  });
});
