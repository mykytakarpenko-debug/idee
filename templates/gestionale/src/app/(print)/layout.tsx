import { DataBootstrap } from "@/components/layout/data-bootstrap";

/** Layout essenziale per documenti da stampare (senza navigazione). */
export default function PrintLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <DataBootstrap />
      <main id="main">{children}</main>
    </>
  );
}
