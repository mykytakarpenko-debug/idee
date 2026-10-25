import type { Metadata } from "next";
import { about } from "@/content/site";
import { CtaSection } from "@/components/marketing/cta-section";
import { Container, SectionHeading } from "@/components/site/section";
import { Avatar } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: about.title,
  description: about.intro,
  alternates: { canonical: "/chi-siamo" },
};

export default function AboutPage() {
  return (
    <>
      <Container className="max-w-3xl animate-page-in py-16 sm:py-20">
        <SectionHeading as="h1" title={about.title} description={about.intro} />
        <div className="mt-8 space-y-4 text-lg text-fg">
          {about.story.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Container>
      <section aria-labelledby="valori" className="border-y border-line bg-surface py-16">
        <Container>
          <h2 id="valori" className="text-2xl font-semibold tracking-tight text-fg">
            I nostri principi
          </h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3">
            {about.values.map((v) => (
              <li key={v.title}>
                <h3 className="font-semibold text-fg">{v.title}</h3>
                <p className="mt-1 text-sm text-fg-muted">{v.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section aria-labelledby="team" className="py-16">
        <Container>
          <h2 id="team" className="text-2xl font-semibold tracking-tight text-fg">
            Il team
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {about.team.map((person) => (
              <li key={person.name} className="flex flex-col items-start gap-3">
                <Avatar name={person.name} size="lg" />
                <div>
                  <p className="font-semibold text-fg">{person.name}</p>
                  <p className="text-sm text-fg-muted">{person.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <CtaSection />
    </>
  );
}
