"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDemoData, DEMO_SETTINGS } from "@/lib/demo/seed";
import { maskIp } from "@/lib/domain/auth";
import { toISODate } from "@/lib/domain/dates";
import { assignableRoles, can, canManageUser, wouldRemoveLastAdmin } from "@/lib/domain/rbac";
import { nextStatuses, ticketNumber } from "@/lib/domain/tickets";
import type {
  AuditAction,
  DataSnapshot,
  DocumentFile,
  Folder,
  Organization,
  PortalSettings,
  Role,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  User,
} from "@/lib/domain/types";
import { createId } from "@/lib/utils";
import { createDebouncedStorage } from "./persist-storage";

/**
 * Store dei dati del portale. In demo vive nel browser; in produzione ogni
 * azione diventa una chiamata alle API che ricontrolla permessi e dati sul
 * server. Le azioni verificano comunque i permessi (difesa in profondità) e
 * registrano gli eventi rilevanti nel registro attività.
 */

export const DATA_STORAGE_KEY = "portale:data";
const DATA_VERSION = 1;

export type ActionResult =
  { ok: true } | { ok: false; reason: "forbidden" | "last_admin" | "duplicate" };

interface PersistedData extends DataSnapshot {
  initializedAt: string | null;
}

interface DataActions {
  init: () => Promise<void>;
  resetDemo: () => void;

  log: (actorId: string, action: AuditAction, target: string, orgId: string | null) => void;
  markLogin: (userId: string) => void;

  createTicket: (
    actorId: string,
    input: { subject: string; category: TicketCategory; priority: TicketPriority; body: string },
  ) => Ticket | null;
  replyTicket: (actorId: string, ticketId: string, body: string, internal: boolean) => void;
  setTicketStatus: (actorId: string, ticketId: string, status: TicketStatus) => void;
  assignTicket: (actorId: string, ticketId: string, assigneeId: string | null) => void;

  uploadDocument: (
    actorId: string,
    input: { name: string; folder: Folder; projectId: string | null },
  ) => DocumentFile | null;

  inviteUser: (
    actorId: string,
    input: { name: string; email: string; title: string; role: Role; orgId: string | null },
  ) => ActionResult;
  setUserRole: (actorId: string, userId: string, role: Role) => ActionResult;
  setUserActive: (actorId: string, userId: string, active: boolean) => ActionResult;
  resetMfa: (actorId: string, userId: string) => ActionResult;
  setOwnMfa: (userId: string, enabled: boolean) => void;

  updateOrganization: (actorId: string, orgId: string, input: Partial<Organization>) => void;
  markInvoicePaid: (actorId: string, invoiceId: string) => void;
  updateSettings: (actorId: string, input: Partial<PortalSettings>) => void;
}

export interface DataState extends PersistedData, DataActions {
  ready: boolean;
}

const emptyData: PersistedData = {
  initializedAt: null,
  organizations: [],
  users: [],
  projects: [],
  documents: [],
  tickets: [],
  invoices: [],
  audit: [],
  settings: DEMO_SETTINGS,
};

const nowIso = () => new Date().toISOString();
/** In demo l'IP è fittizio; in produzione lo legge il server (e lo anonimizza). */
const DEMO_IP = maskIp("93.41.12.7");
let initPromise: Promise<void> | null = null;

