import type { Metadata } from "next";
import { Check } from "lucide-react";
import { copy } from "@/content/it";
import { features } from "@/content/site";
import { env } from "@/config/env";
import { breadcrumbJsonLd } from "@/lib/seo";
import { CtaSection } from "@/components/marketing/cta-section";
import { JsonLd } from "@/components/site/json-ld";
import { Container, SectionHeading } from "@/components/site/section";

const t = copy.features;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
  alternates: { canonical: "/funzionalita" },
};

export default function FeaturesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: t.title, path: "/funzionalita" },
          ],
          env.siteUrl,
        )}
      />
      <Container className="animate-page-in py-16 sm:py-20">
        <SectionHeading as="h1" title={t.title} description={t.description} />
        <div className="mt-12 grid gap-6">
          {features.map((feature, i) => (
            <section
              key={feature.id}
              id={feature.id}
              aria-labelledby={`${feature.id}-titolo`}
              className="grid gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:grid-cols-[auto_1fr_1fr] md:items-start"
            >
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-sm font-semibold text-accent-soft-fg"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 id={`${feature.id}-titolo`} className="text-xl font-semibold text-fg">
                  {feature.title}
                </h2>
                <p className="mt-2 text-fg-muted">{feature.text}</p>
              </div>
              <ul className="grid gap-2 text-sm text-fg">
                {feature.points.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
      <CtaSection />
    </>
  );
}
