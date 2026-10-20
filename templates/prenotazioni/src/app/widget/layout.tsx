import type { Metadata } from "next";
import { DataBootstrap } from "@/components/layout/data-bootstrap";
import { Toaster } from "@/components/ui/toast";

/**
 * Widget di prenotazione da incorporare in altri siti con un iframe.
 * Gli header (CSP frame-ancestors) sono definiti in next.config.ts.
 */
export const metadata: Metadata = {
  title: "Prenota",
  robots: { index: false, follow: false },
};

export default function WidgetLayout({ children }: LayoutProps<"/widget">) {
  return (
    <>
      <DataBootstrap />
      <main id="main" className="min-h-dvh bg-canvas">
        {children}
      </main>
      <Toaster />
    </>
  );
}
