import Link from "next/link";
import { copy } from "@/content/it";
import { env } from "@/config/env";
import { routes } from "@/config/navigation";

/** Avviso della modalità demo con accesso rapido al pannello. */
export function DemoStrip() {
  if (!env.demoMode) return null;
  return (
    <div className="bg-fg text-canvas">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs sm:px-6">
        <span>{copy.demo.banner}</span>
        <Link href={routes.panel} className="font-semibold underline underline-offset-2">
          {copy.demo.panel} →
        </Link>
      </p>
    </div>
  );
}
