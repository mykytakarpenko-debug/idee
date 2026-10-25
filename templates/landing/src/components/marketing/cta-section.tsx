import Link from "next/link";
import { copy } from "@/content/it";
import { hero } from "@/content/site";
import { routes } from "@/config/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/site/section";

export function CtaSection() {
  return (
    <section aria-labelledby="cta-finale" className="py-16 sm:py-20">
      <Container>
        <div className="rounded-3xl bg-accent px-6 py-12 text-center sm:px-12">
          <h2
            id="cta-finale"
            className="text-3xl font-semibold tracking-tight text-balance text-accent-fg sm:text-4xl"
          >
            {copy.home.ctaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-accent-fg/90">{copy.home.ctaText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={routes.contact}
              className={buttonClasses({ size: "lg", variant: "secondary" })}
            >
              {hero.primary}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
