import {
  AlarmClock,
  ArrowDown,
  ArrowUp,
  Ban,
  CircleCheck,
  CircleDot,
  Clock,
  Flame,
  Hourglass,
  Mail,
  Minus,
  PauseCircle,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";
import type { InvoiceStatus } from "@/lib/domain/billing";
import type { SlaState } from "@/lib/domain/tickets";
import type {
  ProjectHealth,
  ProjectStatus,
  TicketPriority,
  TicketStatus,
  UserStatus,
} from "@/lib/domain/types";
import { Badge, type BadgeTone } from "./ui/badge";

/** Stati con colore + icona + testo (mai solo colore). */
type Style = { tone: BadgeTone; icon: LucideIcon };

function make<K extends string>(styles: Record<K, Style>, labels: Record<K, string>) {
  return function StatusBadge({ value }: { value: K }) {
    const { tone, icon: Icon } = styles[value];
    return (
      <Badge tone={tone}>
        <Icon aria-hidden />
        {labels[value]}
      </Badge>
    );
  };
}

export const TicketStatusBadge = make<TicketStatus>(
  {
    open: { tone: "info", icon: CircleDot },
    in_progress: { tone: "accent", icon: Clock },
    waiting: { tone: "warning", icon: Hourglass },
    resolved: { tone: "success", icon: CircleCheck },
    closed: { tone: "neutral", icon: CircleCheck },
  },
  copy.ticketStatus,
);

export const PriorityBadge = make<TicketPriority>(
  {
    low: { tone: "neutral", icon: ArrowDown },
    normal: { tone: "neutral", icon: Minus },
    high: { tone: "warning", icon: ArrowUp },
    urgent: { tone: "danger", icon: Flame },
  },
  copy.ticketPriority,
);

export const SlaBadge = make<SlaState>(
  {
    met: { tone: "success", icon: CircleCheck },
    on_time: { tone: "neutral", icon: Clock },
    at_risk: { tone: "warning", icon: AlarmClock },
    breached: { tone: "danger", icon: TriangleAlert },
  },
  copy.sla,
);

export const ProjectStatusBadge = make<ProjectStatus>(
  {
    planning: { tone: "info", icon: CircleDot },
    active: { tone: "accent", icon: Clock },
    on_hold: { tone: "warning", icon: PauseCircle },
    completed: { tone: "success", icon: CircleCheck },
  },
  copy.projectStatus,
);

export const HealthBadge = make<ProjectHealth>(
  {
    on_track: { tone: "success", icon: CircleCheck },
    at_risk: { tone: "warning", icon: TriangleAlert },
    off_track: { tone: "danger", icon: AlarmClock },
  },
  copy.projectHealth,
);

export const InvoiceStatusBadge = make<InvoiceStatus>(
  {
    paid: { tone: "success", icon: CircleCheck },
    due: { tone: "info", icon: Clock },
    overdue: { tone: "danger", icon: TriangleAlert },
  },
  copy.invoiceStatus,
);

export const UserStatusBadge = make<UserStatus>(
  {
    active: { tone: "success", icon: CircleCheck },
    invited: { tone: "info", icon: Mail },
    disabled: { tone: "neutral", icon: Ban },
  },
  copy.userStatus,
);
