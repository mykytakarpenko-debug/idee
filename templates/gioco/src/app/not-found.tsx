import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-3xl font-medium text-fg">{DEMO_SETTINGS.name}</p>
      <div className="max-w-sm">
        <p className="text-sm font-medium text-accent-text">404</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-fg">
          {copy.errors.notFoundTitle}
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{copy.errors.notFoundBody}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href={routes.home} className={buttonClasses({})}>
          {copy.errors.goHome}
        </Link>
        <Link href={routes.responsible} className={buttonClasses({ variant: "secondary" })}>
          {copy.site.nav.responsible}
        </Link>
      </div>
    </main>
  );
}
