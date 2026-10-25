import type { Metadata } from "next";
import { Suspense } from "react";
import { copy } from "@/content/it";
import { site } from "@/content/site";
import { Container, SectionHeading } from "@/components/site/section";
import { ContactForm } from "@/features/contact/contact-form";

const t = copy.contact;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
  alternates: { canonical: "/contatti" },
};

export default function ContactPage() {
  return (
    <Container className="animate-page-in py-16 sm:py-20">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <SectionHeading as="h1" title={t.title} description={t.description} />
          <p className="mt-6 text-sm text-fg-muted">
            {t.direct}{" "}
            <a
              href={`mailto:${site.email}`}
              className="font-medium text-accent-text underline underline-offset-2"
            >
              {site.email}
            </a>
          </p>
          <address className="mt-2 text-sm text-fg-muted not-italic">{site.address}</address>
        </div>
        <Suspense
          fallback={<div className="h-[34rem] rounded-2xl border border-line bg-surface" />}
        >
          <ContactForm />
        </Suspense>
      </div>
    </Container>
  );
}
