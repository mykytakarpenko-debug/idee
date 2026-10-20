import {
  Ban,
  CircleCheck,
  Clock,
  PackageCheck,
  PackageOpen,
  RotateCcw,
  Truck,
  Undo2,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";
import type { OrderStatus, ReturnStatus } from "@/lib/domain/types";
import { Badge, type BadgeTone } from "./ui/badge";

/** Stati di ordini e resi: colore + icona + testo (mai solo colore). */
const orderStyles: Record<OrderStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  awaiting_payment: { tone: "warning", icon: Wallet },
  paid: { tone: "info", icon: CircleCheck },
  processing: { tone: "accent", icon: PackageOpen },
  shipped: { tone: "accent", icon: Truck },
  delivered: { tone: "success", icon: PackageCheck },
  cancelled: { tone: "neutral", icon: Ban },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { tone, icon: Icon } = orderStyles[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {copy.orderStatus[status]}
    </Badge>
  );
}

const returnStyles: Record<ReturnStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  requested: { tone: "warning", icon: Clock },
  approved: { tone: "info", icon: RotateCcw },
  refunded: { tone: "success", icon: Undo2 },
  rejected: { tone: "danger", icon: XCircle },
};

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  const { tone, icon: Icon } = returnStyles[status];
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {copy.returnStatus[status]}
    </Badge>
  );
}
