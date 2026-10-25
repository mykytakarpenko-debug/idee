import { Suspense } from "react";
import { copy } from "@/content/it";
import { DataBootstrap } from "@/components/layout/data-bootstrap";
import { PlayerGuard } from "@/components/play/player-guard";
import { AgeGate } from "@/components/site/age-gate";
import { DemoStrip } from "@/components/site/demo-strip";
import { RgBar } from "@/components/site/rg-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Toaster } from "@/components/ui/toast";

/** Sito pubblico e conto di gioco. Le avvertenze restano visibili su ogni pagina. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="fixed top-2 left-2 z-[100] -translate-y-20 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-md transition-transform focus:translate-y-0"
      >
        {copy.a11y.skipToContent}
      </a>
      <DataBootstrap />
      <DemoStrip />
      <SiteHeader />
      <RgBar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <AgeGate />
      </Suspense>
      <PlayerGuard />
      <Toaster />
    </div>
  );
}