function replaceById<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<NoInfer<T>> | ((item: T) => Partial<NoInfer<T>>),
): T[] {
  return items.map((item) =>
    item.id === id ? { ...item, ...(typeof patch === "function" ? patch(item) : patch) } : item,
  );
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => {
      const actor = (id: string) => get().users.find((u) => u.id === id);
      const audit = (
        actorId: string,
        action: AuditAction,
        target: string,
        orgId: string | null,
      ) => ({
        id: createId("a"),
        at: nowIso(),
        actorId,
        action,
        target,
        orgId,
        ip: DEMO_IP,
      });
      const guardUser = (actorId: string, userId: string): { actor: User; target: User } | null => {
        const a = actor(actorId);
        const target = get().users.find((u) => u.id === userId);
        if (!a || !target || !canManageUser(a, target)) return null;
        if (!can(a.role, "team.manage") && !can(a.role, "users.manage")) return null;
        return { actor: a, target };
      };

      return {
        ...emptyData,
        ready: false,

        init() {
          initPromise ??= (async () => {
            await useDataStore.persist.rehydrate();
            if (!get().initializedAt)
              set({ ...createDemoData(new Date()), initializedAt: nowIso() });
            set({ ready: true });
            window.addEventListener("storage", (event) => {
              if (event.key === DATA_STORAGE_KEY) void useDataStore.persist.rehydrate();
            });
          })();
          return initPromise;
        },

        resetDemo() {
          set({ ...createDemoData(new Date()), initializedAt: nowIso() });
        },

        log(actorId, action, target, orgId) {
          set((state) => ({ audit: [...state.audit, audit(actorId, action, target, orgId)] }));
        },

        markLogin(userId) {
          const user = actor(userId);
          if (!user) return;
          set((state) => ({
            users: replaceById(state.users, userId, { lastLoginAt: nowIso() }),
            audit: [...state.audit, audit(userId, "auth.login", user.email, user.orgId)],
          }));
        },

        createTicket(actorId, input) {
          const a = actor(actorId);
          if (!a || !a.orgId || !can(a.role, "tickets.create")) return null;
          const at = nowIso();
          const ticket: Ticket = {
            id: createId("t"),
            number: ticketNumber(get().tickets.length + 1),
            orgId: a.orgId,
            subject: input.subject,
            category: input.category,
            priority: input.priority,
            status: "open",
            createdBy: actorId,
            assigneeId: null,
            createdAt: at,
            updatedAt: at,
            firstResponseAt: null,
            resolvedAt: null,
            messages: [
              { id: createId("msg"), authorId: actorId, body: input.body, at, internal: false },
            ],
          };
          set((state) => ({
            tickets: [...state.tickets, ticket],
            audit: [...state.audit, audit(actorId, "ticket.create", ticket.number, ticket.orgId)],
          }));
          return ticket;
        },

        replyTicket(actorId, ticketId, body, internal) {
          const a = actor(actorId);
          const ticket = get().tickets.find((t) => t.id === ticketId);
          if (!a || !ticket || ticket.status === "closed") return;
          const staff = can(a.role, "tickets.manage");
          if (!staff && (a.orgId !== ticket.orgId || !can(a.role, "tickets.create"))) return;
          const isInternal = internal && can(a.role, "tickets.internal");
          const at = nowIso();
          set((state) => ({
            tickets: replaceById(state.tickets, ticketId, (t) => ({
              messages: [
                ...t.messages,
                { id: createId("msg"), authorId: actorId, body, at, internal: isInternal },
              ],
              updatedAt: at,
              firstResponseAt: staff && !isInternal && !t.firstResponseAt ? at : t.firstResponseAt,
              // Una risposta del cliente riporta il ticket in lavorazione; quella dello staff lo prende in carico.
              status:
                !isInternal && staff && t.status === "open"
                  ? "in_progress"
                  : !staff && t.status === "waiting"
                    ? "in_progress"
                    : t.status,
              assigneeId: staff && !t.assigneeId ? actorId : t.assigneeId,
            })),
            audit: [...state.audit, audit(actorId, "ticket.reply", ticket.number, ticket.orgId)],
          }));
        },

        setTicketStatus(actorId, ticketId, status) {
          const a = actor(actorId);
          const ticket = get().tickets.find((t) => t.id === ticketId);
          if (!a || !ticket || !nextStatuses(ticket.status, a.role).includes(status)) return;
          if (!can(a.role, "tickets.manage") && a.orgId !== ticket.orgId) return;
          const at = nowIso();
          set((state) => ({
            tickets: replaceById(state.tickets, ticketId, (t) => ({
              status,
              updatedAt: at,
              resolvedAt:
                status === "resolved" || status === "closed" ? (t.resolvedAt ?? at) : null,
            })),
            audit: [...state.audit, audit(actorId, "ticket.status", ticket.number, ticket.orgId)],
          }));
        },

        assignTicket(actorId, ticketId, assigneeId) {
          const a = actor(actorId);
          const ticket = get().tickets.find((t) => t.id === ticketId);
          if (!a || !ticket || !can(a.role, "tickets.manage")) return;
          set((state) => ({
            tickets: replaceById(state.tickets, ticketId, { assigneeId, updatedAt: nowIso() }),
            audit: [...state.audit, audit(actorId, "ticket.assign", ticket.number, ticket.orgId)],
          }));
        },

        uploadDocument(actorId, input) {
          const a = actor(actorId);
          if (!a || !a.orgId || !can(a.role, "documents.upload")) return null;
          const extension = input.name.split(".").pop()?.toLowerCase() ?? "";
          const kind: DocumentFile["kind"] = ["png", "jpg", "jpeg", "webp"].includes(extension)
            ? "image"
            : ["xlsx", "csv", "ods"].includes(extension)
              ? "sheet"
              : ["doc", "docx", "odt"].includes(extension)
                ? "doc"
                : extension === "zip"
                  ? "zip"
                  : "pdf";
          const document: DocumentFile = {
            id: createId("d"),
            orgId: a.orgId,
            projectId: input.projectId,
            name: input.name,
            kind,
            folder: input.folder,
            sizeKb: 0,
            uploadedBy: actorId,
            uploadedAt: nowIso(),
            version: 1,
          };
          set((state) => ({
            documents: [...state.documents, document],
            audit: [
              ...state.audit,
              audit(actorId, "document.upload", document.name, document.orgId),
            ],
          }));
          return document;
        },

        inviteUser(actorId, input) {
          const a = actor(actorId);
          if (!a || !assignableRoles(a).includes(input.role))
            return { ok: false, reason: "forbidden" };
          // Il cliente invita solo nella propria azienda; l'amministratore ovunque.
          const orgId = a.role === "admin" ? input.orgId : a.orgId;
          if (a.role !== "admin" && !can(a.role, "team.manage"))
            return { ok: false, reason: "forbidden" };
          const email = input.email.toLowerCase();
          if (get().users.some((u) => u.email.toLowerCase() === email)) {
            return { ok: false, reason: "duplicate" };
          }
          const user: User = {
            id: createId("u"),
            name: input.name,
            email,
            title: input.title,
            orgId: input.role === "admin" || input.role === "support" ? null : orgId,
            role: input.role,
            status: "invited",
            mfaEnabled: false,
            lastLoginAt: null,
            createdAt: nowIso(),
          };
          set((state) => ({
            users: [...state.users, user],
            audit: [...state.audit, audit(actorId, "user.invite", email, user.orgId)],
          }));
          return { ok: true };
        },

        setUserRole(actorId, userId, role) {
          const guard = guardUser(actorId, userId);
          if (!guard || !assignableRoles(guard.actor).includes(role))
            return { ok: false, reason: "forbidden" };
          if (wouldRemoveLastAdmin(get().users, userId, role))
            return { ok: false, reason: "last_admin" };
          set((state) => ({
            users: replaceById(state.users, userId, { role }),
            audit: [
              ...state.audit,
              audit(actorId, "user.role", guard.target.email, guard.target.orgId),
            ],
          }));
          return { ok: true };
        },

        setUserActive(actorId, userId, active) {
          const guard = guardUser(actorId, userId);
          if (!guard) return { ok: false, reason: "forbidden" };
          if (!active && wouldRemoveLastAdmin(get().users, userId, null)) {
            return { ok: false, reason: "last_admin" };
          }
          set((state) => ({
            users: replaceById(state.users, userId, { status: active ? "active" : "disabled" }),
            audit: [
              ...state.audit,
              audit(
                actorId,
                active ? "user.enable" : "user.disable",
                guard.target.email,
                guard.target.orgId,
              ),
            ],
          }));
          return { ok: true };
        },

        resetMfa(actorId, userId) {
          const guard = guardUser(actorId, userId);
          if (!guard) return { ok: false, reason: "forbidden" };
          set((state) => ({
            users: replaceById(state.users, userId, { mfaEnabled: false }),
            audit: [
              ...state.audit,
              audit(actorId, "user.mfa_reset", guard.target.email, guard.target.orgId),
            ],
          }));
          return { ok: true };
        },

        setOwnMfa(userId, enabled) {
          const user = actor(userId);
          if (!user) return;
          set((state) => ({
            users: replaceById(state.users, userId, { mfaEnabled: enabled }),
            audit: [...state.audit, audit(userId, "security.mfa", user.email, user.orgId)],
          }));
        },

        updateOrganization(actorId, orgId, input) {
          const a = actor(actorId);
          const org = get().organizations.find((o) => o.id === orgId);
          if (!a || !org || !can(a.role, "clients.manage")) return;
          set((state) => ({
            organizations: replaceById(state.organizations, orgId, input),
            audit: [...state.audit, audit(actorId, "client.update", org.name, orgId)],
          }));
        },

        markInvoicePaid(actorId, invoiceId) {
          const a = actor(actorId);
          if (!a || !can(a.role, "clients.manage")) return;
          set((state) => ({
            invoices: replaceById(state.invoices, invoiceId, { paidAt: toISODate(new Date()) }),
          }));
        },

        updateSettings(actorId, input) {
          const a = actor(actorId);
          if (!a || !can(a.role, "settings.manage")) return;
          set((state) => ({
            settings: { ...state.settings, ...input },
            audit: [
              ...state.audit,
              audit(actorId, "settings.update", "Impostazioni del portale", null),
            ],
          }));
        },
      };
    },
    {
      name: DATA_STORAGE_KEY,
      version: DATA_VERSION,
      storage: createDebouncedStorage<PersistedData>(150),
      skipHydration: true,
      partialize: (state): PersistedData => ({
        initializedAt: state.initializedAt,
        organizations: state.organizations,
        users: state.users,
        projects: state.projects,
        documents: state.documents,
        tickets: state.tickets,
        invoices: state.invoices,
        audit: state.audit,
        settings: state.settings,
      }),
      migrate: (persisted) => persisted as PersistedData,
    },
  ),
);
