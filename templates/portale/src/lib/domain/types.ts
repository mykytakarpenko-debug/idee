/**
 * Modello dati di Portale (area clienti e amministrazione di un fornitore di servizi).
 * Importi in centesimi di euro (interi); date ISO.
 */

export type ID = string;
export type Cents = number;
/** Data di calendario locale "YYYY-MM-DD". */
export type ISODate = string;
/** Istante ISO 8601. */
export type ISODateTime = string;

export type Plan = "base" | "pro" | "enterprise";

export interface Organization {
  id: ID;
  name: string;
  sector: string;
  city: string;
  vatNumber: string;
  plan: Plan;
  /** Referente interno (utente staff). */
  accountManagerId: ID;
  active: boolean;
  createdAt: ISODate;
}

/** Ruoli: tre lato cliente, due lato fornitore. */
export type Role = "client_admin" | "client_member" | "client_viewer" | "support" | "admin";

export type UserStatus = "active" | "invited" | "disabled";

export interface User {
  id: ID;
  name: string;
  email: string;
  title: string;
  /** null per lo staff del fornitore. */
  orgId: ID | null;
  role: Role;
  status: UserStatus;
  mfaEnabled: boolean;
  lastLoginAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type ProjectHealth = "on_track" | "at_risk" | "off_track";

export interface Milestone {
  id: ID;
  title: string;
  due: ISODate;
  done: boolean;
}

export interface Project {
  id: ID;
  orgId: ID;
  name: string;
  description: string;
  status: ProjectStatus;
  health: ProjectHealth;
  start: ISODate;
  due: ISODate;
  managerId: ID;
  milestones: Milestone[];
}

export type DocumentKind = "pdf" | "doc" | "sheet" | "image" | "zip";
export type Folder = "contratti" | "consegne" | "report" | "amministrazione";

export interface DocumentFile {
  id: ID;
  orgId: ID;
  projectId: ID | null;
  name: string;
  kind: DocumentKind;
  folder: Folder;
  sizeKb: number;
  uploadedBy: ID;
  uploadedAt: ISODateTime;
  version: number;
}

export type TicketCategory = "bug" | "request" | "question" | "billing";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

export interface TicketMessage {
  id: ID;
  authorId: ID;
  body: string;
  at: ISODateTime;
  /** Nota interna dello staff: mai visibile al cliente. */
  internal: boolean;
}

export interface Ticket {
  id: ID;
  number: string;
  orgId: ID;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: ID;
  assigneeId: ID | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  /** Prima risposta pubblica dello staff (per lo SLA). */
  firstResponseAt: ISODateTime | null;
  resolvedAt: ISODateTime | null;
  messages: TicketMessage[];
}

export interface InvoiceLine {
  description: string;
  amount: Cents;
}

export interface Invoice {
  id: ID;
  number: string;
  orgId: ID;
  issueDate: ISODate;
  dueDate: ISODate;
  vatRate: number;
  lines: InvoiceLine[];
  paidAt: ISODate | null;
}

export type AuditAction =
  | "auth.login"
  | "auth.mfa_failed"
  | "auth.logout"
  | "user.invite"
  | "user.role"
  | "user.disable"
  | "user.enable"
  | "user.mfa_reset"
  | "ticket.create"
  | "ticket.reply"
  | "ticket.status"
  | "ticket.assign"
  | "document.upload"
  | "document.download"
  | "invoice.download"
  | "client.update"
  | "settings.update"
  | "security.mfa";

export interface AuditEvent {
  id: ID;
  at: ISODateTime;
  actorId: ID;
  action: AuditAction;
  /** Descrizione breve dell'oggetto (es. numero del ticket, email dell'utente). */
  target: string;
  orgId: ID | null;
  /** Indirizzo IP già anonimizzato (ultimo ottetto rimosso). */
  ip: string;
}

export interface PortalSettings {
  providerName: string;
  supportEmail: string;
  /** Ore per la prima risposta, per priorità. */
  slaHours: Record<TicketPriority, number>;
  /** MFA obbligatoria per tutti gli utenti. */
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  auditRetentionDays: number;
  vatRate: number;
}

export interface DataSnapshot {
  organizations: Organization[];
  users: User[];
  projects: Project[];
  documents: DocumentFile[];
  tickets: Ticket[];
  invoices: Invoice[];
  audit: AuditEvent[];
  settings: PortalSettings;
}
