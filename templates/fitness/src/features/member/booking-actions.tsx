"use client";

import { addMinutes } from "date-fns";
import { copy } from "@/content/it";
import { cancellationInfo } from "@/lib/domain/booking";
import type { Booking, ClassSession, ClubSettings, Course } from "@/lib/domain/types";
import { downloadFile } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { createIcsEvent } from "@/lib/ics";
import { useDataStore } from "@/store/data-store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";

const b = copy.member.book;

/** Scarica la lezione come evento di calendario (.ics). */
export function downloadSessionIcs(session: ClassSession, course: Course, settings: ClubSettings) {
  const start = new Date(session.start);
  downloadFile(
    `lezione-${course.id}-${formatDate(start, "inputDate")}.ics`,
    createIcsEvent({
      uid: `${session.id}@forma`,
      start,
      end: addMinutes(start, session.durationMin),
      title: `${course.name} · ${settings.name}`,
      location: `${settings.address}, ${settings.postalCode} ${settings.city}`,
      description: copy.rooms[session.room],
    }),
    "text/calendar;charset=utf-8",
  );
}

/**
 * Conferma di cancellazione: avvisa se è tardiva (entro il termine) e
 * ricorda che il posto andrà al primo in lista d'attesa.
 */
export function CancelBookingDialog({
  booking,
  session,
  onClose,
}: {
  booking: Booking | null;
  session: ClassSession | undefined;
  onClose: () => void;
}) {
  const settings = useDataStore((state) => state.settings);
  const cancelBooking = useDataStore((state) => state.cancelBooking);
  const info = booking && session ? cancellationInfo(booking, session, settings, new Date()) : null;
  const late = info?.late ?? false;
  const leaving = booking?.status === "waitlist";

  return (
    <ConfirmDialog
      open={booking !== null}
      onOpenChange={(open) => !open && onClose()}
      title={late ? b.lateTitle : b.cancelTitle}
      description={late ? b.lateText(settings.booking.cancelHours) : leaving ? "" : b.cancelText}
      confirmLabel={late ? b.lateConfirm : leaving ? b.leave : b.cancel}
      tone={late ? "danger" : "default"}
      onConfirm={() => {
        if (!booking) return;
        cancelBooking(booking.id);
        toast.success(b.cancelledToast);
        onClose();
      }}
    />
  );
}
