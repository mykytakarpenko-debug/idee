import type { Metadata } from "next";
import { copy } from "@/content/it";
import { Container } from "@/components/site/section";
import { BookingWizard } from "@/features/site/booking-wizard";

export const metadata: Metadata = { title: copy.booking.title };

export default function BookPage() {
  return (
    <Container className="animate-page-in py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        {copy.booking.title}
      </h1>
      <div className="mt-8">
        <BookingWizard source="online" />
      </div>
    </Container>
  );
}
