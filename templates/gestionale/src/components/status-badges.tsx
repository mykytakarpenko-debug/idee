import {
  Ban,
  Check,
  CircleCheck,
  Clock,
  Hourglass,
  Sparkles,
  TriangleAlert,
  Undo2,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";
import type { AppointmentStatus, ClientStatus, PaymentDisplayStatus } from "@/lib/domain/types";
import { Badge, type BadgeTone } from "./ui/badge";

/** Ogni stato ha colore + icona + testo: mai solo colore. */
const appointment: Record<AppointmentStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  pending: { tone: "warning", icon: Hourglass },
  confirmed: { tone: "accent", icon: CircleCheck },
  completed: { tone: "success", icon: Check },
  cancelled: { tone: "neutral", icon: Ban },
  no_show: { tone: "danger", icon: UserX },
};

const payment: Record<PaymentDisplayStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  paid: { tone: "success", icon: Check },
  pending: { tone: "info", icon: Clock },
  overdue: { tone: "danger", icon: TriangleAlert },
  refunded: { tone: "neutral", icon: Undo2 },
};

const client: Record<ClientStatus, { tone: BadgeTone; icon?: LucideIcon }> = {
  active: { tone: "success" },
  lead: { tone: "accent", icon: Sparkles },
  inactive: { tone: "neutral" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { tone, icon: Icon } = appointment[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {copy.status.appointment[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentDisplayStatus }) {
  const { tone, icon: Icon } = payment[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {copy.status.payment[status]}
    </Badge>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { tone, icon: Icon } = client[status];
  return (
    <Badge tone={tone}>
      {Icon ? (
        <Icon aria-hidden />
      ) : (
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
      )}
      {copy.status.client[status]}
    </Badge>
  );
}

/** Colore (token CSS) associato allo stato dell'appuntamento, per grafici e calendario. */
export const appointmentStatusColor: Record<AppointmentStatus, string> = {
  completed: "var(--success)",
  confirmed: "var(--accent)",
  pending: "var(--warning)",
  cancelled: "var(--line-strong)",
  no_show: "var(--danger)",
};
