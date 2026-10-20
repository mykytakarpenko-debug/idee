import { Ban, Check, CircleCheck, Hourglass, UserX, type LucideIcon } from "lucide-react";
import { copy } from "@/content/it";
import type { AppointmentStatus } from "@/lib/domain/types";
import { Badge, type BadgeTone } from "./ui/badge";

/** Stato dell'appuntamento: colore + icona + testo (mai solo colore). */
const styles: Record<AppointmentStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  pending: { tone: "warning", icon: Hourglass },
  confirmed: { tone: "accent", icon: CircleCheck },
  completed: { tone: "success", icon: Check },
  cancelled: { tone: "neutral", icon: Ban },
  no_show: { tone: "danger", icon: UserX },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { tone, icon: Icon } = styles[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {copy.status[status]}
    </Badge>
  );
}
