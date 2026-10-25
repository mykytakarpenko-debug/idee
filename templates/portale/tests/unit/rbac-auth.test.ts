import { describe, expect, it } from "vitest";
import {
  LOCK_MINUTES,
  MAX_ATTEMPTS,
  NO_ATTEMPTS,
  lockRemaining,
  maskIp,
  normalizeOtp,
  registerFailure,
  safeEqual,
} from "@/lib/domain/auth";
import {
  assignableRoles,
  can,
  canManageUser,
  homeFor,
  isStaff,
  PERMISSIONS,
  permissionsOf,
  ROLES,
  wouldRemoveLastAdmin,
} from "@/lib/domain/rbac";
import type { User } from "@/lib/domain/types";

const user = (patch: Partial<User>): User => ({
  id: "u",
  name: "Test",
  email: "t@example.com",
  title: "",
  orgId: "o_1",
  role: "client_member",
  status: "active",
  mfaEnabled: true,
  lastLoginAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  ...patch,
});

describe("rbac", () => {
  it("separa nettamente area cliente e area admin", () => {
    for (const role of ROLES) {
      expect(can(role, "portal.access")).toBe(!isStaff(role));
      expect(can(role, "admin.access")).toBe(isStaff(role));
      expect(homeFor(role)).toBe(isStaff(role) ? "/admin" : "/portale");
    }
  });

  it("concede solo permessi noti", () => {
    for (const role of ROLES) {
      for (const permission of permissionsOf(role)) expect(PERMISSIONS).toContain(permission);
    }
  });

  it("riserva fatture e gestione team all'amministratore cliente", () => {
    expect(can("client_admin", "invoices.view")).toBe(true);
    expect(can("client_member", "invoices.view")).toBe(false);
    expect(can("client_viewer", "tickets.create")).toBe(false);
    expect(can("client_admin", "team.manage")).toBe(true);
    expect(can("client_member", "team.manage")).toBe(false);
  });

  it("riserva note interne, registro e impostazioni allo staff", () => {
    expect(can("client_admin", "tickets.internal")).toBe(false);
    expect(can("support", "tickets.internal")).toBe(true);
    expect(can("support", "audit.view")).toBe(false);
    expect(can("admin", "audit.view")).toBe(true);
    expect(can("admin", "settings.manage")).toBe(true);
  });

  it("non permette a un cliente di assegnare ruoli staff", () => {
    expect(assignableRoles({ role: "client_admin" })).toEqual([
      "client_admin",
      "client_member",
      "client_viewer",
    ]);
    expect(assignableRoles({ role: "client_member" })).toEqual([]);
    expect(assignableRoles({ role: "admin" })).toEqual(ROLES);
  });

  it("limita chi può gestire chi", () => {
    const admin = user({ id: "a", role: "client_admin" });
    expect(canManageUser(admin, user({ id: "b" }))).toBe(true);
    expect(canManageUser(admin, admin)).toBe(false);
    expect(canManageUser(admin, user({ id: "c", orgId: "o_2" }))).toBe(false);
    expect(canManageUser(admin, user({ id: "s", orgId: null, role: "support" }))).toBe(false);
    expect(canManageUser(user({ id: "m" }), user({ id: "b" }))).toBe(false);
    expect(
      canManageUser(user({ id: "x", orgId: null, role: "admin" }), user({ id: "b", orgId: "o_9" })),
    ).toBe(true);
  });

  it("protegge l'ultimo amministratore attivo dell'azienda", () => {
    const users = [
      user({ id: "a", role: "client_admin" }),
      user({ id: "b", role: "client_admin", status: "disabled" }),
      user({ id: "c" }),
    ];
    expect(wouldRemoveLastAdmin(users, "a", "client_member")).toBe(true);
    expect(wouldRemoveLastAdmin(users, "a", null)).toBe(true);
    expect(wouldRemoveLastAdmin(users, "a", "client_admin")).toBe(false);
    expect(wouldRemoveLastAdmin(users, "c", null)).toBe(false);
    const two = [...users, user({ id: "d", role: "client_admin" })];
    expect(wouldRemoveLastAdmin(two, "a", "client_viewer")).toBe(false);
  });
});

describe("auth", () => {
  it("blocca dopo troppi tentativi e sblocca dopo l'attesa", () => {
    let state = NO_ATTEMPTS;
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) state = registerFailure(state, 1_000);
    expect(lockRemaining(state, 1_000)).toBe(LOCK_MINUTES);
    expect(lockRemaining(state, 1_000 + 14 * 60_000)).toBe(1);
    expect(lockRemaining(state, 1_000 + LOCK_MINUTES * 60_000)).toBe(0);
    // Dopo lo sblocco il contatore riparte.
    expect(registerFailure(state, 1_000 + LOCK_MINUTES * 60_000).failures).toBe(1);
  });

  it("normalizza il codice e confronta a tempo costante", () => {
    expect(normalizeOtp("246 810")).toBe("246810");
    expect(normalizeOtp("24681")).toBeNull();
    expect(normalizeOtp("abcdef")).toBeNull();
    expect(safeEqual("246810", "246810")).toBe(true);
    expect(safeEqual("246810", "246811")).toBe(false);
    expect(safeEqual("246810", "2468100")).toBe(false);
  });

  it("anonimizza gli IP", () => {
    expect(maskIp("93.41.12.7")).toBe("93.41.12.x");
    expect(maskIp("::1")).toBe("—");
  });
});
