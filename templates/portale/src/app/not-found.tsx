import Link from "next/link";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xl font-semibold text-fg">{DEMO_SETTINGS.providerName}</p>
      <div className="max-w-sm">
        <p className="text-sm font-medium text-accent-text">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">
          {copy.errors.notFoundTitle}
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{copy.errors.notFoundBody}</p>
      </div>
      <Link href={routes.login} className={buttonClasses({})}>
        {copy.errors.goHome}
      </Link>
    </main>
  );
}
