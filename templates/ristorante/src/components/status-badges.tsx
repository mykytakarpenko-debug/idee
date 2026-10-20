import {
  Ban,
  Bike,
  Check,
  ChefHat,
  CircleCheck,
  Hourglass,
  Inbox,
  PackageCheck,
  Utensils,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";
import type { OrderStatus, ReservationStatus } from "@/lib/domain/types";
import { Badge, type BadgeTone } from "./ui/badge";

/** Stati con colore + icona + testo (mai solo colore). */
const reservation: Record<ReservationStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  requested: { tone: "warning", icon: Hourglass },
  confirmed: { tone: "accent", icon: CircleCheck },
  seated: { tone: "info", icon: Utensils },
  completed: { tone: "success", icon: Check },
  no_show: { tone: "danger", icon: UserX },
  cancelled: { tone: "neutral", icon: Ban },
};

const order: Record<OrderStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  new: { tone: "warning", icon: Inbox },
  preparing: { tone: "info", icon: ChefHat },
  ready: { tone: "accent", icon: PackageCheck },
  out_for_delivery: { tone: "info", icon: Bike },
  completed: { tone: "success", icon: Check },
  cancelled: { tone: "neutral", icon: Ban },
};

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const { tone, icon: Icon } = reservation[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {copy.status.reservation[status]}
    </Badge>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { tone, icon: Icon } = order[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {copy.status.order[status]}
    </Badge>
  );
}
