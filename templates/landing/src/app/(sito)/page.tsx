import { ArrowRight, Quote } from "lucide-react";
import Link from "next/link";
import { copy } from "@/content/it";
import { features, hero, stats, steps, testimonials } from "@/content/site";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";
import { organizationJsonLd, softwareJsonLd, faqJsonLd } from "@/lib/seo";
import { CtaSection } from "@/components/marketing/cta-section";
import { FaqList } from "@/components/marketing/faq-list";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { JsonLd } from "@/components/site/json-ld";
import { Container, SectionHeading } from "@/components/site/section";
import { buttonClasses } from "@/components/ui/button";

const t = copy.home;

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd(env.siteUrl)} />
      <JsonLd data={softwareJsonLd(env.siteUrl)} />
      <JsonLd data={faqJsonLd()} />

      <section className="overflow-hidden">
        <Container className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-sm font-medium text-accent-text">{hero.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-fg sm:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-fg-muted">{hero.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={routes.contact} className={buttonClasses({ size: "lg" })}>
                {hero.primary}
              </Link>
              <Link
                href={routes.pricing}
                className={buttonClasses({ size: "lg", variant: "secondary" })}
              >
                {hero.secondary}
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-fg-muted">{hero.note}</p>
          </div>
          <ProductMockup />
        </Container>
      </section>

      <section aria-label="Numeri" className="border-y border-line bg-surface">
        <Container>
          <dl className="grid divide-line py-8 sm:grid-cols-3 sm:divide-x">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 py-3 text-center">
                <dt className="order-2 text-sm text-fg-muted">{s.label}</dt>
                <dd className="order-1 text-3xl font-semibold tracking-tight text-fg tabular-nums">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section aria-labelledby="funzioni" className="py-16 sm:py-24">
        <Container>
          <SectionHeading id="funzioni" title={t.features} description={t.featuresText} />
          <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.id}>
                <h3 className="text-base font-semibold text-fg">{f.title}</h3>
                <p className="mt-2 text-sm text-fg-muted">{f.text}</p>
              </li>
            ))}
          </ul>
          <Link
            href={routes.features}
            className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline"
          >
            {copy.features.title}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </Container>
      </section>

      <section aria-labelledby="passi" className="border-y border-line bg-surface py-16 sm:py-20">
        <Container>
          <SectionHeading id="passi" title={t.steps} />
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-soft-fg"
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-fg">{step.title}</h3>
                <p className="mt-1 text-sm text-fg-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="testimonianze" className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            id="testimonianze"
            title={t.testimonials}
            description={t.testimonialsNote}
          />
          <ul className="mt-10 grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <li key={item.name}>
                <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
                  <Quote aria-hidden className="size-6 text-accent-text" />
                  <blockquote className="mt-3 flex-1 text-fg">“{item.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="block font-semibold text-fg">{item.name}</span>
                    <span className="text-fg-muted">{item.role}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="prezzi" className="border-y border-line bg-surface py-16 sm:py-24">
        <Container>
          <SectionHeading
            id="prezzi"
            title={t.pricing}
            description={t.pricingText}
            className="justify-center text-center [&>div]:mx-auto"
          />
          <div className="mt-10">
            <PricingPlans />
          </div>
        </Container>
      </section>

      <section aria-labelledby="faq" className="py-16 sm:py-24">
        <Container className="max-w-3xl">
          <SectionHeading id="faq" title={t.faq} />
          <div className="mt-8">
            <FaqList />
          </div>
        </Container>
      </section>

      <CtaSection />
    </>
  );
}
