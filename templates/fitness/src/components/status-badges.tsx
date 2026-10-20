import {
  Ban,
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  FileQuestion,
  Hourglass,
  Inbox,
  Pause,
  Phone,
  UserCheck,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/content/it";
import type { CertificateStatus, MembershipStatus } from "@/lib/domain/membership";
import type { BookingStatus, PaymentStatus, TrialStatus } from "@/lib/domain/types";
import { Badge, type BadgeTone } from "./ui/badge";

/** Stati con colore + icona + testo (mai solo colore). */
type Style = { tone: BadgeTone; icon: LucideIcon };

const membership: Record<MembershipStatus, Style> = {
  active: { tone: "success", icon: CircleCheck },
  expiring: { tone: "warning", icon: Hourglass },
  expired: { tone: "danger", icon: CircleX },
  suspended: { tone: "neutral", icon: Pause },
};

const certificate: Record<CertificateStatus, Style> = {
  valid: { tone: "success", icon: Check },
  expiring: { tone: "warning", icon: Clock },
  expired: { tone: "danger", icon: CircleAlert },
  missing: { tone: "danger", icon: FileQuestion },
  not_required: { tone: "neutral", icon: Check },
};

const booking: Record<BookingStatus, Style> = {
  booked: { tone: "accent", icon: CircleCheck },
  waitlist: { tone: "warning", icon: Hourglass },
  cancelled: { tone: "neutral", icon: Ban },
  attended: { tone: "success", icon: UserCheck },
  no_show: { tone: "danger", icon: UserX },
};

const payment: Record<PaymentStatus, Style> = {
  paid: { tone: "success", icon: Check },
  due: { tone: "warning", icon: Clock },
  failed: { tone: "danger", icon: CircleX },
};

const trial: Record<TrialStatus, Style> = {
  new: { tone: "warning", icon: Inbox },
  contacted: { tone: "info", icon: Phone },
  converted: { tone: "success", icon: UserCheck },
  lost: { tone: "neutral", icon: Ban },
};

function StatusBadge({ style, label }: { style: Style; label: string }) {
  const Icon = style.icon;
  return (
    <Badge tone={style.tone}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}

export function MembershipBadge({ status }: { status: MembershipStatus }) {
  return <StatusBadge style={membership[status]} label={copy.status.membership[status]} />;
}

export function CertificateBadge({ status }: { status: CertificateStatus }) {
  return <StatusBadge style={certificate[status]} label={copy.status.certificate[status]} />;
}

export function BookingBadge({ status }: { status: BookingStatus }) {
  return <StatusBadge style={booking[status]} label={copy.status.booking[status]} />;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge style={payment[status]} label={copy.status.payment[status]} />;
}

export function TrialBadge({ status }: { status: TrialStatus }) {
  return <StatusBadge style={trial[status]} label={copy.status.trial[status]} />;
}
