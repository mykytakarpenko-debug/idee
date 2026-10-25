import type { Metadata } from "next";
import Link from "next/link";
import { copy, HELPLINE } from "@/content/it";
import { routes } from "@/config/navigation";
import { Container } from "@/components/site/section";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: copy.minors.title,
  robots: { index: false, follow: false },
};

export default function MinorsPage() {
  const t = copy.minors;
  return (
    <Container className="max-w-xl animate-page-in py-16 text-center sm:py-24">
      <p
        aria-hidden
        className="mx-auto inline-flex rounded-md border-2 border-fg px-2 font-display text-2xl font-bold text-fg"
      >
        18+
      </p>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-fg">{t.title}</h1>
      <p className="mt-4 text-fg-muted">{t.text}</p>
      <p className="mt-4 text-fg-muted">
        {t.help}{" "}
        <a
          href={`tel:${HELPLINE.number}`}
          className="font-semibold text-accent-text underline underline-offset-2"
        >
          {HELPLINE.short}
        </a>
        .
      </p>
      <Link
        href={routes.responsible}
        className={buttonClasses({ variant: "secondary", className: "mt-8" })}
      >
        {copy.site.nav.responsible}
      </Link>
    </Container>
  );
}
