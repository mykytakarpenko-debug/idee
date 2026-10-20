import type { Metadata } from "next";
import { copy } from "@/content/it";
import { BookingView } from "@/features/site/booking-view";

export const metadata: Metadata = {
  title: copy.booking.title,
  description: copy.booking.description,
};

export default function BookingPage() {
  return <BookingView />;
}
