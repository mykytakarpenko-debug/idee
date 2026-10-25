import type { Role, User } from "./types";

/**
 * Controllo degli accessi basato sui ruoli (RBAC). L'interfaccia nasconde ciò
 * che un ruolo non può fare, ma la stessa matrice va applicata sul server a
 * ogni richiesta: è l'unico controllo che conta per la sicurezza.
 */

export const PERMISSIONS = [
  "portal.access",
  "projects.view",
  "documents.view",
  "documents.upload",
  "tickets.view",
  "tickets.create",
  "invoices.view",
  "team.view",
  "team.manage",
  "admin.access",
  "clients.manage",
  "users.manage",
  "tickets.manage",
  "tickets.internal",
  "audit.view",
  "settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES: readonly Role[] = [
  "client_admin",
  "client_member",
  "client_viewer",
  "support",
  "admin",
];

const MATRIX: Record<Role, readonly Permission[]> = {
  client_admin: [
    "portal.access",
    "projects.view",
    "documents.view",
    "documents.upload",
    "tickets.view",
    "tickets.create",
    "invoices.view",
    "team.view",
    "team.manage",
  ],
  client_member: [
    "portal.access",
    "projects.view",
    "documents.view",
    "documents.upload",
    "tickets.view",
    "tickets.create",
    "team.view",
  ],
  client_viewer: ["portal.access", "projects.view", "documents.view", "tickets.view", "team.view"],
  support: ["admin.access", "tickets.manage", "tickets.internal", "clients.manage"],
  admin: [
    "admin.access",
    "clients.manage",
    "users.manage",
    "tickets.manage",
    "tickets.internal",
    "audit.view",
    "settings.manage",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export function permissionsOf(role: Role): readonly Permission[] {
  return MATRIX[role];
}

export function isStaff(role: Role): boolean {
  return role === "support" || role === "admin";
}

/** Area iniziale dopo l'accesso. */
export function homeFor(role: Role): "/portale" | "/admin" {
  return isStaff(role) ? "/admin" : "/portale";
}

/** Ruoli che un utente può assegnare: il cliente solo ruoli cliente, mai ruoli staff. */
export function assignableRoles(actor: Pick<User, "role">): Role[] {
  if (actor.role === "admin") return [...ROLES];
  if (actor.role === "client_admin") return ["client_admin", "client_member", "client_viewer"];
  return [];
}

/**
 * Un utente può gestirne un altro (ruolo, disattivazione) se:
 * - è amministratore del fornitore, oppure amministratore della stessa organizzazione
 *   del cliente e il bersaglio non è staff;
 * - non sta modificando sé stesso (evita di togliersi l'accesso per errore).
 */
export function canManageUser(
  actor: Pick<User, "id" | "role" | "orgId">,
  target: Pick<User, "id" | "role" | "orgId">,
): boolean {
  if (actor.id === target.id) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "client_admin") {
    return actor.orgId !== null && actor.orgId === target.orgId && !isStaff(target.role);
  }
  return false;
}

/** Almeno un amministratore attivo deve restare in ogni organizzazione. */
export function wouldRemoveLastAdmin(
  users: readonly Pick<User, "id" | "role" | "orgId" | "status">[],
  targetId: string,
  nextRole: Role | null,
): boolean {
  const target = users.find((u) => u.id === targetId);
  if (!target || target.role !== "client_admin" || target.orgId === null) return false;
  if (nextRole === "client_admin") return false;
  const admins = users.filter(
    (u) => u.orgId === target.orgId && u.role === "client_admin" && u.status === "active",
  );
  return admins.length <= 1 && admins[0]?.id === targetId;
}
