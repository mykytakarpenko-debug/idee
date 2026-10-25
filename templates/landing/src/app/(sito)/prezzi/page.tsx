import type { Metadata } from "next";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { faqJsonLd, softwareJsonLd } from "@/lib/seo";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { FaqList } from "@/components/marketing/faq-list";
import { PricingCalculator } from "@/components/marketing/pricing-calculator";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { JsonLd } from "@/components/site/json-ld";
import { Container, SectionHeading } from "@/components/site/section";

const t = copy.pricing;

export const metadata: Metadata = {
  title: t.title,
  description: t.description,
  alternates: { canonical: "/prezzi" },
};

export default function PricingPage() {
  return (
    <>
      <JsonLd data={softwareJsonLd(env.siteUrl)} />
      <JsonLd data={faqJsonLd()} />
      <Container className="animate-page-in py-16 sm:py-20">
        <SectionHeading
          as="h1"
          title={t.title}
          description={t.description}
          className="justify-center text-center [&>div]:mx-auto"
        />
        <div className="mt-10">
          <PricingPlans headingLevel="h2" />
        </div>
        <div className="mt-16 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
          <section aria-labelledby="confronto">
            <h2 id="confronto" className="mb-4 text-2xl font-semibold tracking-tight text-fg">
              {t.compare}
            </h2>
            <ComparisonTable />
          </section>
          <div className="lg:mt-12">
            <PricingCalculator />
          </div>
        </div>
        <section aria-labelledby="domande" className="mx-auto mt-16 max-w-3xl">
          <h2 id="domande" className="mb-6 text-2xl font-semibold tracking-tight text-fg">
            {copy.home.faq}
          </h2>
          <FaqList />
        </section>
      </Container>
    </>
  );
}
